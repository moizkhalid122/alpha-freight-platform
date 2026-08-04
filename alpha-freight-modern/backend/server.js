require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Ollama } = require('ollama');
const { createClient } = require('@supabase/supabase-js');
const {
  isExternalWebQuestion,
  buildWebSearchAssistantReply,
} = require('./web-search');
const { requireSupabaseAuth, AI_REQUIRE_AUTH } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3003;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL_NAME = process.env.MODEL_NAME || 'llama3.1';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
const SUPABASE_VECTOR_RPC = process.env.SUPABASE_VECTOR_RPC || 'match_kb_chunks';
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';
const ollama = new Ollama({ host: OLLAMA_URL });
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let embeddingExtractorPromise = null;
let localVectorIndexPromise = null;
let localVectorIndex = [];
let localVectorIndexError = null;
let supabaseVectorRpcChecked = false;
let supabaseVectorRpcError = null;

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed: ${origin}`));
  },
  credentials: true,
}));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// Load knowledge base
const knowledgeBase = [];
const kbDir = path.join(__dirname, '../knowledge-base');

try {
  if (fs.existsSync(kbDir)) {
    const files = fs.readdirSync(kbDir);
    files.forEach(file => {
      if (file.endsWith('.txt')) {
        const content = fs.readFileSync(path.join(kbDir, file), 'utf8');
        knowledgeBase.push({
          title: file.replace('.txt', ''),
          content: content
        });
      }
    });
    console.log(`✅ Loaded ${knowledgeBase.length} knowledge base documents`);
  }
} catch (err) {
  console.error('❌ Error loading knowledge base:', err);
}

function chunkKnowledgeDocument(title, content) {
  const cleanContent = String(content || '').replace(/\r/g, '').trim();
  if (!cleanContent) {
    return [];
  }

  const paragraphChunks = cleanContent
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const chunks = [];
  paragraphChunks.forEach((chunk, index) => {
    if (chunk.length <= 850) {
      chunks.push({
        id: `${title}::${index}`,
        title,
        content: chunk,
      });
      return;
    }

    for (let start = 0, part = 0; start < chunk.length; start += 650, part += 1) {
      const sliced = chunk.slice(start, start + 850).trim();
      if (!sliced) continue;
      chunks.push({
        id: `${title}::${index}::${part}`,
        title,
        content: sliced,
      });
    }
  });

  return chunks;
}

const knowledgeChunks = knowledgeBase.flatMap((doc) => chunkKnowledgeDocument(doc.title, doc.content));

async function getEmbeddingExtractor() {
  if (!embeddingExtractorPromise) {
    embeddingExtractorPromise = import('@xenova/transformers')
      .then(({ pipeline }) => pipeline('feature-extraction', EMBEDDING_MODEL))
      .catch((error) => {
        embeddingExtractorPromise = null;
        throw error;
      });
  }

  return embeddingExtractorPromise;
}

async function embedText(text) {
  const extractor = await getEmbeddingExtractor();
  const output = await extractor(String(text || ''), {
    pooling: 'mean',
    normalize: true
  });

  return Array.from(output.data);
}

function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || left.length === 0) {
    return 0;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }

  if (!leftNorm || !rightNorm) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

async function ensureLocalVectorIndex() {
  if (!localVectorIndexPromise) {
    localVectorIndexPromise = (async () => {
      const indexedChunks = [];

      for (const chunk of knowledgeChunks) {
        const embedding = await embedText(`${chunk.title}\n${chunk.content}`);
        indexedChunks.push({
          ...chunk,
          embedding
        });
      }

      localVectorIndex = indexedChunks;
      localVectorIndexError = null;
      console.log(`✅ Local vector index ready with ${indexedChunks.length} chunks`);
      return indexedChunks;
    })().catch((error) => {
      localVectorIndexPromise = null;
      localVectorIndexError = error.message;
      console.warn('⚠️ Local vector index init failed:', error.message);
      return [];
    });
  }

  return localVectorIndexPromise;
}

function scoreKeywordChunks(query, assistantType = 'general') {
  const normalizedQuery = String(query || '').toLowerCase();
  const keywords = normalizedQuery
    .split(/[^a-z0-9\u0600-\u06FF]+/i)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);

  return knowledgeChunks
    .map((chunk) => {
      const content = chunk.content.toLowerCase();
      const title = chunk.title.toLowerCase();
      let score = 0;

      if (content.includes(normalizedQuery) || title.includes(normalizedQuery)) {
        score += 10;
      }

      keywords.forEach((keyword) => {
        if (content.includes(keyword)) score += 1;
        if (title.includes(keyword)) score += 1;
      });

      if (assistantType === 'carrier' && title.includes('carrier')) score += 3;
      if (assistantType === 'supplier' && (title.includes('supplier') || title.includes('shipper'))) score += 3;

      return { ...chunk, score, source: 'keyword' };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

async function scoreLocalSemanticChunks(query, assistantType = 'general') {
  try {
    const [queryEmbedding, indexedChunks] = await Promise.all([
      embedText(query),
      ensureLocalVectorIndex()
    ]);

    return indexedChunks
      .map((chunk) => {
        let score = cosineSimilarity(queryEmbedding, chunk.embedding);
        const title = chunk.title.toLowerCase();

        if (assistantType === 'carrier' && title.includes('carrier')) score += 0.04;
        if (assistantType === 'supplier' && (title.includes('supplier') || title.includes('shipper'))) score += 0.04;

        return { ...chunk, score, source: 'local_vector' };
      })
      .filter((chunk) => chunk.score > 0.15)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  } catch (error) {
    console.warn('⚠️ Local semantic retrieval unavailable:', error.message);
    return [];
  }
}

async function scoreSupabaseSemanticChunks(query, assistantType = 'general') {
  if (!supabase) {
    return [];
  }

  try {
    supabaseVectorRpcChecked = true;
    const queryEmbedding = await embedText(query);
    const { data, error } = await supabase.rpc(SUPABASE_VECTOR_RPC, {
      query_embedding: queryEmbedding,
      match_count: 4,
      assistant_type: assistantType
    });

    if (error) {
      throw error;
    }

    if (!Array.isArray(data)) {
      return [];
    }

    supabaseVectorRpcError = null;
    return data.map((item, index) => ({
      id: item.id || `supabase::${index}`,
      title: item.title || 'Supabase knowledge',
      content: item.content || '',
      score: Number(item.similarity || item.score || 0),
      source: 'supabase_vector'
    }));
  } catch (error) {
    supabaseVectorRpcChecked = true;
    supabaseVectorRpcError = error.message;
    if (!scoreSupabaseSemanticChunks.warned) {
      console.warn(`⚠️ Supabase vector RPC "${SUPABASE_VECTOR_RPC}" unavailable: ${error.message}`);
      scoreSupabaseSemanticChunks.warned = true;
    }
    return [];
  }
}

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Alpha Freight AI Backend is running!',
    environment: NODE_ENV,
    authRequired: AI_REQUIRE_AUTH,
    knowledgeBaseCount: knowledgeBase.length,
    knowledgeChunkCount: knowledgeChunks.length,
    vectorChunks: localVectorIndex.length,
    vectorIndexReady: localVectorIndex.length > 0,
    vectorWarmupInProgress: Boolean(localVectorIndexPromise) && localVectorIndex.length === 0 && !localVectorIndexError,
    vectorWarmupError: localVectorIndexError,
    supabaseConfigured: Boolean(supabase),
    supabaseVectorRpc: SUPABASE_VECTOR_RPC,
    supabaseVectorRpcChecked,
    supabaseVectorRpcAvailable: Boolean(supabase) && supabaseVectorRpcChecked && !supabaseVectorRpcError,
    supabaseVectorRpcError,
    model: MODEL_NAME,
    webSearchConfigured: Boolean(TAVILY_API_KEY),
    ...(IS_PRODUCTION
      ? {}
      : {
          ollamaUrl: OLLAMA_URL,
        }),
  });
});

async function findRelevantKnowledge(query, assistantType = 'general') {
  const [keywordMatches, localSemanticMatches, supabaseSemanticMatches] = await Promise.all([
    Promise.resolve(scoreKeywordChunks(query, assistantType)),
    scoreLocalSemanticChunks(query, assistantType),
    scoreSupabaseSemanticChunks(query, assistantType)
  ]);

  const merged = new Map();
  const allMatches = [...keywordMatches, ...localSemanticMatches, ...supabaseSemanticMatches];

  allMatches.forEach((match) => {
    const existing = merged.get(match.id);
    if (!existing || match.score > existing.score) {
      merged.set(match.id, match);
    }
  });

  const selectedChunks = Array.from(merged.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (!selectedChunks.length) {
    const fallbackDoc = knowledgeBase[0];
    return fallbackDoc ? `${fallbackDoc.title}\n${fallbackDoc.content.slice(0, 900)}` : '';
  }

  return selectedChunks
    .map((chunk) => `${chunk.title}\n${chunk.content.slice(0, 900)}`)
    .join('\n\n---\n\n');
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Ollama timeout after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

const ROLE_PROMPTS = {
  general: `You are the main Alpha Freight website assistant. Help both shippers and carriers clearly and briefly.`,
  supplier: `You are the Alpha Freight supplier assistant. Focus on posting loads, verified carriers, tracking, pricing clarity, and shipper workflow.`,
  carrier: `You are the Alpha Freight carrier assistant. Focus on available loads, earnings, route planning, payout timing, and fleet operations.`
};

const ROMAN_URDU_HINTS = [
  'kya', 'kaise', 'kaisay', 'kesay', 'mujhe', 'mujha', 'mene', 'maine', 'mera', 'meri',
  'ap', 'aap', 'han', 'haan', 'nahi', 'nai', 'kyun', 'aur', 'bat', 'bata', 'bato',
  'samjha', 'samjho', 'samjhao', 'kero', 'kero', 'karta', 'karti', 'kerti', 'karna',
  'hona', 'hota', 'hoti', 'ha', 'hai', 'hain', 'kese', 'kesa', 'waha', 'yaha', 'chahiye',
  'cheez', 'sai', 'theek', 'thik', 'wala', 'weli', 'jawab', 'pucho', 'pocho', 'delo'
];

const ENGLISH_HINTS = [
  'what', 'how', 'when', 'where', 'why', 'can', 'could', 'please', 'services', 'available',
  'loads', 'wallet', 'driver', 'panel', 'support', 'tracking', 'payment', 'pricing', 'find',
  'carrier', 'supplier', 'help', 'tell', 'explain', 'details', 'professional',
  'analyze', 'analysis', 'compare', 'profit', 'optimize', 'insights', 'fleet', 'route',
  'post', 'pickup', 'delivery', 'budget', 'rate', 'miles', 'rpm', 'deadhead', 'tomorrow', 'today'
];

function hashText(text = '') {
  return String(text)
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function selectVariant(seedText, options = []) {
  if (!options.length) {
    return '';
  }

  return options[hashText(seedText) % options.length];
}

function selectFreshVariant(seedText, options = [], avoidText = '') {
  if (!options.length) {
    return '';
  }

  const startIndex = hashText(seedText) % options.length;
  const normalizedAvoid = String(avoidText || '').toLowerCase();

  for (let offset = 0; offset < options.length; offset += 1) {
    const candidate = options[(startIndex + offset) % options.length];
    if (!normalizedAvoid.includes(String(candidate).toLowerCase())) {
      return candidate;
    }
  }

  return options[startIndex];
}

function normalizeComparableText(text = '') {
  return String(text || '')
    .toLowerCase()
    .replace(/[`*_~>#\-\u{1F300}-\u{1FAFF}]/gu, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function areRepliesTooSimilar(left = '', right = '') {
  const normalizedLeft = normalizeComparableText(left);
  const normalizedRight = normalizeComparableText(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  if (normalizedLeft === normalizedRight) {
    return true;
  }

  if (normalizedLeft.length > 80 && normalizedRight.length > 80) {
    return normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
  }

  return false;
}

function dedupeRepeatedBlocks(text = '') {
  const blocks = String(text || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const uniqueBlocks = [];
  const seen = new Set();

  blocks.forEach((block) => {
    const normalized = normalizeComparableText(block);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    uniqueBlocks.push(block);
  });

  return uniqueBlocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

function looksGenericAssistantReply(text = '') {
  const normalized = String(text || '').toLowerCase();
  const genericPhrases = [
    "i'm here to help",
    'i can help with',
    'send me a topic',
    "i'll explain it clearly",
    'let me know if you want',
    'feel free to ask',
    'specific topic bhejo',
    'main help ke liye yahan hoon',
    'topic bhejo',
    'main is me help kar sakta hoon'
  ];

  return genericPhrases.some((phrase) => normalized.includes(phrase));
}

function formatTopicLabel(topic = '') {
  const prettyLabels = {
    post_load: 'posting loads',
    company_info: 'company information',
    support_policy: 'support policy',
    available_loads: 'available loads',
    smart_loads: 'smart loads',
    my_loads: 'my loads',
    my_posts: 'my posts',
    pay_instant: 'Pay Instant',
    pay_later: 'Pay Later',
    find_carriers: 'finding verified carriers',
    route_planning: 'route planning',
    driver_panel: 'Driver Panel',
    how_it_works: 'how Alpha Freight works'
  };

  if (prettyLabels[topic]) {
    return prettyLabels[topic];
  }

  return String(topic || '')
    .replace(/_/g, ' ')
    .trim();
}

function polishAssistantReply({ reply, lowerMessage, assistantType, style, history, topic }) {
  const cleanedReply = dedupeRepeatedBlocks(reply);
  const lastAssistantMessage = [...history].reverse().find((item) => item.role === 'assistant')?.content || '';

  if (!cleanedReply || cleanedReply.length < 20) {
    return buildNaturalReply({
      assistantType,
      topic,
      lowerMessage,
      history,
      style
    });
  }

  if (areRepliesTooSimilar(cleanedReply, lastAssistantMessage)) {
    return buildNaturalReply({
      assistantType,
      topic,
      lowerMessage,
      history,
      style
    });
  }

  if (topic && looksGenericAssistantReply(cleanedReply)) {
    return buildNaturalReply({
      assistantType,
      topic,
      lowerMessage,
      history,
      style
    });
  }

  return cleanedReply;
}

function getTopicEmoji(topic, assistantType = 'general') {
  const emojiMap = {
    dashboard: '📊',
    pricing: '💷',
    verification: '🛡️',
    support_policy: '🤝',
    post_load: '📦',
    wallet: '💰',
    available_loads: '🚚',
    smart_loads: '⚡',
    my_loads: '🗂️',
    my_posts: '📝',
    bids: '🏷️',
    earnings: '📈',
    payment: assistantType === 'carrier' ? '💸' : '💳',
    pay_instant: '💳',
    pay_later: '🕒',
    tracking: '📍',
    find_carriers: '🔎',
    route_planning: '🛣️',
    driver_panel: '👨‍✈️',
    vehicles: '🚛',
    support: '🧰',
    referrals: '🎁',
    settings: '⚙️',
    services: '✨',
    how_it_works: '🔄',
    company_info: '🏢'
  };

  return emojiMap[topic] || (assistantType === 'carrier' ? '🚚' : assistantType === 'supplier' ? '📦' : '✨');
}

function withEmoji(text, emoji) {
  if (!emoji || !text) return text;
  return `${emoji} ${text}`;
}

const SERVICE_DETAILS = {
  "freight trucking": "Freight & Trucking is Alpha Freight's core road transport service. It helps move full and partial truckloads with verified carriers, live updates, and reliable dispatch support.",
  "container transport": "Container Transport helps move containers smoothly between ports, yards, warehouses, and final destinations with better coordination and visibility.",
  "last-mile delivery": "Last-Mile Delivery handles the final delivery step to the customer or business location with fast turnaround and live delivery status updates.",
  "warehouse storage": "Warehouse & Storage gives you secure short-term and long-term storage options with better inventory handling and smoother dispatch planning.",
  "express distribution": "Express Distribution is built for urgent shipments that need priority movement, tighter scheduling, and faster delivery execution.",
  "freight forwarding": "Freight Forwarding helps manage shipment coordination from pickup to destination with organized documentation, carrier coordination, and routing support.",
  "supply chain management": "Supply Chain Management helps businesses improve planning, movement, visibility, and efficiency across their logistics operations."
};

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item) => item && typeof item.content === 'string' && (item.role === 'user' || item.role === 'assistant'))
    .slice(-18);
}

function detectResponseStyle(text = '') {
  const normalized = String(text).toLowerCase();
  const tokens = normalized.match(/[a-z]+/g) || [];
  let romanUrduScore = 0;
  let englishScore = 0;

  if (/[\u0600-\u06FF]/.test(text)) {
    return 'urdu';
  }

  if (/[^\x00-\x7F]/.test(text)) {
    return 'other_language';
  }

  ROMAN_URDU_HINTS.forEach((hint) => {
    if (tokens.includes(hint)) {
      romanUrduScore += 1;
    }
  });

  ENGLISH_HINTS.forEach((hint) => {
    if (tokens.includes(hint)) {
      englishScore += 1;
    }
  });

  if (romanUrduScore >= englishScore + 1) {
    return 'roman_urdu';
  }

  if (englishScore >= romanUrduScore + 1 && englishScore >= 2) {
    return 'english';
  }

  return 'mixed';
}

function resolveResponseStyle(message, history = []) {
  const currentStyle = detectResponseStyle(message);

  if (currentStyle !== 'mixed') {
    return currentStyle;
  }

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index];
    if (!item || item.role !== 'user') continue;
    const style = detectResponseStyle(item.content);
    if (style !== 'mixed') {
      return style;
    }
  }

  return 'english';
}

function formatHistory(history) {
  if (history.length === 0) {
    return 'No previous conversation.';
  }

  return history
    .map((item) => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content}`)
    .join('\n');
}

function extractConversationMemory(history, assistantType = 'general') {
  const userMessages = history.filter((item) => item.role === 'user');
  const assistantMessages = history.filter((item) => item.role === 'assistant');
  const resolvedTopicTimeline = [];
  let lastResolvedTopic = null;

  history.forEach((item) => {
    const content = item.content || '';
    const lowerContent = content.toLowerCase().trim();
    let topic = detectTopicFromText(content, assistantType);

    const isFollowUpLike =
      isVagueFollowUp(lowerContent) ||
      wantsDetailedExplanation(lowerContent) ||
      wantsSimpleExplanation(lowerContent) ||
      wantsExample(lowerContent) ||
      wantsContinuation(lowerContent);

    if (!topic && isFollowUpLike) {
      topic = lastResolvedTopic;
    }

    if (!topic && item.role === 'assistant' && lastResolvedTopic) {
      topic = lastResolvedTopic;
    }

    if (topic) {
      lastResolvedTopic = topic;
      resolvedTopicTimeline.push({
        role: item.role,
        topic,
        content
      });
    }
  });

  const distinctRecentTopics = [];
  for (let index = resolvedTopicTimeline.length - 1; index >= 0; index -= 1) {
    const topic = resolvedTopicTimeline[index].topic;
    if (!distinctRecentTopics.includes(topic)) {
      distinctRecentTopics.push(topic);
    }
    if (distinctRecentTopics.length >= 4) {
      break;
    }
  }

  const activeTopic = distinctRecentTopics[0] || null;
  const operationalMemory = buildOperationalMemory(history, assistantType, activeTopic);

  return {
    activeTopic,
    previousTopic: distinctRecentTopics[1] || null,
    recentTopics: distinctRecentTopics,
    lastResolvedTopic,
    lastUserMessage: userMessages.length ? userMessages[userMessages.length - 1].content : '',
    lastAssistantMessage: assistantMessages.length ? assistantMessages[assistantMessages.length - 1].content : '',
    resolvedTopicTimeline,
    truckType: operationalMemory.truckType,
    equipmentType: operationalMemory.equipmentType,
    userLocation: operationalMemory.userLocation,
    preferredRoutes: operationalMemory.preferredRoutes,
    previousSearches: operationalMemory.previousSearches,
    recentLoads: operationalMemory.recentLoads,
    workflowStage: operationalMemory.workflowStage,
    role: operationalMemory.role,
    persona: operationalMemory.persona
  };
}

function formatConversationMemory(memory) {
  const lines = [
    `Active topic: ${memory.activeTopic || 'none'}`,
    `Previous topic: ${memory.previousTopic || 'none'}`,
    `Recent topics: ${memory.recentTopics.length ? memory.recentTopics.join(', ') : 'none'}`,
    `Last resolved topic: ${memory.lastResolvedTopic || 'none'}`,
    `Last user message: ${memory.lastUserMessage || 'none'}`,
    `Last assistant message: ${memory.lastAssistantMessage || 'none'}`,
    `Truck type: ${memory.truckType || 'unknown'}`,
    `Equipment type: ${memory.equipmentType || 'unknown'}`,
    `User location: ${memory.userLocation || 'unknown'}`,
    `Preferred routes: ${memory.preferredRoutes.length ? memory.preferredRoutes.join(', ') : 'none'}`,
    `Previous searches: ${memory.previousSearches.length ? memory.previousSearches.join(' | ') : 'none'}`,
    `Recent loads: ${memory.recentLoads.length ? memory.recentLoads.join(' | ') : 'none'}`,
    `Workflow stage: ${memory.workflowStage || 'none'}`,
    `Role: ${memory.role || 'none'}`,
    `Persona: ${memory.persona || 'none'}`
  ];

  return lines.join('\n');
}

function formatCarrierContext(carrierContext) {
  if (!carrierContext || typeof carrierContext !== 'object') {
    return 'No live carrier account data was provided for this request.';
  }

  const lines = [`Carrier name: ${carrierContext.carrierName || 'Unknown carrier'}`];

  if (carrierContext.stats) {
    lines.push(
      `Account summary: ${carrierContext.stats.activeLoads || 0} active loads, ${carrierContext.stats.inTransitLoads || 0} in transit, ${carrierContext.stats.pendingBids || 0} pending bids, ${carrierContext.stats.availableLoads || 0} marketplace loads available.`
    );
  }

  if (carrierContext.wallet) {
    lines.push(
      `Wallet: available ${carrierContext.wallet.availableBalance || '£0.00'}, pending ${carrierContext.wallet.pendingBalance || '£0.00'}, lifetime ${carrierContext.wallet.lifetimeEarnings || '£0.00'}.`
    );
  }

  if (Array.isArray(carrierContext.myLoads) && carrierContext.myLoads.length) {
    lines.push('Assigned loads:');
    carrierContext.myLoads.forEach((load) => {
      lines.push(
        `- ${load.code || 'Load'}: ${load.route || 'Route TBC'} | ${load.price || 'Price TBC'} | status ${load.status || 'unknown'}${load.pickup ? ` | pickup ${load.pickup}` : ''}`
      );
    });
  } else {
    lines.push('Assigned loads: none currently assigned.');
  }

  if (Array.isArray(carrierContext.availableLoads) && carrierContext.availableLoads.length) {
    lines.push('Top marketplace loads:');
    carrierContext.availableLoads.forEach((load) => {
      lines.push(
        `- ${load.code || 'Load'}: ${load.route || 'Route TBC'} | ${load.price || 'Price TBC'}${load.equipment ? ` | ${load.equipment}` : ''}${load.highPay ? ' | high pay' : ''}${load.pickup ? ` | pickup ${load.pickup}` : ''}`
      );
    });
  } else {
    lines.push('Top marketplace loads: none currently listed.');
  }

  if (Array.isArray(carrierContext.bids) && carrierContext.bids.length) {
    lines.push('Recent bids:');
    carrierContext.bids.forEach((bid) => {
      lines.push(
        `- ${bid.code || 'Load'}: ${bid.route || 'Route TBC'} | bid ${bid.bidAmount || 'TBC'}${bid.loadPrice ? ` | listed ${bid.loadPrice}` : ''} | status ${bid.status || 'unknown'}`
      );
    });
  } else {
    lines.push('Recent bids: none submitted yet.');
  }

  if (carrierContext.fetchedAt) {
    lines.push(`Data fetched at: ${carrierContext.fetchedAt}`);
  }

  return lines.join('\n');
}

function isWalletBalanceQuestion(message = '') {
  const normalized = String(message || '').toLowerCase();
  return (
    /\b(wallet balance|my balance|available balance|how much (?:do i have|money|in my wallet)|what(?:'s| is) my wallet)\b/i.test(normalized) ||
    (/\b(wallet|balance)\b/i.test(normalized) && /\b(what|how much|show|tell|check|kitna|mera|my)\b/i.test(normalized))
  );
}

function isPendingBidsQuestion(message = '') {
  const normalized = String(message || '').toLowerCase();
  return (
    /\b(pending bid|my bids?|bid status|bids pending)\b/i.test(normalized) ||
    (/\bbids?\b/i.test(normalized) && /\b(pending|status|how many|kitni|show|list|my)\b/i.test(normalized))
  );
}

function isMyLoadsQuestion(message = '') {
  const normalized = String(message || '').toLowerCase();
  if (/\b(available|best|find|search|marketplace|highest)\b/i.test(normalized)) {
    return false;
  }

  return (
    /\b(my loads?|assigned loads?|active loads?|current loads?)\b/i.test(normalized) ||
    (/\bloads?\b/i.test(normalized) && /\b(my|assigned|active|current|meri)\b/i.test(normalized))
  );
}

function isAvailableLoadsQuestion(message = '') {
  const normalized = String(message || '').toLowerCase();
  return (
    /\b(available loads?|best loads?|high.?pay|marketplace loads?|find loads?)\b/i.test(normalized) ||
    (/\bloads?\b/i.test(normalized) && /\b(available|best|highest|marketplace|find|show me)\b/i.test(normalized))
  );
}

function isDirectCarrierDataQuestion(message = '') {
  return (
    isWalletBalanceQuestion(message) ||
    isPendingBidsQuestion(message) ||
    isMyLoadsQuestion(message) ||
    isAvailableLoadsQuestion(message)
  );
}

function buildCarrierContextReply({ lowerMessage = '', carrierContext = null, style = 'english' }) {
  if (!carrierContext || typeof carrierContext !== 'object') {
    return null;
  }

  const carrierName = carrierContext.carrierName || 'there';

  if (isWalletBalanceQuestion(lowerMessage)) {
    const wallet = carrierContext.wallet || {};
    return {
      topic: 'wallet',
      title: '💰 Your Wallet',
      shortExplanation: pickStyleText(
        style,
        `Hi ${carrierName}, here is your current wallet snapshot from your live account:`,
        `Hi ${carrierName}, yeh aap ka live wallet snapshot hai:`
      ),
      keyPoints: [
        `Available to withdraw: ${wallet.availableBalance || '£0.00'}`,
        `Pending from active loads: ${wallet.pendingBalance || '£0.00'}`,
        `Lifetime earnings: ${wallet.lifetimeEarnings || '£0.00'}`,
      ],
      nextStep: pickStyleText(
        style,
        'Open the Wallet tab to withdraw once payout setup is complete.',
        'Withdrawal ke liye Wallet tab open karein jab payout setup complete ho.'
      ),
    };
  }

  if (isPendingBidsQuestion(lowerMessage)) {
    const pendingBids = (carrierContext.bids || []).filter(
      (bid) => String(bid.status || '').toLowerCase() === 'pending'
    );
    const keyPoints = pendingBids.length
      ? pendingBids.slice(0, 5).map(
          (bid) =>
            `${bid.code || 'Load'}: ${bid.route || 'Route TBC'} — bid ${bid.bidAmount || 'TBC'}${bid.loadPrice ? ` (listed ${bid.loadPrice})` : ''}`
        )
      : [
          pickStyleText(
            style,
            'You have no pending bids right now.',
            'Abhi aap ke paas koi pending bid nahi hai.'
          ),
        ];

    return {
      topic: 'bids',
      title: '🏷️ Your Bids',
      shortExplanation: pickStyleText(
        style,
        `Hi ${carrierName}, you currently have ${carrierContext.stats?.pendingBids ?? pendingBids.length} pending bid(s):`,
        `Hi ${carrierName}, abhi aap ke paas ${carrierContext.stats?.pendingBids ?? pendingBids.length} pending bid(s) hain:`
      ),
      keyPoints,
      nextStep: pickStyleText(
        style,
        'Open My Bids in the app to review or update your offers.',
        'Offers review ya update karne ke liye app me My Bids open karein.'
      ),
    };
  }

  if (isMyLoadsQuestion(lowerMessage)) {
    const myLoads = carrierContext.myLoads || [];
    const keyPoints = myLoads.length
      ? myLoads.slice(0, 5).map(
          (load) =>
            `${load.code || 'Load'}: ${load.route || 'Route TBC'} — ${load.price || 'Price TBC'} (${load.status || 'status unknown'})`
        )
      : [
          pickStyleText(
            style,
            'You have no assigned loads right now.',
            'Abhi aap ke paas koi assigned load nahi hai.'
          ),
        ];

    return {
      topic: 'my_loads',
      title: '🗂️ Your Loads',
      shortExplanation: pickStyleText(
        style,
        `Hi ${carrierName}, here are your current assigned loads (${carrierContext.stats?.activeLoads ?? myLoads.length} active):`,
        `Hi ${carrierName}, yeh aap ke current assigned loads hain (${carrierContext.stats?.activeLoads ?? myLoads.length} active):`
      ),
      keyPoints,
      nextStep: pickStyleText(
        style,
        'Open My Loads for pickup details, status updates, and navigation.',
        'Pickup details, status updates aur navigation ke liye My Loads open karein.'
      ),
    };
  }

  if (isAvailableLoadsQuestion(lowerMessage)) {
    const availableLoads = carrierContext.availableLoads || [];
    const keyPoints = availableLoads.length
      ? availableLoads.slice(0, 5).map(
          (load) =>
            `${load.code || 'Load'}: ${load.route || 'Route TBC'} — ${load.price || 'Price TBC'}${load.highPay ? ' ⭐ high pay' : ''}${load.equipment ? ` (${load.equipment})` : ''}`
        )
      : [
          pickStyleText(
            style,
            'No marketplace loads are listed right now.',
            'Abhi marketplace par koi load listed nahi hai.'
          ),
        ];

    return {
      topic: 'available_loads',
      title: '🚚 Available Loads',
      shortExplanation: pickStyleText(
        style,
        `Hi ${carrierName}, here are the top paying loads on the marketplace right now (${carrierContext.stats?.availableLoads ?? availableLoads.length} total):`,
        `Hi ${carrierName}, yeh abhi marketplace par top paying loads hain (${carrierContext.stats?.availableLoads ?? availableLoads.length} total):`
      ),
      keyPoints,
      nextStep: pickStyleText(
        style,
        'Open Available Loads to place a bid on any lane that fits your equipment.',
        'Apne equipment ke mutabiq kisi bhi lane par bid lagane ke liye Available Loads open karein.'
      ),
    };
  }

  return null;
}

function buildCarrierContextStructuredReply({
  lowerMessage = '',
  carrierContext = null,
  style = 'english',
  assistantType = 'carrier',
}) {
  const data = buildCarrierContextReply({ lowerMessage, carrierContext, style });
  if (!data) {
    return null;
  }

  const rawText = [
    data.shortExplanation,
    ...data.keyPoints.map((point) => `• ${point}`),
    data.nextStep,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    mode: 'logistics_copilot',
    displayStyle: 'plain',
    userIntent: 'Account Data',
    responseLength: 'short',
    modeLabel: 'Logistics Copilot',
    assistantName: 'Alpha Freight Co-Pilot',
    confidence: 0.95,
    knowledgeSource: 'live_account',
    title: data.title,
    shortExplanation: data.shortExplanation,
    keyPoints: data.keyPoints,
    recommendation: '',
    nextStep: data.nextStep,
    metrics: [],
    sections: [],
    routePreview: null,
    quickActions: [],
    suggestedQuestions: [],
    platformIntent: null,
    actionRequest: null,
    memory: {
      role: assistantType,
      persona: getPersonaLabel(assistantType, data.topic),
      activeTopic: data.topic,
    },
    rawText,
  };
}

const TRUCK_TYPE_PATTERNS = [
  'reefer',
  'dry van',
  'flatbed',
  'box truck',
  'sprinter van',
  'curtain sider',
  'curtainsider',
  'tanker',
  'container chassis',
  'low loader',
  'car transporter',
  '26ft',
  '40ft',
  '44 ton',
  'trailer'
];

function uniqueNonEmpty(items = [], limit = 4) {
  return Array.from(
    new Set(
      items
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )
  ).slice(0, limit);
}

function inferTruckTypeFromText(text = '') {
  const normalized = String(text || '').toLowerCase();
  return TRUCK_TYPE_PATTERNS.find((item) => normalized.includes(item)) || null;
}

function inferRouteFromText(text = '') {
  const routeMatch = String(text || '').match(/\bfrom\s+([a-z][a-z\s&-]{1,40}?)\s+(?:to|->)\s+([a-z][a-z\s&-]{1,40})\b/i);
  if (!routeMatch) {
    const simpleRoute = String(text || '').match(/\b([a-z][a-z\s&-]{2,30})\s+route\b/i);
    return simpleRoute?.[1] ? `${simpleRoute[1].trim()} route` : null;
  }

  const from = routeMatch[1].trim().replace(/\s+/g, ' ');
  const to = routeMatch[2].trim().replace(/\s+/g, ' ');
  return `${from} -> ${to}`;
}

function inferLocationFromText(text = '') {
  const locationPatterns = [
    /\bnear\s+([a-z][a-z\s&-]{2,40})\b/i,
    /\bin\s+([a-z][a-z\s&-]{2,40})\b/i,
    /\bbased in\s+([a-z][a-z\s&-]{2,40})\b/i,
    /\bfrom\s+([a-z][a-z\s&-]{2,40})\b/i,
    /\b([a-z][a-z\s&-]{2,40})\s+me\s+(?:hoon|hun|available|based)\b/i,
    /\b([a-z][a-z\s&-]{2,40})\s+main\s+(?:hoon|hun|available|based)\b/i
  ];

  for (const pattern of locationPatterns) {
    const match = String(text || '').match(pattern);
    if (match?.[1]) {
      const cleaned = match[1]
        .trim()
        .replace(/\s+/g, ' ')
        .split(/\b(?:ke|ki|ka|sath|truck|driver|with|the)\b/i)
        .filter(Boolean)
        .pop()
        ?.trim();

      return cleaned || match[1].trim().replace(/\s+/g, ' ');
    }
  }

  return null;
}

function summarizeLoadMention(text = '') {
  const normalized = String(text || '').trim();
  if (!/load|rpm|deadhead|backhaul|miles|profit|rate/i.test(normalized)) {
    return null;
  }

  return normalized.length > 110 ? `${normalized.slice(0, 107)}...` : normalized;
}

function getPersonaLabel(assistantType = 'general', activeTopic = null) {
  if (activeTopic === 'tracking') return 'Tracking Assistant';
  if (activeTopic === 'pricing' || activeTopic === 'payment' || activeTopic === 'earnings') return 'Freight Analyst';
  if (activeTopic === 'available_loads' || activeTopic === 'route_planning' || activeTopic === 'smart_loads') return 'Professional Dispatcher';
  if (activeTopic === 'support' || activeTopic === 'support_policy') return 'Customer Support Expert';
  if (assistantType === 'carrier') return 'Logistics Manager';
  if (assistantType === 'supplier') return 'Logistics Manager';
  return 'Freight Operations Copilot';
}

function inferWorkflowStageFromText(text = '', assistantType = 'general') {
  const normalized = String(text || '').toLowerCase();

  if (!normalized) {
    return null;
  }

  const has = (pattern) => pattern.test(normalized);

  const stageSignals = {
    posted:
      has(/\b(post(ed)?|publish(ed)?|created?)\b.*\b(load|shipment)\b/i) ||
      has(/\b(load|shipment)\b.*\b(post(ed)?|publish(ed)?|created?)\b/i),
    bids_received: has(/\b(bid|offer|quote)\b.*\b(received|aayi|aya|bhej(i|a)|send|submitted)\b/i) || has(/\b(carrier|carriers)\b.*\b(bid|offer)\b/i),
    bid_submitted: has(/\b(i|we)\b.*\b(bid|offer)\b.*\b(submit|submitted|sent|bhej(i|a))\b/i),
    accepted: has(/\b(accept(ed)?|book(ed)?|confirmed?)\b/i) && has(/\b(bid|offer|load|shipment)\b/i),
    pickup: has(/\b(pickup|picked up|arrived at pickup|loaded)\b/i),
    in_transit: has(/\b(in transit|on the way|moving)\b/i),
    delayed: has(/\b(delay(ed)?|late|stuck|detention|layover|issue|problem)\b/i),
    delivered: has(/\b(delivered|delivery done|pod|proof of delivery)\b/i),
    paid: has(/\b(paid|payment|payout|invoice)\b/i),
    searching: has(/\b(find|search|show)\b.*\b(load|loads)\b/i) || has(/\bavailable loads\b/i)
  };

  if (assistantType === 'supplier') {
    if (stageSignals.bids_received) return 'bids_received';
    if (stageSignals.posted) return 'posted';
    if (stageSignals.accepted) return 'booked';
    if (stageSignals.pickup) return 'pickup';
    if (stageSignals.in_transit) return 'in_transit';
    if (stageSignals.delayed) return 'exception';
    if (stageSignals.delivered) return 'delivered';
    if (stageSignals.paid) return 'closed';
    return null;
  }

  if (assistantType === 'carrier') {
    if (stageSignals.searching) return 'searching';
    if (stageSignals.bid_submitted) return 'bid_submitted';
    if (stageSignals.accepted) return 'booked';
    if (stageSignals.pickup) return 'pickup';
    if (stageSignals.in_transit) return 'in_transit';
    if (stageSignals.delayed) return 'exception';
    if (stageSignals.delivered) return 'delivered';
    if (stageSignals.paid) return 'closed';
    return null;
  }

  if (stageSignals.delivered) return 'delivered';
  if (stageSignals.in_transit) return 'in_transit';
  if (stageSignals.pickup) return 'pickup';
  if (stageSignals.posted) return 'posted';

  return null;
}

function buildOperationalMemory(history, assistantType = 'general', activeTopic = null) {
  const userMessages = history.filter((item) => item.role === 'user').map((item) => item.content);
  const combined = userMessages.join('\n');
  const routeMentions = uniqueNonEmpty(userMessages.map((message) => inferRouteFromText(message)), 4);
  const loadMentions = uniqueNonEmpty(userMessages.map((message) => summarizeLoadMention(message)), 4);
  const detectedLocations = uniqueNonEmpty(
    [...userMessages].reverse().map((message) => inferLocationFromText(message)).filter(Boolean),
    3
  );
  const searchMentions = uniqueNonEmpty(
    userMessages
      .filter((message) => /find|show|check|track|calculate|compare|best|optimi|backhaul|profit|load/i.test(message))
      .slice(-5),
    5
  );

  return {
    truckType: inferTruckTypeFromText(combined),
    equipmentType: inferTruckTypeFromText(combined),
    userLocation: detectedLocations[0] || inferLocationFromText(combined),
    preferredRoutes: routeMentions,
    previousSearches: searchMentions,
    recentLoads: loadMentions,
    workflowStage: inferWorkflowStageFromText(combined, assistantType),
    role: assistantType,
    persona: getPersonaLabel(assistantType, activeTopic)
  };
}

function cleanCapturedValue(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/^(to|from|and|then|pickup|delivery|dropoff|equipment|truck type)\s+/i, '')
    .trim();
}

function inferPlainLocationValue(text = '') {
  const normalized = cleanCapturedValue(text);
  if (!normalized) return null;

  const inferred = inferLocationFromText(normalized);
  if (inferred) {
    return cleanCapturedValue(inferred);
  }

  if (
    /^[a-z][a-z\s,&-]{1,40}$/i.test(normalized) &&
    !/\b(load|bid|track|profit|carrier|shipper|route|rate|status|please|help|show|find|post|create)\b/i.test(normalized)
  ) {
    return normalized;
  }

  return null;
}

function inferEquipmentValue(text = '') {
  const normalized = String(text || '').toLowerCase();
  return inferTruckTypeFromText(normalized)
    || normalized.match(/\b(dry van|reefer|flatbed|box truck|sprinter van|curtain sider|curtainsider|tanker|container chassis|low loader|car transporter)\b/i)?.[1]
    || null;
}

function extractFieldAskedByAssistant(text = '') {
  const normalized = String(text || '').toLowerCase();
  if (/\bpickup city\b|\bpickup location\b|\bpickup point\b|\bwhere is pickup\b/.test(normalized)) return 'origin';
  if (/\bdelivery city\b|\bdelivery location\b|\bdrop ?off\b|\bdestination\b/.test(normalized)) return 'destination';
  if (/\bequipment\b|\btruck type\b|\btrailer type\b/.test(normalized)) return 'equipment';
  if (/\bweight\b/.test(normalized)) return 'weight';
  if (/\bbudget\b|\bprice\b|\brate\b/.test(normalized)) return 'price';
  return null;
}

function hasCreateLoadIntent(text = '') {
  const normalized = String(text || '').toLowerCase();
  return (
    /\b(post|create|publish|start)\b.*\b(load|shipment)\b/i.test(normalized) ||
    /\bnew load\b/i.test(normalized) ||
    /\bhelp me post\b/i.test(normalized) ||
    /\bneed to ship\b/i.test(normalized)
  );
}

function extractLoadCreationDraft(history = []) {
  const draft = {
    origin: null,
    destination: null,
    equipment: null,
    weight: null,
    price: null,
  };
  let flowActive = false;
  let expectedField = null;

  history.forEach((item) => {
    const content = String(item?.content || '').trim();
    if (!content) return;

    if (item.role === 'assistant') {
      const askedField = extractFieldAskedByAssistant(content);
      if (askedField) {
        flowActive = true;
        expectedField = askedField;
      }
      return;
    }

    if (hasCreateLoadIntent(content)) {
      flowActive = true;
    }

    const route = inferRouteFromText(content);
    if (route) {
      const [origin, destination] = route.split('->').map((value) => cleanCapturedValue(value));
      if (origin && !draft.origin) draft.origin = origin;
      if (destination && !draft.destination) draft.destination = destination;
    }

    const plainLocation = inferPlainLocationValue(content);
    const equipment = inferEquipmentValue(content);
    const weightMatch = content.match(/\b(\d+(?:\.\d+)?)\s*(kg|kgs|kilograms|lb|lbs|pounds|tons?|tonnes?)\b/i);
    const priceMatch = content.match(/(?:\$|usd\s*)?(\d{3,6})(?:\s*(usd|dollars?))?/i);

    if (expectedField === 'origin' && plainLocation) {
      draft.origin = draft.origin || plainLocation;
      expectedField = null;
      return;
    }

    if (expectedField === 'destination' && plainLocation) {
      draft.destination = draft.destination || plainLocation;
      expectedField = null;
      return;
    }

    if (expectedField === 'equipment' && equipment) {
      draft.equipment = draft.equipment || equipment;
      expectedField = null;
      return;
    }

    if (expectedField === 'weight' && weightMatch?.[0]) {
      draft.weight = draft.weight || weightMatch[0];
      expectedField = null;
      return;
    }

    if (expectedField === 'price' && priceMatch?.[1]) {
      draft.price = draft.price || priceMatch[1];
      expectedField = null;
      return;
    }

    if (flowActive && plainLocation) {
      if (!draft.origin) {
        draft.origin = plainLocation;
      } else if (!draft.destination && cleanCapturedValue(draft.origin).toLowerCase() !== cleanCapturedValue(plainLocation).toLowerCase()) {
        draft.destination = plainLocation;
      }
    }

    if (equipment && !draft.equipment) {
      draft.equipment = equipment;
    }

    if (weightMatch?.[0] && !draft.weight) {
      draft.weight = weightMatch[0];
    }

    if (priceMatch?.[1] && !draft.price && /\b(price|budget|rate|offer|for)\b/i.test(content)) {
      draft.price = priceMatch[1];
    }
  });

  if (!flowActive) {
    return null;
  }

  const missingFields = ['origin', 'destination', 'equipment'].filter((field) => !draft[field]);
  return {
    ...draft,
    flowActive,
    missingFields,
  };
}

function getLoadFieldPrompt(field, style = 'english') {
  switch (field) {
    case 'origin':
      return pickStyleText(style, 'Pickup city?', 'Pickup city kya hai?');
    case 'destination':
      return pickStyleText(style, 'Delivery city?', 'Delivery city kya hai?');
    case 'equipment':
      return pickStyleText(style, 'Equipment type? For example Dry Van, Reefer, or Flatbed.', 'Equipment type kya hai? Misal ke taur par Dry Van, Reefer, ya Flatbed.');
    case 'weight':
      return pickStyleText(style, 'Weight?', 'Weight kitna hai?');
    case 'price':
      return pickStyleText(style, 'Target rate or budget?', 'Target rate ya budget kya hai?');
    default:
      return pickStyleText(style, 'What detail should I capture next?', 'Agla detail kya capture karna hai?');
  }
}

function buildActionRequest({ assistantType = 'general', lowerMessage = '', history = [], style = 'english' }) {
  if (assistantType === 'supplier') {
    const draft = extractLoadCreationDraft(history);
    const wantsCreateLoad = hasCreateLoadIntent(lowerMessage) || Boolean(draft?.flowActive);

    if (wantsCreateLoad) {
      if (!draft || draft.missingFields.length > 0) {
        const missingFields = draft?.missingFields?.length ? draft.missingFields : ['origin', 'destination', 'equipment'];
        return {
          type: 'create_load',
          status: 'needs_input',
          prompt: getLoadFieldPrompt(missingFields[0], style),
          missingFields,
          payload: {
            origin: draft?.origin || null,
            destination: draft?.destination || null,
            equipment: draft?.equipment || null,
            weight: draft?.weight || null,
            price: draft?.price || null,
          },
        };
      }

      return {
        type: 'create_load',
        status: 'ready',
        successMessage: pickStyleText(
          style,
          `I have enough details to create this load now.`,
          `Mere paas itni details aa gayi hain ke main ab ye load create kar sakoon.`
        ),
        payload: {
          origin: draft.origin,
          destination: draft.destination,
          equipment: draft.equipment,
          weight: draft.weight || null,
          price: draft.price || null,
        },
      };
    }
  }

  if (/\b(human|agent|support team|representative|real person)\b/i.test(lowerMessage)) {
    return {
      type: 'human_handoff',
      status: 'needs_input',
      prompt: pickStyleText(
        style,
        `I can route this to support. Share the load ID or issue in one line.`,
        `Main isay support tak route kar sakta hoon. Load ID ya issue aik line me bhej dein.`
      ),
      missingFields: ['issue'],
    };
  }

  return null;
}

function detectPlatformIntent({ lowerMessage = '', assistantType = 'general', topic = null, memory = {} }) {
  const normalized = String(lowerMessage || '').toLowerCase();

  if (/\b(my|mere|meri|show|list|check)\b.*\b(active )?loads\b/i.test(normalized) || /\bmy loads\b/i.test(normalized)) {
    return {
      type: 'active_loads_lookup',
      equipmentType: memory.equipmentType || null,
      location: memory.userLocation || null,
      route: memory.preferredRoutes?.[0] || null,
    };
  }

  if (assistantType === 'supplier' && (/\b(my bids|view bids|show bids|bids received|carrier bids)\b/i.test(normalized) || topic === 'bids')) {
    return {
      type: 'bids_lookup',
      route: memory.preferredRoutes?.[0] || null,
    };
  }

  if (assistantType === 'supplier' && hasCreateLoadIntent(normalized)) {
    return {
      type: 'post_load_lookup',
      equipmentType: memory.equipmentType || null,
      route: memory.preferredRoutes?.[0] || null,
    };
  }

  if (/\b(track load|track my load|open tracking|shipment status)\b/i.test(normalized)) {
    return {
      type: 'tracking_lookup',
      route: memory.preferredRoutes?.[0] || null,
    };
  }

  if (/\b(profit|margin|earnings|pricing breakdown|rate analysis)\b/i.test(normalized)) {
    return {
      type: 'earnings_lookup',
      route: memory.preferredRoutes?.[0] || null,
    };
  }

  if (
    assistantType === 'carrier' &&
    (
      /\b(find|show|search|rank|compare)\b.*\b(best|available|highest paying|top)\b.*\b(?:load|loads)\b/i.test(normalized) ||
      /\b(best|available|highest paying|top)\b.*\b(?:load|loads)\b/i.test(normalized) ||
      topic === 'available_loads'
    )
  ) {
    return {
      type: 'loads_search',
      equipmentType: memory.equipmentType || memory.truckType || null,
      location: memory.userLocation || null,
      route: memory.preferredRoutes?.[0] || null,
    };
  }

  return null;
}

function buildFocusedFollowUpReply({ assistantType = 'general', lowerMessage = '', style = 'english', memory = {} }) {
  const route = inferRouteFromText(lowerMessage) || memory.preferredRoutes?.[0] || null;

  if (/\b(rate kam|low rate|rates low|rate low)\b/i.test(lowerMessage)) {
    if (assistantType === 'general') {
      return pickStyleText(
        style,
        `I can help with that. First tell me two things: are you a carrier or a shipper, and which route is paying low right now?`,
        `Main is me help kar sakta hoon. Pehle do cheezen bata dein: aap carrier hain ya shipper, aur kis route par rate kam mil raha hai?`
      );
    }

    if (!route) {
      return pickStyleText(
        style,
        `I can help fix that, but I need the route first. Which lane is paying low right now?`,
        `Main isay improve karne me help kar sakta hoon, lekin pehle route chahiye. Konsi lane par abhi rate kam mil raha hai?`
      );
    }
  }

  return null;
}

function buildKnowledgeSearchInput(message, inferredTopic, memory) {
  const parts = [String(message || '').trim()];
  const followUpLike =
    isVagueFollowUp(message) ||
    wantsDetailedExplanation(message) ||
    wantsSimpleExplanation(message) ||
    wantsExample(message) ||
    wantsContinuation(message);

  if (followUpLike && memory.lastUserMessage && !parts.includes(memory.lastUserMessage)) {
    parts.unshift(memory.lastUserMessage);
  }

  if (inferredTopic && !parts.includes(inferredTopic)) {
    parts.push(inferredTopic);
  }

  if (memory.activeTopic && memory.activeTopic !== inferredTopic && !parts.includes(memory.activeTopic)) {
    parts.push(memory.activeTopic);
  }

  if (memory.previousTopic && !parts.includes(memory.previousTopic) && parts.length < 4) {
    parts.push(memory.previousTopic);
  }

  if (followUpLike && memory.lastResolvedTopic && !parts.includes(memory.lastResolvedTopic)) {
    parts.push(memory.lastResolvedTopic);
  }

  return parts.filter(Boolean).join(' ');
}

function normalizeSelectedMode(mode = '') {
  const normalized = String(mode || '').toLowerCase().trim();
  const allowedModes = ['logistics_copilot', 'tracking_assistant', 'load_analyst', 'fleet_manager', 'dispatcher'];
  return allowedModes.includes(normalized) ? normalized : null;
}

function detectResponseLength(message = '') {
  const normalized = String(message || '').trim();

  if (!normalized) {
    return 'short';
  }

  if (isCasualConversationMessage(normalized)) {
    return 'short';
  }

  if (
    normalized.length > 150 ||
    /\b(compare|analysis|analyze|calculate|optimization|breakdown|step by step|detailed|detail|explain in detail)\b/i.test(normalized)
  ) {
    return 'detailed';
  }

  if (/\b(explain|define|what is|what's|how does|how to|why|difference between)\b/i.test(normalized)) {
    return 'detailed';
  }

  if (/\b(page|screen|tab|section)\b/i.test(normalized) && /\b(load|loads|tracking|route|earning|earnings|payout|bids?|posts?)\b/i.test(normalized)) {
    return 'medium';
  }

  if (normalized.length > 55 || /\b(explain|how|what|why|help|show|find|recommend)\b/i.test(normalized)) {
    return 'medium';
  }

  return 'short';
}

function isCasualConversationMessage(message = '') {
  const normalized = String(message || '').trim();

  if (!normalized) {
    return true;
  }

  return /^(hi|hello|hey|hi there|hello there|thanks?|thank you|ok(ay)?|great|good|nice|how are you|are you there|yo)[.!?]?$/i.test(normalized);
}

function safeJsonParse(text = '') {
  try {
    return JSON.parse(String(text || '').trim());
  } catch {
    return null;
  }
}

function detectUserIntentWithConfidence(message = '', topic = null, assistantType = 'general', selectedMode = null) {
  const normalized = String(message || '').toLowerCase().trim();
  const selected = normalizeSelectedMode(selectedMode);
  const earningsLike =
    /\b(earnings|revenue|profit margin|maximize earnings|net revenue)\b/i.test(normalized) ||
    (assistantType === 'carrier' && /\b(rate|rpm|per mile|low rate|rate low|rate kam)\b/i.test(normalized));
  const payoutLike = /\b(payout|payment|invoice|wallet|pay instant|pay later)\b/i.test(normalized);
  const loadPostingLike = /\b(post|publish|create)\b.*\b(load|shipment)\b/i.test(normalized);

  if (!normalized || isCasualConversationMessage(normalized)) {
    return { intent: 'Casual Conversation', confidence: 0.98 };
  }

  if (
    /\b(post|publish|create|book)\b.*\bload\b/i.test(normalized) ||
    /\bship this\b/i.test(normalized) ||
    /\bneed to ship\b/i.test(normalized)
  ) {
    return { intent: 'Load Posting', confidence: 0.92 };
  }

  if (/\b(analy[sz]e|analysis|compare|comparison|rank|score|best option|recommended load|profit estimate|trip profit)\b/i.test(normalized)) {
    return { intent: 'Load Analysis', confidence: 0.9 };
  }

  if (
    (/\b(find|show|search|loads near me|highest paying|backhaul|available loads|best loads)\b/i.test(normalized) && /\bload|loads\b/i.test(normalized)) ||
    topic === 'available_loads' ||
    topic === 'smart_loads'
  ) {
    return { intent: 'Load Search', confidence: 0.86 };
  }

  if (/\b(track|tracking|eta|pickup status|transit|delay|delivery confirmation|proof of delivery|pod|gps)\b/i.test(normalized) || (topic === 'tracking' && !earningsLike && !payoutLike && !loadPostingLike)) {
    return { intent: 'Tracking', confidence: 0.86 };
  }

  if (/\b(route|lane|traffic|toll|backhaul|deadhead|optimi[sz]e my route|route planning)\b/i.test(normalized) || topic === 'route_planning') {
    return { intent: 'Route Planning', confidence: 0.82 };
  }

  if (/\b(fleet|truck utilization|maintenance|fleet performance|truck performance)\b/i.test(normalized) || topic === 'vehicles') {
    return { intent: 'Fleet Management', confidence: 0.82 };
  }

  if (/\b(driver|hos|hours of service|driver support|driver assignment|driver operations)\b/i.test(normalized) || topic === 'driver_panel') {
    return { intent: 'Driver Support', confidence: 0.82 };
  }

  if (earningsLike || topic === 'earnings') {
    return { intent: 'Earnings', confidence: 0.8 };
  }

  if (payoutLike || ['payment', 'wallet', 'pay_instant', 'pay_later'].includes(topic || '')) {
    return { intent: 'Payouts', confidence: 0.8 };
  }

  if (/\b(fuel cost|diesel|fuel usage|fuel burn)\b/i.test(normalized)) {
    return { intent: 'Fuel Cost', confidence: 0.8 };
  }

  if (/\b(dispatch|dispatching|assign driver|assign truck|load board coordination)\b/i.test(normalized)) {
    return { intent: 'Dispatching', confidence: 0.8 };
  }

  if (/\b(shipment|delivery window|pickup window|shipment management|manage shipment)\b/i.test(normalized)) {
    return { intent: 'Shipment Management', confidence: 0.78 };
  }

  if (selected === 'tracking_assistant' && (isVagueFollowUp(normalized) || (topic === 'tracking' && !earningsLike && !payoutLike && !loadPostingLike))) {
    return { intent: 'Tracking', confidence: 0.74 };
  }

  if (
    selected === 'load_analyst' &&
    (
      isVagueFollowUp(normalized) ||
      /\b(load|rate|rpm|profit|deadhead|backhaul|fuel|compare|score|lane)\b/i.test(normalized) ||
      ['earnings', 'available_loads', 'smart_loads'].includes(topic || '')
    )
  ) {
    return { intent: 'Load Analysis', confidence: 0.74 };
  }

  if (
    selected === 'fleet_manager' &&
    (
      isVagueFollowUp(normalized) ||
      /\b(driver|truck|fleet|maintenance|utilization|idle time|assignment)\b/i.test(normalized) ||
      ['vehicles', 'driver_panel'].includes(topic || '')
    )
  ) {
    return { intent: /driver/i.test(normalized) || topic === 'driver_panel' ? 'Driver Support' : 'Fleet Management', confidence: 0.72 };
  }

  if (
    selected === 'dispatcher' &&
    (
      isVagueFollowUp(normalized) ||
      /\b(route|lane|backhaul|deadhead|dispatch|timing|reload)\b/i.test(normalized) ||
      ['route_planning', 'available_loads', 'smart_loads'].includes(topic || '')
    )
  ) {
    return { intent: /\bdispatch|assign\b/i.test(normalized) ? 'Dispatching' : 'Route Planning', confidence: 0.72 };
  }

  if (topic) {
    return { intent: 'General Logistics Questions', confidence: 0.62 };
  }

  if (assistantType === 'carrier' || assistantType === 'supplier') {
    return { intent: 'General Logistics Questions', confidence: 0.6 };
  }

  if (/\b(logistics|rpm|carrier|shipper|dispatcher|freight|brokerage|broker|equipment|reefer|dry van|flatbed)\b/i.test(normalized)) {
    return { intent: 'General Logistics Questions', confidence: 0.66 };
  }

  return { intent: 'General Logistics Questions', confidence: 0.55 };
}

async function classifyIntentViaOllama({ message, assistantType = 'general', topic = null, style = 'english' }) {
  const prompt = `You are a logistics intent classifier for Alpha Freight.

Return ONLY valid JSON.
Keys:
- intent: one of [Load Posting, Load Search, Load Analysis, Tracking, Route Planning, Fleet Management, Driver Support, Earnings, Payouts, Fuel Cost, Dispatching, Shipment Management, General Logistics Question, Casual Conversation]
- topic: optional hint from [available_loads, my_posts, my_loads, bids, tracking, pricing, payment, earnings, route_planning, vehicles, support, post_load, none]

Rules:
- If the user is a supplier, prefer supplier workflows (post_load, my_posts, bids) unless user clearly asks carrier pages.
- If the user is a carrier, prefer carrier workflows (available_loads, my_loads, route_planning).
- Use the user's language style (${style}) but output JSON only.

assistantType: ${assistantType}
currentTopic: ${topic || 'none'}
userMessage: ${String(message || '').trim()}`;

  const result = await withTimeout(
    ollama.generate({
      model: MODEL_NAME,
      prompt,
      stream: false,
      keep_alive: '10m',
      options: {
        temperature: 0.1,
        num_predict: 90,
        repeat_penalty: 1.08
      }
    }),
    2500
  );

  const parsed = safeJsonParse(result?.response || '');
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  return {
    intent: parsed.intent || null,
    topic: parsed.topic || null
  };
}

function detectUserIntent(message = '', topic = null, assistantType = 'general', selectedMode = null) {
  const normalized = String(message || '').toLowerCase().trim();
  const selected = normalizeSelectedMode(selectedMode);
  const earningsLike =
    /\b(earnings|revenue|profit margin|maximize earnings|net revenue)\b/i.test(normalized) ||
    (assistantType === 'carrier' && /\b(rate|rpm|per mile|low rate|rate low|rate kam)\b/i.test(normalized));
  const payoutLike = /\b(payout|payment|invoice|wallet|pay instant|pay later)\b/i.test(normalized);
  const loadPostingLike = /\b(post|publish|create)\b.*\b(load|shipment)\b/i.test(normalized);

  if (!normalized) return 'Casual Conversation';
  if (isCasualConversationMessage(normalized)) {
    return 'Casual Conversation';
  }

  if (
    /\b(post|publish|create|book)\b.*\bload\b/i.test(normalized) ||
    /\bship this\b/i.test(normalized) ||
    /\bneed to ship\b/i.test(normalized)
  ) {
    return 'Load Posting';
  }

  if (
    /\b(analy[sz]e|analysis|compare|comparison|rank|score|best option|recommended load|profit estimate|trip profit)\b/i.test(normalized)
  ) {
    return 'Load Analysis';
  }

  if (
    /\b(find|show|search|loads near me|highest paying|backhaul|available loads|best loads)\b/i.test(normalized) &&
    /\bload|loads\b/i.test(normalized)
  ) {
    return 'Load Search';
  }

  if (topic === 'available_loads' || topic === 'smart_loads') {
    return 'Load Search';
  }

  if (/\b(track|tracking|eta|pickup status|transit|delay|delivery confirmation|proof of delivery|pod|gps)\b/i.test(normalized) || (topic === 'tracking' && !earningsLike && !payoutLike && !loadPostingLike)) {
    return 'Tracking';
  }

  if (/\b(route|lane|traffic|toll|backhaul|deadhead|optimi[sz]e my route|route planning)\b/i.test(normalized) || topic === 'route_planning') {
    return 'Route Planning';
  }

  if (/\b(fleet|truck utilization|maintenance|fleet performance|truck performance)\b/i.test(normalized) || topic === 'vehicles') {
    return 'Fleet Management';
  }

  if (/\b(driver|hos|hours of service|driver support|driver assignment|driver operations)\b/i.test(normalized) || topic === 'driver_panel') {
    return 'Driver Support';
  }

  if (earningsLike || topic === 'earnings') {
    return 'Earnings';
  }

  if (payoutLike || ['payment', 'wallet', 'pay_instant', 'pay_later'].includes(topic || '')) {
    return 'Payouts';
  }

  if (/\b(fuel cost|diesel|fuel usage|fuel burn)\b/i.test(normalized)) {
    return 'Fuel Cost';
  }

  if (/\b(dispatch|dispatching|assign driver|assign truck|load board coordination)\b/i.test(normalized)) {
    return 'Dispatching';
  }

  if (/\b(shipment|delivery window|pickup window|shipment management|manage shipment)\b/i.test(normalized)) {
    return 'Shipment Management';
  }

  if (selected === 'tracking_assistant' && (isVagueFollowUp(normalized) || (topic === 'tracking' && !earningsLike && !payoutLike && !loadPostingLike))) {
    return 'Tracking';
  }

  if (
    selected === 'load_analyst' &&
    (
      isVagueFollowUp(normalized) ||
      /\b(load|rate|rpm|profit|deadhead|backhaul|fuel|compare|score|lane)\b/i.test(normalized) ||
      ['earnings', 'available_loads', 'smart_loads'].includes(topic || '')
    )
  ) {
    return 'Load Analysis';
  }

  if (
    selected === 'fleet_manager' &&
    (
      isVagueFollowUp(normalized) ||
      /\b(driver|truck|fleet|maintenance|utilization|idle time|assignment)\b/i.test(normalized) ||
      ['vehicles', 'driver_panel'].includes(topic || '')
    )
  ) {
    return /driver/i.test(normalized) || topic === 'driver_panel' ? 'Driver Support' : 'Fleet Management';
  }

  if (
    selected === 'dispatcher' &&
    (
      isVagueFollowUp(normalized) ||
      /\b(route|lane|backhaul|deadhead|dispatch|timing|reload)\b/i.test(normalized) ||
      ['route_planning', 'available_loads', 'smart_loads'].includes(topic || '')
    )
  ) {
    return /\bdispatch|assign\b/i.test(normalized) ? 'Dispatching' : 'Route Planning';
  }

  if (
    /\b(logistics|rpm|carrier|shipper|dispatcher|freight|brokerage|broker|equipment|reefer|dry van|flatbed)\b/i.test(normalized) ||
    topic
  ) {
    return 'General Logistics Questions';
  }

  if (assistantType === 'carrier' || assistantType === 'supplier') {
    return 'General Logistics Questions';
  }

  return 'Casual Conversation';
}

function detectCopilotMode(lowerMessage = '', topic = null, selectedMode = null, assistantType = 'general') {
  const normalizedSelectedMode = normalizeSelectedMode(selectedMode);
  const userIntent = detectUserIntent(lowerMessage, topic, assistantType, selectedMode);

  if (userIntent === 'Load Analysis' || userIntent === 'Earnings' || userIntent === 'Fuel Cost') {
    return 'load_analyst';
  }

  if (userIntent === 'Tracking') {
    return 'tracking_assistant';
  }

  if (userIntent === 'Route Planning' || userIntent === 'Dispatching') {
    return 'dispatcher';
  }

  if (userIntent === 'Fleet Management' || userIntent === 'Driver Support') {
    return 'fleet_manager';
  }

  if (userIntent === 'Casual Conversation') {
    return 'logistics_copilot';
  }

  if (normalizedSelectedMode && normalizedSelectedMode !== 'logistics_copilot' && userIntent === 'General Logistics Questions') {
    return normalizedSelectedMode;
  }

  return 'logistics_copilot';
}

function extractTripMetrics(text = '') {
  const source = String(text || '');
  const rpm = source.match(/\brpm\b[^0-9]{0,10}\$?\s?(\d+(?:\.\d+)?)/i)?.[1];
  const rate = source.match(/\b(?:rate|total rate|payout|gross revenue)\b[^0-9]{0,10}\$?\s?(\d+(?:\.\d+)?)/i)?.[1];
  const distance = source.match(/\b(?:distance|loaded miles?|trip miles?)\b[^0-9]{0,10}(\d+(?:\.\d+)?)/i)?.[1]
    || source.match(/(\d+(?:\.\d+)?)\s*miles?\b/i)?.[1];
  const deadhead = source.match(/\bdeadhead\b[^0-9]{0,10}(\d+(?:\.\d+)?)/i)?.[1];
  const fuelCost = source.match(/\bfuel cost\b[^0-9]{0,10}\$?\s?(\d+(?:\.\d+)?)/i)?.[1];
  const parsedDistance = distance ? Number(distance) : null;
  const parsedRate = rate ? Number(rate) : null;
  const parsedRpm = rpm ? Number(rpm) : null;

  return {
    rpm: parsedRpm || (parsedRate && parsedDistance ? parsedRate / parsedDistance : null),
    rate: parsedRate,
    distance: parsedDistance,
    deadhead: deadhead ? Number(deadhead) : null,
    fuelCost: fuelCost ? Number(fuelCost) : null
  };
}

function extractLoadContext(text = '') {
  const source = String(text || '');
  const routeMatch = source.match(/\broute:\s*([^\n]+?)\s*->\s*([^\n]+)/i);
  const equipmentMatch = source.match(/\bequipment:\s*([^\n]+)/i);
  const statusMatch = source.match(/\bstatus:\s*([^\n]+)/i);

  return {
    origin: routeMatch?.[1]?.trim() || null,
    destination: routeMatch?.[2]?.trim() || null,
    equipment: equipmentMatch?.[1]?.trim() || null,
    status: statusMatch?.[1]?.trim() || null
  };
}

function formatMoney(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  return `$${value.toFixed(2)}`;
}

function formatMiles(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  return `${Math.round(value)} miles`;
}

function extractBulletPointsFromReply(text = '') {
  const bullets = String(text || '')
    .split('\n')
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter((line) => line.length > 6);

  return uniqueNonEmpty(bullets, 5);
}

function buildQuickActions({ assistantType = 'general', mode = 'logistics_copilot', topic = null }) {
  const baseActions = assistantType === 'supplier'
    ? [
        { label: 'Track Load', action: 'Show me my active loads with current status.', href: '/supplier/my-posts', variant: 'primary' },
        { label: 'Find Carrier', action: 'Find the best carrier for my posted load.', variant: 'secondary' },
        { label: 'Post Load', action: 'Help me post a new load and create it for me.', href: '/supplier/post-load', variant: 'secondary' },
        { label: 'View Bids', action: 'Show me the latest bids on my loads.', href: '/supplier/my-bids', variant: 'secondary' },
        { label: 'Calculate Profit', action: 'Calculate profit or pricing for this shipment.', variant: 'ghost' }
      ]
    : assistantType === 'carrier'
      ? [
          { label: 'Track Load', action: 'Show me my active loads with current status.', href: '/carrier/my-loads', variant: 'primary' },
          { label: 'Find Loads', action: 'Show me the best loads for my current situation.', href: '/carrier/available-loads', variant: 'secondary' },
          { label: 'Post Load', action: 'Explain supplier load posting workflow.', variant: 'ghost' },
          { label: 'View Bids', action: 'Show me my submitted bids and current bid status.', href: '/carrier/my-bids', variant: 'secondary' },
          { label: 'Calculate Profit', action: 'Calculate trip profit and profitability for me.', variant: 'ghost' }
        ]
      : [
          { label: 'Track Load', action: 'Show me active load status and tracking updates.', variant: 'primary' },
          { label: 'Find Carrier', action: 'Help me find the right carrier for this shipment.', variant: 'secondary' },
          { label: 'Post Load', action: 'Help me post a new load with the right details.', variant: 'secondary' },
          { label: 'View Bids', action: 'Show me current bids and offer status.', variant: 'secondary' },
          { label: 'Calculate Profit', action: 'Calculate profit, margin, or trip profitability.', variant: 'ghost' }
        ];

  if (mode === 'tracking_assistant') {
    return [
      baseActions[0],
      { label: 'Delay Alerts', action: 'Show me delay alert best practices and ETA logic.', variant: 'primary' },
      { label: 'Delivery Proof', action: 'Explain delivery confirmation and POD flow.', variant: 'secondary' },
      { label: 'Support', action: 'I need support with an operational issue.', variant: 'ghost' }
    ];
  }

  if (mode === 'load_analyst') {
    return [
      baseActions[assistantType === 'supplier' ? 1 : 1],
      baseActions[4],
      baseActions[3],
      { label: 'Compare Loads', action: 'Compare two loads by RPM, deadhead, fuel cost, and profit estimate.', variant: 'secondary' },
      { label: 'Bid Now', action: 'Take me to the best matching load and let me bid now.', href: '/carrier/available-loads', variant: 'primary' }
    ];
  }

  if (mode === 'dispatcher') {
    return [
      { label: 'Optimize Route', action: 'Optimize my route and reduce empty miles.', variant: 'primary' },
      baseActions[4],
      baseActions[0],
      assistantType === 'carrier'
        ? { label: 'My Fleet', action: 'Help me manage fleet, drivers, and equipment.', href: '/carrier/vehicles', variant: 'ghost' }
        : baseActions[1]
    ];
  }

  if (mode === 'fleet_manager') {
    return [
      assistantType === 'carrier'
        ? { label: 'My Fleet', action: 'Help me manage fleet, drivers, and equipment.', href: '/carrier/vehicles', variant: 'primary' }
        : baseActions[0],
      { label: 'Driver Panel', action: 'Open my driver panel and fleet operations.', href: '/carrier/driver-panel', variant: 'primary' },
      { label: 'Open Tracking', action: 'Review live tracking across fleet movements.', variant: 'secondary' },
      baseActions[4]
    ];
  }

  if (topic === 'support' || topic === 'support_policy') {
    return [
      { label: 'Support', action: 'I need support with an operational issue.', variant: 'primary' },
      baseActions[0],
      baseActions[4]
    ];
  }

  return baseActions;
}

function buildSuggestedQuestions({ assistantType = 'general', mode = 'logistics_copilot' }) {
  if (mode === 'load_analyst') {
    return [
      'Show highest paying loads',
      'Compare two loads for me',
      'Calculate trip profit',
      'Find backhaul loads'
    ];
  }

  if (mode === 'tracking_assistant') {
    return [
      'What causes shipment delays?',
      'How is ETA calculated?',
      'Explain proof of delivery',
      'How does GPS tracking work?'
    ];
  }

  if (mode === 'fleet_manager') {
    return [
      'Show my fleet health summary',
      'How do I manage driver operations?',
      'Explain vehicle utilization',
      'Help me reduce downtime'
    ];
  }

  if (mode === 'dispatcher') {
    return [
      'Optimize my route',
      'Find backhaul loads',
      'Reduce deadhead miles',
      'Show best reload strategy'
    ];
  }

  if (assistantType === 'carrier') {
    return [
      '🚛 Find loads near me',
      '💰 Show highest paying loads',
      '📦 Explain shipment tracking',
      '📍 Find backhaul loads',
      '⛽ Calculate fuel cost',
      '📈 Maximize earnings'
    ];
  }

  if (assistantType === 'supplier') {
    return [
      '🚛 Find loads near me',
      '💰 Show highest paying loads',
      '📦 Explain shipment tracking',
      '📍 Find backhaul loads',
      '⛽ Calculate fuel cost',
      '📈 Maximize earnings'
    ];
  }

  return [
    '🚛 Find loads near me',
    '💰 Show highest paying loads',
    '📦 Explain shipment tracking',
    '📍 Find backhaul loads',
    '⛽ Calculate fuel cost',
    '📈 Maximize earnings'
  ];
}

function getModePresentation(mode = 'logistics_copilot') {
  const map = {
    logistics_copilot: { label: 'Logistics Copilot', assistantName: 'Alpha Freight Copilot' },
    tracking_assistant: { label: 'Tracking Assistant', assistantName: 'Tracking Assistant' },
    load_analyst: { label: 'Load Analyst', assistantName: 'Load Analyst' },
    fleet_manager: { label: 'Fleet Manager', assistantName: 'Fleet Manager' },
    dispatcher: { label: 'Dispatcher', assistantName: 'Dispatcher' }
  };

  return map[mode] || map.logistics_copilot;
}

function getConfidenceScore({ mode = 'logistics_copilot', memory, lowerMessage = '' }) {
  const baseScores = {
    logistics_copilot: 92,
    tracking_assistant: 95,
    load_analyst: 96,
    fleet_manager: 93,
    dispatcher: 94
  };

  let score = baseScores[mode] || 91;
  if (memory.truckType) score += 1;
  if (memory.userLocation) score += 1;
  if (memory.preferredRoutes.length) score += 1;
  if (/rpm|deadhead|fuel|eta|pickup|delivery|route/i.test(lowerMessage)) score += 1;

  return Math.min(score, 99);
}

function getKnowledgeSource(mode = 'logistics_copilot') {
  if (mode === 'tracking_assistant') {
    return 'Logistics Operations Database';
  }

  if (mode === 'load_analyst' || mode === 'dispatcher') {
    return 'Logistics Operations Database';
  }

  return 'Alpha Freight Knowledge Base';
}

function buildRoutePreview({ memory, lowerMessage = '' }) {
  const preferredRoute = memory.preferredRoutes?.[0];
  if (preferredRoute) {
    const [pickup, delivery] = preferredRoute.split('->').map((item) => item.trim());
    return {
      pickup: pickup || memory.userLocation || 'Pickup',
      transit: 'Route planning and live movement',
      delivery: delivery || 'Delivery'
    };
  }

  if (memory.userLocation && /load|route|tracking|pickup|delivery/i.test(lowerMessage)) {
    return {
      pickup: memory.userLocation,
      transit: 'Route and shipment movement',
      delivery: 'Final delivery destination'
    };
  }

  return null;
}

function buildLoadAnalysisSections({ lowerMessage, memory, assistantType, style = 'english' }) {
  const metrics = extractTripMetrics(lowerMessage);
  const loadContext = extractLoadContext(lowerMessage);
  const assumedFuelCost =
    typeof metrics.fuelCost === 'number'
      ? metrics.fuelCost
      : typeof metrics.distance === 'number'
        ? ((metrics.distance + (metrics.deadhead || 0)) / 6.5) * 4.2
        : null;
  const grossRevenue =
    typeof metrics.rate === 'number'
      ? metrics.rate
      : typeof metrics.rpm === 'number' && typeof metrics.distance === 'number'
        ? metrics.rpm * metrics.distance
      : null;
  const estimatedProfit =
    typeof grossRevenue === 'number' && typeof assumedFuelCost === 'number'
      ? grossRevenue - assumedFuelCost
      : null;
  const deadheadRatio =
    typeof metrics.deadhead === 'number' && typeof metrics.distance === 'number' && metrics.distance > 0
      ? metrics.deadhead / metrics.distance
      : null;

  const keyPoints = [
    pickStyleText(
      style,
      `Highest Paying Load: prioritize the lane with the strongest total revenue after fuel and empty miles.`,
      `Highest Paying Load: us lane ko priority do jahan fuel aur empty miles ke baad revenue sab se strong ho.`
    ),
    pickStyleText(
      style,
      `Best RPM Load: ${typeof metrics.rpm === 'number' ? formatMoney(metrics.rpm) : 'Need RPM'} per mile is the best signal when comparing similar equipment loads.`,
      `Best RPM Load: ${typeof metrics.rpm === 'number' ? formatMoney(metrics.rpm) : 'RPM chahiye'} per mile milti julti equipment loads compare karne ka strong signal hota ha.`
    ),
    pickStyleText(
      style,
      `Closest Load: ${memory.userLocation ? `near ${memory.userLocation}` : 'Need current location'} gives faster pickup and lower wasted miles.`,
      `Closest Load: ${memory.userLocation ? `${memory.userLocation} ke near` : 'current location chahiye'} se pickup fast hota ha aur extra miles kam hoti hain.`
    ),
    pickStyleText(
      style,
      `Recommended Load: match ${memory.truckType || memory.equipmentType || 'your equipment'} with short deadhead and consistent reload potential.`,
      `Recommended Load: ${memory.truckType || memory.equipmentType || 'aapki equipment'} ko short deadhead aur strong reload potential ke sath match karo.`
    ),
  ];

  if (loadContext.origin && loadContext.destination) {
    keyPoints.unshift(
      pickStyleText(
        style,
        `Route: ${loadContext.origin} -> ${loadContext.destination}.`,
        `Route: ${loadContext.origin} -> ${loadContext.destination}.`
      )
    );
  }

  if (loadContext.equipment) {
    keyPoints.push(
      pickStyleText(style, `Equipment: ${loadContext.equipment}.`, `Equipment: ${loadContext.equipment}.`)
    );
  }

  if (loadContext.status) {
    keyPoints.push(
      pickStyleText(style, `Current Status: ${loadContext.status}.`, `Current Status: ${loadContext.status}.`)
    );
  }

  if (typeof metrics.rate === 'number') {
    keyPoints.push(
      pickStyleText(style, `Total Rate: ${formatMoney(metrics.rate)}.`, `Total Rate: ${formatMoney(metrics.rate)}.`)
    );
  }

  if (typeof metrics.distance === 'number') {
    keyPoints.push(
      pickStyleText(style, `Loaded Distance: ${formatMiles(metrics.distance)}.`, `Loaded Distance: ${formatMiles(metrics.distance)}.`)
    );
  }
  if (typeof metrics.deadhead === 'number') {
    keyPoints.push(
      pickStyleText(
        style,
        `Deadhead Miles: ${formatMiles(metrics.deadhead)}${typeof deadheadRatio === 'number' ? ` (${Math.round(deadheadRatio * 100)}% of loaded miles)` : ''}.`,
        `Deadhead Miles: ${formatMiles(metrics.deadhead)}${typeof deadheadRatio === 'number' ? ` (${Math.round(deadheadRatio * 100)}% loaded miles ka)` : ''}.`
      )
    );
  }
  if (typeof assumedFuelCost === 'number') {
    keyPoints.push(
      pickStyleText(style, `Estimated Fuel Cost: ${formatMoney(assumedFuelCost)}.`, `Estimated Fuel Cost: ${formatMoney(assumedFuelCost)}.`)
    );
  }
  if (typeof estimatedProfit === 'number') {
    keyPoints.push(
      pickStyleText(
        style,
        `Estimated Profit: ${formatMoney(estimatedProfit)} before tolls, driver cost, and other overhead.`,
        `Estimated Profit: ${formatMoney(estimatedProfit)} tolls, driver cost aur dusre overhead se pehle.`
      )
    );
  }

  const recommendation =
    typeof estimatedProfit === 'number'
      ? pickStyleText(
          style,
          `This looks strongest when profit stays positive and deadhead stays controlled. Prioritize the load only if equipment fit is correct and the reload opportunity after delivery is realistic.`,
          `Ye tab strong lagta ha jab profit positive rahe aur deadhead control men ho. Load ko tabhi priority do jab equipment fit sahi ho aur delivery ke baad reload chance realistic ho.`
        )
      : pickStyleText(
          style,
          `For a true ranking, send truck type, current location, RPM or total rate, loaded miles, and deadhead miles. Then I can rank the best load, highest RPM load, closest load, and best overall recommendation.`,
          `True ranking ke liye truck type, current location, RPM ya total rate, loaded miles aur deadhead miles bhejo. Phir main best load, highest RPM load, closest load aur overall best recommendation rank kar dunga.`
        );

  return {
    title: pickStyleText(style, '🚛 Best Load Analysis', '🚛 Best Load Analysis'),
    shortExplanation: assistantType === 'carrier'
      ? pickStyleText(
          style,
          `I evaluate a load using RPM, deadhead, fuel cost, equipment fit, and reload potential instead of looking at pay alone.`,
          `Main load ko sirf pay se nahi, balki RPM, deadhead, fuel cost, equipment fit aur reload potential ke sath evaluate karta hoon.`
        )
      : pickStyleText(
          style,
          `I evaluate the shipment opportunity using revenue, service fit, and execution risk so you can make a stronger freight decision.`,
          `Main shipment opportunity ko revenue, service fit aur execution risk ke hisab se evaluate karta hoon taa ke aap stronger freight decision le saken.`
        ),
    keyPoints: uniqueNonEmpty(keyPoints, 8),
    metrics: uniqueNonEmpty([
      `Load Score||${typeof estimatedProfit === 'number' ? Math.max(82, Math.min(98, Math.round((estimatedProfit / 10) + 70))) : 92}/100||🚛||positive`,
      `Rate||${typeof metrics.rate === 'number' ? formatMoney(metrics.rate) : 'Need total rate'}||💰||neutral`,
      `Final Profit||${typeof estimatedProfit === 'number' ? formatMoney(estimatedProfit) : 'Need rate + fuel estimate'}||✅||positive`,
      `RPM||${typeof metrics.rpm === 'number' ? formatMoney(metrics.rpm) : 'Need RPM'}||💷||neutral`,
      `Deadhead||${typeof metrics.deadhead === 'number' ? formatMiles(metrics.deadhead) : 'Need deadhead miles'}||🛣️||warning`,
      `Fuel Cost||${typeof assumedFuelCost === 'number' ? formatMoney(assumedFuelCost) : 'Need fuel estimate'}||⛽||neutral`
    ], 6),
    sections: [
      {
        id: 'load-details',
        title: 'Load Details',
        icon: '📋',
        summary: 'This estimate uses the exact load context that was clicked in chat.',
        details: [
          `Route: ${loadContext.origin && loadContext.destination ? `${loadContext.origin} -> ${loadContext.destination}` : 'Need route'}.`,
          `Equipment: ${loadContext.equipment || memory.truckType || memory.equipmentType || 'Need equipment'}.`,
          `Status: ${loadContext.status || 'Need current load status'}.`,
          `Rate: ${typeof metrics.rate === 'number' ? formatMoney(metrics.rate) : 'Need total rate'}.`,
          `Loaded miles: ${typeof metrics.distance === 'number' ? formatMiles(metrics.distance) : 'Need loaded miles'}.`,
          `Estimated final profit: ${typeof estimatedProfit === 'number' ? formatMoney(estimatedProfit) : 'Need exact trip cost inputs'}.`
        ]
      },
      {
        id: 'highest-paying',
        title: 'Highest Paying Load',
        icon: '💷',
        summary: 'Strong total rate matters, but only after fuel and empty miles are considered.',
        details: [
          'Check headline rate and compare it against loaded miles.',
          'Make sure the load does not create expensive deadhead before pickup.',
          'A strong-paying lane is better when reload chances also stay healthy.'
        ]
      },
      {
        id: 'best-rpm',
        title: 'Best RPM Load',
        icon: '📈',
        summary: 'RPM gives a faster apples-to-apples comparison across similar trips.',
        details: [
          `Current RPM signal: ${typeof metrics.rpm === 'number' ? formatMoney(metrics.rpm) : 'Need RPM value'}.`,
          'Higher RPM matters most when equipment and service level are similar.',
          'Low RPM can still work if deadhead and fuel cost remain low.'
        ]
      },
      {
        id: 'closest-load',
        title: 'Closest Load',
        icon: '📍',
        summary: 'Closest load usually cuts wasted miles, waiting time, and fuel burn.',
        details: [
          `Current location context: ${memory.userLocation || 'Need your location'}.`,
          'Use closest profitable pickup when time-sensitive dispatch is important.',
          'Closest is not always best if RPM or backhaul potential is weak.'
        ]
      }
    ],
    routePreview: buildRoutePreview({ memory, lowerMessage }),
    platformIntent: assistantType === 'carrier'
      ? {
          type: 'loads_search',
          equipmentType: memory.equipmentType,
          location: memory.userLocation,
          route: memory.preferredRoutes?.[0] || null
        }
      : null,
    recommendation,
    nextStep: pickStyleText(
      style,
      `Would you like me to compare this with other available loads or calculate your trip profit estimate?`,
      `Kya aap chahte hain ke main isay dusre available loads ke sath compare karoon ya aapka trip profit estimate banaoon?`
    )
  };
}

function buildTrackingSections(style = 'english') {
  return {
    title: pickStyleText(style, '📍 Tracking Assistant', '📍 Tracking Assistant'),
    shortExplanation: pickStyleText(
      style,
      `The best way to understand tracking is to follow the shipment through clear status updates from pickup to delivery.`,
      `Tracking ko best tareeqe se samajhne ke liye har shipment ko pickup se delivery tak status-based flow men dekhna chahiye.`
    ),
    keyPoints: [
      pickStyleText(style, 'Pickup Status: confirms the load has moved into live execution.', 'Pickup Status: ye confirm karta ha ke load live execution men aa gaya ha.'),
      pickStyleText(style, 'Transit Status: shows movement progress, route updates, and current journey stage.', 'Transit Status: movement progress, route updates aur current journey stage dikhata ha.'),
      pickStyleText(style, 'Delay Alerts: flag issues early so dispatch, shipper, and carrier can react faster.', 'Delay Alerts: issue ko jaldi flag karte hain taa ke dispatch, shipper aur carrier fast react kar saken.'),
      pickStyleText(style, 'Estimated Arrival Time: keeps delivery expectation clear and helps coordination.', 'Estimated Arrival Time: delivery expectation clear rakhta ha aur coordination men help karta ha.'),
      pickStyleText(style, 'Delivery Confirmation: closes the job with final delivery proof and operational visibility.', 'Delivery Confirmation: final delivery proof aur operational visibility ke sath job close karta ha.')
    ],
    metrics: [
      { label: 'Pickup Status', value: 'Ready to confirm', icon: '📦', tone: 'neutral' },
      { label: 'Transit Status', value: 'Live movement updates', icon: '🚚', tone: 'positive' },
      { label: 'Delay Alert', value: 'Exception monitoring active', icon: '⚠️', tone: 'warning' },
      { label: 'ETA', value: 'Calculated from route and progress', icon: '⏰', tone: 'neutral' },
      { label: 'Delivery', value: 'Proof and confirmation ready', icon: '✅', tone: 'positive' }
    ],
    sections: [
      {
        id: 'pickup-status',
        title: 'Pickup Status',
        icon: '📦',
        summary: 'Shows whether the shipment has moved from planning into live execution.',
        details: [
          'Confirms pickup readiness or actual collection.',
          'Helps dispatch and shipper align on start of movement.',
          'Useful for preventing early confusion before the truck is live.'
        ],
        defaultOpen: true
      },
      {
        id: 'transit-status',
        title: 'Transit Status',
        icon: '🚚',
        summary: 'Tracks journey progress after pickup until final delivery.',
        details: [
          'Shows movement stage, route progress, and current trip status.',
          'Useful for dispatch visibility and customer communication.',
          'Works best when updates are consistent and time-aware.'
        ]
      },
      {
        id: 'delay-alert',
        title: 'Delay Alert',
        icon: '⚠️',
        summary: 'Flags disruption before it becomes a service problem.',
        details: [
          'Highlights route delays, missed timing, or exception events.',
          'Gives teams time to update ETA and communicate clearly.',
          'Most valuable when paired with proactive support action.'
        ]
      },
      {
        id: 'eta',
        title: 'ETA',
        icon: '⏰',
        summary: 'Estimated arrival updates based on route progress and timing.',
        details: [
          'ETA changes as traffic, stop time, and route events evolve.',
          'Best practice is to refresh ETA after every major status shift.',
          'Clear ETA management improves trust and delivery planning.'
        ]
      },
      {
        id: 'delivery-confirmed',
        title: 'Delivery Confirmed',
        icon: '✅',
        summary: 'Closes the shipment with proof, timestamp, and handover visibility.',
        details: [
          'Confirms final status with delivery evidence.',
          'Supports proof of delivery and issue resolution later.',
          'Important for billing, customer service, and operational audit trails.'
        ]
      }
    ],
    routePreview: {
      pickup: pickStyleText(style, 'Pickup confirmed', 'Pickup confirmed'),
      transit: pickStyleText(style, 'GPS tracking and ETA updates', 'GPS tracking aur ETA updates'),
      delivery: pickStyleText(style, 'Delivery confirmation and POD', 'Delivery confirmation aur POD')
    },
    platformIntent: { type: 'tracking_lookup' },
    recommendation: pickStyleText(
      style,
      'Tracking is most useful when statuses stay updated on time and ETA changes are communicated early.',
      'Tracking sab se useful tab hoti hai jab statuses timely update hon aur ETA changes ko jaldi communicate kiya jaye.'
    ),
    nextStep: pickStyleText(
      style,
      'If you want, I can break down pickup, in-transit, delayed, and delivered statuses with a simple example.',
      'Agar aap chaho to main pickup, in-transit, delayed, aur delivered status ko simple example ke sath break kar deta hoon.'
    )
  };
}

function buildProfitabilitySections({ lowerMessage, memory, style = 'english' }) {
  const metrics = extractTripMetrics(lowerMessage);
  const fallbackLocation = memory.userLocation ? ` near ${memory.userLocation}` : '';

  return {
    title: pickStyleText(style, '💷 Profitability Analysis', '💷 Profitability Analysis'),
    shortExplanation: pickStyleText(
      style,
      `Profit is not decided by total rate alone. RPM, fuel cost, deadhead miles, and reload opportunity together show the real trip quality${fallbackLocation}.`,
      `Profit sirf total rate se decide nahi hota. RPM, fuel cost, deadhead miles aur reload opportunity sab mil kar real trip quality dikhate hain${fallbackLocation}.`
    ),
    keyPoints: uniqueNonEmpty([
      pickStyleText(style, `Rate Per Mile (RPM): ${typeof metrics.rpm === 'number' ? formatMoney(metrics.rpm) : 'Need RPM'} is one of the fastest ways to compare lane quality.`, `Rate Per Mile (RPM): ${typeof metrics.rpm === 'number' ? formatMoney(metrics.rpm) : 'RPM chahiye'} lane quality compare karne ka fast tareeqa ha.`),
      pickStyleText(style, `Fuel Cost: ${typeof metrics.fuelCost === 'number' ? formatMoney(metrics.fuelCost) : 'Need fuel cost or miles to estimate fuel burn'}.`, `Fuel Cost: ${typeof metrics.fuelCost === 'number' ? formatMoney(metrics.fuelCost) : 'fuel cost ya miles chahiye taa ke estimate ho sake'}.`),
      pickStyleText(style, `Deadhead Miles: ${typeof metrics.deadhead === 'number' ? formatMiles(metrics.deadhead) : 'Need empty miles'} should stay controlled to protect net revenue.`, `Deadhead Miles: ${typeof metrics.deadhead === 'number' ? formatMiles(metrics.deadhead) : 'empty miles chahiye'} ko control men rehna chahiye taa ke net revenue protect rahe.`),
      pickStyleText(style, `Backhaul Potential: the return load matters because strong backhaul reduces wasted capacity.`, `Backhaul Potential: return load important hota ha kyun ke strong backhaul wasted capacity kam karta ha.`),
      pickStyleText(style, `Equipment Fit: ${memory.equipmentType || 'correct equipment'} keeps cost and service reliability aligned.`, `Equipment Fit: ${memory.equipmentType || 'sahi equipment'} cost aur service reliability ko aligned rakhta ha.`)
    ], 5),
    metrics: [
      { label: 'RPM', value: typeof metrics.rpm === 'number' ? formatMoney(metrics.rpm) : 'Need RPM', icon: '💷', tone: 'neutral' },
      { label: 'Fuel Cost', value: typeof metrics.fuelCost === 'number' ? formatMoney(metrics.fuelCost) : 'Need fuel estimate', icon: '⛽', tone: 'warning' },
      { label: 'Deadhead', value: typeof metrics.deadhead === 'number' ? formatMiles(metrics.deadhead) : 'Need empty miles', icon: '🛣️', tone: 'warning' },
      { label: 'Profitability', value: 'Focused on net trip quality', icon: '📈', tone: 'positive' }
    ],
    recommendation: pickStyleText(
      style,
      'Prioritize loads with healthy RPM, low deadhead, and realistic reload options instead of only chasing the biggest headline rate.',
      'Aise loads ko priority do jahan RPM healthy ho, deadhead low ho aur reload options realistic hon, sirf badi headline rate ko chase mat karo.'
    ),
    nextStep: pickStyleText(
      style,
      'Send me the rate, loaded miles, deadhead, and fuel estimate, and I will give you a stronger trip profit breakdown.',
      'Aap mujhe rate, loaded miles, deadhead aur fuel estimate bhej dein, main aapko stronger trip profit breakdown de deta hoon.'
    )
  };
}

function buildRouteSections({ memory, style = 'english' }) {
  return {
    title: pickStyleText(style, '🛣️ Route Optimization', '🛣️ Route Optimization'),
    shortExplanation: pickStyleText(
      style,
      `Route optimization is not only about the shortest distance. The best route reduces empty miles, delay risk, and weak reload zones.`,
      `Route optimization ka goal sirf shortest distance nahi hota. Best route wo hoti hai jo empty miles, delay risk aur weak reload zones ko kam kare.`
    ),
    keyPoints: uniqueNonEmpty([
      pickStyleText(style, `Preferred Routes: ${memory.preferredRoutes.length ? memory.preferredRoutes.join(' | ') : 'Need your preferred lanes'}.`, `Preferred Routes: ${memory.preferredRoutes.length ? memory.preferredRoutes.join(' | ') : 'preferred lanes chahiye'}.`),
      pickStyleText(style, `Current Location: ${memory.userLocation || 'Need current location'} helps choose the closest profitable pickup.`, `Current Location: ${memory.userLocation || 'current location chahiye'} closest profitable pickup choose karne men help karti ha.`),
      pickStyleText(style, `Backhaul Planning: line up a return load early so the truck does not run empty.`, `Backhaul Planning: return load pehle line up karo taa ke truck empty na chale.`),
      pickStyleText(style, `Deadhead Control: keep empty miles low before pickup and after delivery.`, `Deadhead Control: pickup se pehle aur delivery ke baad empty miles low rakho.`),
      pickStyleText(style, `Timing Fit: route quality improves when pickup, delivery window, and driver hours all align.`, `Timing Fit: route quality tab improve hoti ha jab pickup, delivery window aur driver hours align hon.`)
    ], 5),
    metrics: [
      { label: 'Current Location', value: memory.userLocation || 'Need current location', icon: '📍', tone: 'neutral' },
      { label: 'Preferred Route', value: memory.preferredRoutes?.[0] || 'Need preferred lane', icon: '🚚', tone: 'neutral' },
      { label: 'Deadhead Focus', value: 'Reduce empty miles', icon: '🛣️', tone: 'warning' },
      { label: 'Backhaul Goal', value: 'Keep reload opportunity active', icon: '📦', tone: 'positive' }
    ],
    routePreview: buildRoutePreview({ memory, lowerMessage: 'route planning' }),
    recommendation: pickStyleText(
      style,
      'Best route planning balances speed, reload opportunity, and lower empty miles instead of only following the shortest line on the map.',
      'Best route planning speed, reload opportunity aur lower empty miles ko balance karti ha, sirf map ki shortest line ko follow nahi karti.'
    ),
    nextStep: pickStyleText(
      style,
      'If you share your current location, truck type, and preferred lane, I can suggest a stronger route strategy.',
      'Agar aap mujhe current location, truck type aur preferred lane bata dein to main stronger route strategy suggest kar sakta hoon.'
    )
  };
}

function buildDefaultSections({ topic, plainReply, assistantType, memory, mode, style = 'english' }) {
  const fallbackPoints = extractBulletPointsFromReply(plainReply);
  const genericPoints = fallbackPoints.length
    ? fallbackPoints
    : uniqueNonEmpty([
        memory.truckType ? `Truck Type: ${memory.truckType}.` : '',
        memory.userLocation ? `Current Location: ${memory.userLocation}.` : '',
        memory.preferredRoutes.length ? `Preferred Routes: ${memory.preferredRoutes.join(' | ')}.` : '',
        topic ? `Active Topic: ${formatTopicLabel(topic)}.` : '',
        `Mode: ${mode.replace(/_/g, ' ')}.`
      ], 4);

  return {
    title: `${getTopicEmoji(topic, assistantType)} ${toTitleCase(formatTopicLabel(topic || 'Freight operations update'))}`,
    shortExplanation: plainReply.split('\n')[0]?.trim() || plainReply,
    keyPoints: genericPoints.length ? genericPoints : ['Alpha Freight AI Copilot keeps logistics context, operations flow, and next actions aligned.'],
    metrics: [
      { label: 'Mode', value: mode.replace(/_/g, ' '), icon: '🤖', tone: 'neutral' },
      { label: 'Persona', value: memory.persona || 'Freight Operations Copilot', icon: '🧠', tone: 'positive' }
    ],
    recommendation: topic
      ? pickStyleText(
          style,
          `Best approach is to continue with ${formatTopicLabel(topic)} using the exact route, equipment, or shipment context you already shared.`,
          `Best approach ye ha ke ${formatTopicLabel(topic)} ko usi exact route, equipment ya shipment context ke sath continue kiya jaye jo aap pehle share kar chuke hain.`
        )
      : pickStyleText(
          style,
          'Best approach is to share exact route, equipment, shipment, or load details so I can give a more operational recommendation.',
          'Best approach ye ha ke aap exact route, equipment, shipment ya load details share karein taa ke main zyada operational recommendation de sakoon.'
        ),
    nextStep: topic
      ? pickStyleText(
          style,
          `If you want, I can explain ${formatTopicLabel(topic)} in a simpler, more detailed, or comparison format.`,
          `Aap chaho to main ${formatTopicLabel(topic)} ko aur simple, detailed ya comparison format men explain kar sakta hoon.`
        )
      : pickStyleText(
          style,
          'In your next message, send your route, truck type, shipment details, or current challenge.',
          'Aap next message men route, truck type, shipment details ya current challenge bhej dein.'
        )
  };
}

function shouldRenderAdvancedCard({ lowerMessage = '', topic = null, userIntent = 'General Logistics Questions' }) {
  const message = String(lowerMessage || '').trim();

  if (!message) {
    return false;
  }

  if (isCasualConversationMessage(message)) {
    return false;
  }

  if (['Casual Conversation', 'General Logistics Questions', 'Load Posting', 'Load Search', 'Payouts', 'Driver Support'].includes(userIntent)) {
    return false;
  }

  const advancedPatterns = [
    /\banaly[sz]e\b/i,
    /\banalysis\b/i,
    /\bcompare\b/i,
    /\bcomparison\b/i,
    /\bcalculate\b/i,
    /\bcalculation\b/i,
    /\bprofit\b/i,
    /\boptimi[sz]e\b/i,
    /\boptimization\b/i,
    /\bbreakdown\b/i,
    /\bmarket insight/i,
    /\bfleet analysis/i,
    /\broute optimization/i,
    /\btrip profit/i,
    /\bload score/i,
    /\bearnings breakdown/i,
    /\bshipment analysis/i,
  ];

  if (advancedPatterns.some((pattern) => pattern.test(message))) {
    return true;
  }

  if (topic === 'tracking') {
    const isExplainOnly =
      /\b(what is|what's|explain|define)\b/i.test(message) &&
      /\b(tracking|pod|proof of delivery|eta)\b/i.test(message) &&
      !/\b(where is|status|current status|delay|late|stuck|exception|breakdown)\b/i.test(message);

    if (isExplainOnly) {
      return false;
    }

    if (/\b(where is|status|current status|delay|late|stuck|exception|breakdown)\b/i.test(message)) {
      return true;
    }
  }

  return false;
}

function buildStructuredAssistantReply({
  assistantType = 'general',
  lowerMessage = '',
  topic = null,
  plainReply = '',
  memory,
  style = 'english',
  selectedMode = null,
  history = []
}) {
  const mode = detectCopilotMode(lowerMessage, topic, selectedMode, assistantType);
  const modeMeta = getModePresentation(mode);
  const userIntent = detectUserIntent(lowerMessage, topic, assistantType, selectedMode);
  const responseLength = detectResponseLength(lowerMessage);
  const displayStyle = shouldRenderAdvancedCard({ lowerMessage, topic, userIntent }) ? 'card' : 'plain';

  let sections;
  if (mode === 'load_analyst') {
    sections = buildLoadAnalysisSections({ lowerMessage, memory, assistantType, style });
  } else if (mode === 'tracking_assistant') {
    sections = buildTrackingSections(style);
  } else if (mode === 'fleet_manager') {
    sections = buildDefaultSections({ topic: topic || 'vehicles', plainReply, assistantType, memory, mode, style });
  } else if (mode === 'dispatcher') {
    sections = buildRouteSections({ memory, style });
  } else if (mode === 'profitability_analysis') {
    sections = buildProfitabilitySections({ lowerMessage, memory, style });
  } else {
    sections = buildDefaultSections({ topic, plainReply, assistantType, memory, mode, style });
  }

  const actionRequest = buildActionRequest({
    assistantType,
    lowerMessage,
    history,
    style
  });
  const detectedPlatformIntent = detectPlatformIntent({
    lowerMessage,
    assistantType,
    topic,
    memory
  });

  return {
    mode,
    displayStyle,
    userIntent,
    responseLength,
    modeLabel: modeMeta.label,
    assistantName: modeMeta.assistantName,
    confidence: getConfidenceScore({ mode, memory, lowerMessage }),
    knowledgeSource: getKnowledgeSource(mode),
    title: sections.title,
    shortExplanation: sections.shortExplanation,
    keyPoints: uniqueNonEmpty(sections.keyPoints, 6),
    recommendation: sections.recommendation,
    nextStep: sections.nextStep,
    metrics: (sections.metrics || []).map((metric) => {
      if (typeof metric === 'string') {
        const [label, value, icon, tone] = metric.split('||');
        return { label, value, icon, tone };
      }
      return metric;
    }),
    sections: sections.sections || [],
    routePreview: sections.routePreview || null,
    quickActions: buildQuickActions({ assistantType, mode, topic }),
    suggestedQuestions: buildSuggestedQuestions({ assistantType, mode }),
    platformIntent: detectedPlatformIntent || sections.platformIntent || null,
    actionRequest,
    memory: {
      truckType: memory.truckType,
      equipmentType: memory.equipmentType,
      userLocation: memory.userLocation,
      preferredRoutes: memory.preferredRoutes,
      previousSearches: memory.previousSearches,
      recentLoads: memory.recentLoads,
      activeTopic: memory.activeTopic,
      workflowStage: memory.workflowStage,
      role: memory.role || assistantType,
      persona: memory.persona || getPersonaLabel(assistantType, topic)
    },
    rawText: plainReply,
  };
}

function composeStructuredText(structuredReply) {
  if (structuredReply.displayStyle !== 'card') {
    return structuredReply.rawText || structuredReply.shortExplanation || '';
  }

  const lines = [
    structuredReply.title,
    '',
    structuredReply.shortExplanation,
    '',
    'Key Points:',
    ...structuredReply.keyPoints.map((point) => `• ${point}`),
  ];

  if (structuredReply.recommendation) {
    lines.push('', `Recommendation: ${structuredReply.recommendation}`);
  }

  if (structuredReply.nextStep) {
    lines.push('', `Next Step: ${structuredReply.nextStep}`);
  }

  return lines.join('\n').trim();
}

function detectServiceIntent(message) {
  const normalized = message.toLowerCase().replace(/&/g, 'and');

  return Object.keys(SERVICE_DETAILS).find((service) => {
    const serviceTokens = service.split(' ');
    return normalized.includes(service) || serviceTokens.every((token) => normalized.includes(token));
  });
}

function toTitleCase(value) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function pickStyleText(style, englishText, romanUrduText, urduText) {
  if (style === 'roman_urdu') {
    return romanUrduText;
  }

  if (style === 'urdu') {
    return urduText || romanUrduText;
  }

  if (style === 'other_language') {
    return englishText;
  }

  if (style === 'mixed') {
    return englishText;
  }

  return englishText;
}

function detectTopicFromText(text, assistantType = 'general') {
  const normalized = (text || '').toLowerCase();
  const serviceIntent = detectServiceIntent(normalized);

  if (serviceIntent) return serviceIntent;
  if (normalized.includes('dashboard')) return 'dashboard';
  if (
    normalized.includes('alpha freight company') ||
    normalized.includes('company info') ||
    normalized.includes('company information') ||
    normalized.includes('company details') ||
    normalized.includes('about alpha freight') ||
    normalized.includes('about company') ||
    normalized.includes('registered office') ||
    normalized.includes('head office') ||
    normalized.includes('contact information') ||
    normalized.includes('contact details')
  ) return 'company_info';
  if (normalized.includes('pricing') || normalized.includes('price') || normalized.includes('budget') || normalized.includes('cost')) return 'pricing';
  if (normalized.includes('rate')) return assistantType === 'carrier' ? 'earnings' : 'pricing';
  if (normalized.includes('verify') || normalized.includes('verification') || normalized.includes('verified')) return 'verification';
  if (normalized.includes('policy') || normalized.includes('sla') || normalized.includes('refund') || normalized.includes('escalation')) return 'support_policy';
  if (normalized.includes('post') && normalized.includes('load')) return 'post_load';
  if (normalized.includes('wallet')) return 'wallet';
  if (normalized.includes('available load') || normalized.includes('best load') || normalized.includes('load near')) return 'available_loads';
  if (normalized.includes('smart load')) return 'smart_loads';
  if (normalized.includes('my load')) return 'my_loads';
  if (normalized.includes('my post') || normalized.includes('posts')) return 'my_posts';
  if (normalized.includes('bid')) return 'bids';
  if (normalized.includes('earn') || normalized.includes('maximize') || normalized.includes('profit')) return 'earnings';
  if (normalized.includes('pay') || normalized.includes('payout') || normalized.includes('payment')) return 'payment';
  if (normalized.includes('pay instant') || normalized.includes('instant pay')) return 'pay_instant';
  if (normalized.includes('pay later')) return 'pay_later';
  if (normalized.includes('track') || normalized.includes('tracking')) return 'tracking';
  if (normalized.includes('carrier') && assistantType === 'supplier') return 'find_carriers';
  if (normalized.includes('verified carrier') || normalized.includes('reliable carrier')) return 'find_carriers';
  if (normalized.includes('route')) return 'route_planning';
  if (normalized.includes('driver panel') || normalized.includes('driver')) return 'driver_panel';
  if (normalized.includes('vehicle') || normalized.includes('fleet')) return 'vehicles';
  if (normalized.includes('support') || normalized.includes('help')) return 'support';
  if (normalized.includes('referral')) return 'referrals';
  if (normalized.includes('setting')) return 'settings';
  if (normalized.includes('service') || normalized.includes('offer')) return 'services';
  if (normalized.includes('how does') || normalized.includes('how it work') || normalized.includes('how alpha freight work')) return 'how_it_works';
  return null;
}

function mapIntentToTopic(userIntent = 'General Logistics Questions', assistantType = 'general') {
  switch (userIntent) {
    case 'Load Posting':
      return 'post_load';
    case 'Load Search':
      return assistantType === 'supplier' ? 'post_load' : 'available_loads';
    case 'Load Analysis':
      return 'earnings';
    case 'Tracking':
      return 'tracking';
    case 'Route Planning':
      return 'route_planning';
    case 'Fleet Management':
    case 'Driver Support':
      return 'vehicles';
    case 'Earnings':
      return 'earnings';
    case 'Payouts':
      return 'payment';
    case 'Fuel Cost':
      return 'earnings';
    case 'Dispatching':
      return 'route_planning';
    case 'Shipment Management':
      return 'tracking';
    default:
      return null;
  }
}

function inferUserGoal({ userIntent = 'General Logistics Questions', assistantType = 'general', workflowStage = null } = {}) {
  if (assistantType === 'supplier') {
    if (workflowStage === 'bids_received') return 'User wants to review carrier bids and book the best option.';
    if (workflowStage === 'posted') return 'User wants to move a posted load toward booking and execution.';
    if (workflowStage === 'exception') return 'User wants to resolve a shipment exception and protect delivery timing.';
  }

  if (assistantType === 'carrier') {
    if (workflowStage === 'searching') return 'User wants to find the best loads and reduce deadhead.';
    if (workflowStage === 'bid_submitted') return 'User wants to improve the chance of winning a bid without killing profitability.';
    if (workflowStage === 'exception') return 'User wants to resolve an in-transit or pickup/delivery exception.';
  }

  switch (userIntent) {
    case 'Load Posting':
      return 'User wants to create a clean load posting and get it covered fast.';
    case 'Load Search':
      return assistantType === 'supplier'
        ? 'User wants to move freight and needs the right posting details and coverage.'
        : 'User wants to find the strongest loads for their situation.';
    case 'Load Analysis':
      return 'User wants to compare loads and choose the best option for profit and risk.';
    case 'Tracking':
      return 'User wants to understand shipment status and reduce delay risk.';
    case 'Route Planning':
      return 'User wants to plan a route that reduces time, fuel, and empty miles.';
    case 'Fleet Management':
      return 'User wants to manage fleet utilization and maintenance to reduce downtime.';
    case 'Driver Support':
      return 'User wants to solve a driver operations issue and keep dispatch running.';
    case 'Earnings':
      return 'User wants to increase freight revenue and improve profitability.';
    case 'Payouts':
      return 'User wants clarity on payment/payout timing and next steps.';
    case 'Fuel Cost':
      return 'User wants to estimate fuel cost and understand its impact on profit.';
    case 'Dispatching':
      return 'User wants to coordinate assignments and keep execution on schedule.';
    case 'Shipment Management':
      return 'User wants to keep pickup, transit, and delivery execution under control.';
    default:
      return 'User wants the correct next action in freight operations.';
  }
}

function isVagueFollowUp(text) {
  const normalized = (text || '').toLowerCase().trim();
  const vaguePhrases = [
    'explain',
    'explain me',
    'tell me more',
    'detail men batao',
    'detail me batao',
    'detail me',
    'detail men',
    'simple words',
    'simple me batao',
    'more',
    'more detail',
    'details',
    'detail',
    'and',
    'or',
    'aur',
    'phir',
    'acha',
    'okay',
    'ok',
    'hmm',
    'uska',
    'iska',
    'usko',
    'isko',
    'yeh',
    'ye',
    'woh',
    'wo',
    'what about that',
    'what about this',
    'how are you',
    'aur batao',
    'aur btao',
    'thora aur',
    'thoda aur',
    'iske bare me',
    'iske baray me',
    'is bare me',
    'iska kya',
    'is ka kya',
    'uske bare me',
    'uske baray me',
    'us bare me',
    'uska kya',
    'us ka kya',
    'phir kya',
    'kese',
    'kaisay',
    'continue',
    'go on'
  ];

  return vaguePhrases.includes(normalized);
}

function wantsDetailedExplanation(text = '') {
  const normalized = String(text).toLowerCase().trim();
  const detailPhrases = [
    'samjhao',
    'samjha do',
    'samjha deta hun',
    'explain',
    'explain this',
    'explain it',
    'explain me',
    'can you explain',
    'please explain',
    'detail me batao',
    'detail men batao',
    'detail me samjhao',
    'detail men samjhao',
    'steps me batao',
    'step by step',
    'simple words me batao',
    'achay tareeqay se batao',
    'proper samjhao'
  ];

  return detailPhrases.some((phrase) => normalized.includes(phrase));
}

function wantsSimpleExplanation(text = '') {
  const normalized = String(text).toLowerCase().trim();
  const phrases = [
    'simple me',
    'simple men',
    'simple words me',
    'asan alfaaz me',
    'easy words me',
    'short me samjhao',
    'short me batao'
  ];

  return phrases.some((phrase) => normalized.includes(phrase));
}

function wantsExample(text = '') {
  const normalized = String(text).toLowerCase().trim();
  const phrases = ['example', 'misal', 'for example', 'example do', 'misal do'];
  return phrases.some((phrase) => normalized.includes(phrase));
}

function wantsContinuation(text = '') {
  const normalized = String(text).toLowerCase().trim();
  return ['or', 'aur', 'phir', 'acha', 'what next', 'then', 'next', 'continue', 'go on', 'phir kya', 'aur phir'].includes(normalized);
}

function inferTopicFromHistory(history, currentMessage, assistantType) {
  const currentNormalized = (currentMessage || '').toLowerCase().trim();

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index];
    if (!item || item.role !== 'user' || typeof item.content !== 'string') continue;

    const contentNormalized = item.content.toLowerCase().trim();
    if (contentNormalized === currentNormalized) continue;

    const topic = detectTopicFromText(item.content, assistantType);
    if (topic) {
      return topic;
    }
  }

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index];
    if (!item || typeof item.content !== 'string') continue;

    const contentNormalized = item.content.toLowerCase().trim();
    if (contentNormalized === currentNormalized) continue;

    const topic = detectTopicFromText(item.content, assistantType);
    if (topic) {
      return topic;
    }
  }

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index];
    if (!item || item.role !== 'assistant' || typeof item.content !== 'string') continue;

    const topic = detectTopicFromText(item.content, assistantType);
    if (topic) {
      return topic;
    }
  }

  return null;
}

function buildDetailedReply({ topic, assistantType, style = 'english' }) {
  const opener = pickStyleText(
    style,
    `Sure, let me explain this step by step.`,
    `Bilkul, main isko step by step samjhata hoon.`,
    `جی ہاں، میں اسے مرحلہ وار سمجھاتا ہوں۔`
  );

  const detailedReplies = {
    available_loads: assistantType === 'supplier'
      ? pickStyleText(
          style,
          `${opener}\n1. “Available Loads” is mainly for carriers (they browse, bid, and book loads).\n2. On the supplier side, you usually use Post a Load to create a shipment.\n3. Then you manage it in My Posts.\n4. Carrier offers show up in My Bids.\n5. Tracking is used after booking to follow pickup → transit → delivery.\n\nIf you tell me which supplier page you mean (Post a Load / My Posts / My Bids), I will explain it step by step.`,
          `${opener}\n1. “Available Loads” zyada tar carriers ke liye hota ha (browse, bid, book).\n2. Supplier side par aap Post a Load se shipment create karte ho.\n3. Phir My Posts me manage hota ha.\n4. Carriers ke offers My Bids me aate hain.\n5. Booking ke baad tracking se pickup → transit → delivery follow hoti ha.\n\nAap bata dein aap supplier side ka kaunsa page mean kar rahe ho (Post a Load / My Posts / My Bids), main step by step samjha dunga.`
        )
      : pickStyleText(
          style,
          `${opener}\n1. Use filters to narrow the list (pickup area, delivery area, equipment, pickup date).\n2. Open a load to confirm details: appointment windows, commodity/notes, weight, and special requirements.\n3. Check deadhead to pickup and reload/backhaul potential after delivery.\n4. Decide your bid based on effective RPM (include deadhead).\n5. Use actions like View Load, Bid Now, and Save.\n\nIf you want, tell me your equipment + current location and I will suggest what to prioritize on that page.`,
          `${opener}\n1. Filters laga kar list narrow karein (pickup area, delivery area, equipment, pickup date).\n2. Load open karke details confirm karein: appointment windows, commodity/notes, weight, special requirements.\n3. Pickup tak deadhead aur delivery ke baad reload/backhaul potential check karein.\n4. Effective RPM (deadhead include karke) ke hisaab se bid decide karein.\n5. View Load, Bid Now, Save jese actions use karein.\n\nAap apni equipment + current location bata dein, main bata dunga is page par kis cheez ko priority deni chahiye.`
        ),
    my_posts: assistantType === 'supplier'
      ? pickStyleText(
          style,
          `${opener}\n1. My Posts is where you manage all loads you posted.\n2. Open a post to review pickup/delivery details, timing, and notes.\n3. Check bid activity and compare carrier offers (often via My Bids).\n4. Update the load if timing or details change.\n5. Once booked, use tracking to follow pickup → transit → delivery.\n\nIf you tell me what you’re trying to do (edit, cancel, accept a bid, or track), I’ll guide the exact clicks.`,
          `${opener}\n1. My Posts me aapki saari posted loads manage hoti hain.\n2. Post open karke pickup/delivery details, timing aur notes review karo.\n3. Bid activity check karo aur carriers ke offers compare karo (aksar My Bids me).\n4. Agar timing/details change hon to load update karo.\n5. Booking ke baad tracking se pickup → transit → delivery follow hoti ha.\n\nAap bata dein aapko karna kya ha (edit, cancel, bid accept, ya track), main exact steps guide kar dunga.`
        )
      : pickStyleText(
          style,
          `${opener}\n1. My Posts is typically supplier-side. Carriers usually use Available Loads and Bids.\n2. If you meant “My Loads” (carrier), tell me and I’ll explain that page instead.`,
          `${opener}\n1. My Posts usually supplier side par hota ha. Carriers normally Available Loads aur Bids use karte hain.\n2. Agar aap “My Loads” (carrier) mean kar rahe ho to bata dein, main woh page explain kar dunga.`
        ),
    my_loads: assistantType === 'carrier'
      ? pickStyleText(
          style,
          `${opener}\n1. My Loads is where you track loads you’ve accepted/booked.\n2. Each load shows current status (assigned/booked → pickup → in transit → delivered).\n3. Open a load to see addresses, appointment windows, notes, and required documents.\n4. If something changes, update status early to avoid delay risk.\n\nIf you tell me what status you’re stuck on (pickup, in transit, delivered), I’ll tell you what to do next.`,
          `${opener}\n1. My Loads me aapki accepted/booked loads ka status hota ha.\n2. Har load ka stage show hota ha (assigned/booked → pickup → in transit → delivered).\n3. Load open karke addresses, appointment windows, notes aur required documents dekhein.\n4. Agar kuch change ho, status jaldi update karo taa ke delay risk na bane.\n\nAap bata dein aap kis status par stuck ho (pickup, in transit, delivered), main next step bata dunga.`
        )
      : pickStyleText(
          style,
          `${opener}\n1. My Loads is typically carrier-side. Suppliers usually use My Posts and My Bids.\n2. If you meant supplier tracking for a posted load, tell me the shipment status and I’ll guide the steps.`,
          `${opener}\n1. My Loads usually carrier side par hota ha. Suppliers My Posts aur My Bids use karte hain.\n2. Agar aap supplier tracking mean kar rahe ho to shipment status bata dein, main steps guide kar dunga.`
        ),
    post_load: pickStyleText(
      style,
      `${opener}\n1. Enter pickup and delivery locations.\n2. Add shipment timing, cargo type, weight, and volume.\n3. Choose the right equipment and add any special handling needs.\n4. Set a realistic minimum and maximum budget range.\n5. Review the load and publish it.\n6. Carriers can then bid or be matched through the platform.\n7. After that, you track the load through My Posts and manage bids in My Bids.`,
      `${opener}\n1. Sab se pehle pickup aur delivery locations enter karo.\n2. Phir shipment timing, cargo type, weight aur volume add karo.\n3. Uske baad sahi equipment choose karo aur agar koi special handling ho to wo bhi add karo.\n4. Ab realistic minimum aur maximum budget range set karo.\n5. Load ko review karke publish karo.\n6. Publish hone ke baad carriers bid kar sakte hain ya platform unko match kar sakta ha.\n7. Phir aap My Posts me load track karte ho aur My Bids me offers manage karte ho.`
    ),
    pricing: pickStyleText(
      style,
      `${opener}\n1. Distance and lane demand affect price first.\n2. Pickup and delivery urgency can increase the rate.\n3. Weight and volume decide equipment and handling effort.\n4. Special handling (reefer, hazmat/ADR, liftgate, white-glove) increases cost.\n5. A minimum budget should be the lowest realistic number that still attracts qualified carriers.\n6. A maximum budget helps secure better carriers or faster coverage.\n7. A balanced budget range usually improves match quality and response speed.`,
      `${opener}\n1. Route aur distance sab se pehle price ko affect karte hain.\n2. Pickup aur delivery ki urgency rate ko increase kar sakti ha.\n3. Weight aur volume se equipment aur operational effort decide hota ha.\n4. Special handling jese refrigerated, ADR, tail lift ya white glove se price aur barh sakta ha.\n5. Minimum budget lowest realistic amount hota ha.\n6. Maximum budget better carriers ya premium handling secure karne me help karta ha.\n7. Isi liye balanced budget range match quality ko improve karti ha.`
    ),
    verification: pickStyleText(
      style,
      `${opener}\n1. Verify carrier identity and business registration.\n2. Confirm insurance coverage and validity.\n3. Review safety and compliance history.\n4. Validate required documents and equipment details.\n5. Review performance and reliability signals.\n6. Re-verification may be required if insurance or documents change/expire.`,
      `${opener}\n1. Pehle carrier identity aur business registration review hota ha.\n2. Phir insurance verification check hoti ha.\n3. Uske baad safety aur compliance screening hoti ha.\n4. Fleet aur required documents validate kiye jate hain.\n5. Aakhir me performance aur reliability review hota ha.\n6. Agar documents expire hon ya insurance change ho to re-verification ho sakti ha.`
    ),
    tracking: pickStyleText(
      style,
      `${opener}\n1. Tracking becomes meaningful after the load is booked/assigned.\n2. Pickup updates confirm the shipment is in live execution.\n3. In-transit updates show movement progress and ETA changes.\n4. If a delay happens, status updates and exception notes reduce confusion.\n5. Delivery confirmation closes the shipment and may include POD.\n6. The goal is clear visibility for both supplier and carrier.`,
      `${opener}\n1. Tracking tab meaningful hoti ha jab load booked ho jaye.\n2. Pickup update batati ha ke shipment live execution me chali gayi ha.\n3. In-transit stage me movement progress aur expected arrival follow hota ha.\n4. Agar delay aaye to status update dena zaroori hota ha.\n5. Delivery confirm hone ke baad shipment completed ya closed stage me chali jati ha.\n6. Is se supplier aur carrier dono ko clear visibility milti ha.`
    ),
    bids: pickStyleText(
      style,
      `${opener}\n1. Supplier publishes a load.\n2. Carriers submit bids/offers.\n3. Supplier compares offers in My Bids.\n4. The best-fit offer is accepted (based on timing, reliability, and price).\n5. Other bids can be declined.\n6. After acceptance, the load moves into booked status and execution/tracking begins.`,
      `${opener}\n1. Supplier load publish karta ha.\n2. Carriers us load par bids submit karte hain.\n3. Supplier My Bids me offers compare karta ha.\n4. Best-fit bid accept ki jati ha.\n5. Baqi bids reject ho sakti hain.\n6. Accepted bid ke baad load booked status me chala jata ha.`
    ),
    wallet: assistantType === 'carrier'
      ? pickStyleText(
          style,
          `${opener}\n1. Wallet shows your available balance.\n2. Review payout activity and transaction history here.\n3. It helps you understand money movement from completed loads.\n4. Wallet is money/transactions; Earnings is performance and profitability insight.`,
          `${opener}\n1. Wallet me available balance dikh sakta ha.\n2. Yahin payout activity aur transaction history review hoti ha.\n3. Completed loads ki revenue movement yahan samajh aati ha.\n4. Wallet operational money view deta ha, jab ke Earnings analytics aur performance trend dikhata ha.`
        )
      : pickStyleText(
          style,
          `${opener}\n1. On the supplier side, the payment workflow matters most.\n2. You may see options like Pay Instant and Pay Later.\n3. Pay Instant clears payment faster.\n4. Pay Later schedules or queues payment based on your process.`,
          `${opener}\n1. Supplier side par payment workflow zyada important hota ha.\n2. Isme Pay Instant aur Pay Later jese options aate hain.\n3. Pay Instant foran payment clear karta ha.\n4. Pay Later payment ko queue me rakhta ha jab tak aap ready na ho.`
        )
  };

  return detailedReplies[topic] || null;
}

function buildSimpleReply({ topic, assistantType, style = 'english' }) {
  const emoji = getTopicEmoji(topic, assistantType);
  const opener = pickStyleText(
    style,
    `${emoji} Sure, in simple words:`,
    `${emoji} Bilkul, simple words me:`,
    `${emoji} جی ہاں، آسان الفاظ میں:`
  );

  const simpleReplies = {
    available_loads: assistantType === 'supplier'
      ? pickStyleText(
          style,
          `${opener} “Available Loads” is mostly for carriers. Suppliers post loads (Post a Load) and manage them in My Posts / My Bids.`,
          `${opener} “Available Loads” zyada tar carriers ke liye hota ha. Suppliers loads post karte hain (Post a Load) aur My Posts / My Bids me manage karte hain.`
        )
      : pickStyleText(
          style,
          `${opener} It is the load board: filter loads, open details, then bid/book the best option.`,
          `${opener} Ye load board hota ha: filters lagao, details dekho, phir best option par bid/book karo.`
        ),
    my_posts: assistantType === 'supplier'
      ? pickStyleText(
          style,
          `${opener} My Posts is where you manage your posted loads and review activity.`,
          `${opener} My Posts me aap apni posted loads manage aur activity review karte ho.`
        )
      : pickStyleText(
          style,
          `${opener} My Posts is usually supplier-side. Carriers use Available Loads / My Loads.`,
          `${opener} My Posts usually supplier side hota ha. Carriers Available Loads / My Loads use karte hain.`
        ),
    my_loads: assistantType === 'carrier'
      ? pickStyleText(
          style,
          `${opener} My Loads is where you track loads you accepted or booked.`,
          `${opener} My Loads me aap accepted/booked loads ka status track karte ho.`
        )
      : pickStyleText(
          style,
          `${opener} My Loads is usually carrier-side. Suppliers use My Posts / My Bids.`,
          `${opener} My Loads usually carrier side hota ha. Suppliers My Posts / My Bids use karte hain.`
        ),
    post_load: pickStyleText(
      style,
      `${opener} You fill in shipment details, set your budget, publish the load, and then carriers can bid or get matched.`,
      `${opener} Aap shipment details fill karte ho, budget set karte ho, load publish karte ho, aur phir carriers bid karte hain ya match ho jate hain.`
    ),
    pricing: pickStyleText(
      style,
      `${opener} Price route, timing, cargo size, and special handling par depend karta ha.`,
      `${opener} Price route, timing, cargo size aur special handling par depend karta ha.`
    ),
    verification: pickStyleText(
      style,
      `${opener} Verification ka matlab ha carrier ki identity, insurance, safety, aur documents check karna.`,
      `${opener} Verification ka matlab ha carrier ki identity, insurance, safety aur documents check karna.`
    ),
    tracking: pickStyleText(
      style,
      `${opener} Tracking se aap dekh sakte ho ke load pickup se delivery tak kis stage me ha.`,
      `${opener} Tracking se aap dekh sakte ho ke load pickup se delivery tak kis stage me ha.`
    ),
    wallet: assistantType === 'carrier'
      ? pickStyleText(
          style,
          `${opener} Wallet me aap balance, payouts, aur transactions dekhte ho.`,
          `${opener} Wallet me aap balance, payouts aur transactions dekhte ho.`
        )
      : pickStyleText(
          style,
          `${opener} Supplier side par payment management Pay Instant aur Pay Later ke zariye hoti ha.`,
          `${opener} Supplier side par payment management Pay Instant aur Pay Later ke zariye hoti ha.`
        )
  };

  return simpleReplies[topic] || null;
}

function buildExampleReply({ topic, assistantType, style = 'english' }) {
  const emoji = getTopicEmoji(topic, assistantType);
  const opener = pickStyleText(
    style,
    `${emoji} Here's a simple example:`,
    `${emoji} Yahan ek simple example ha:`,
    `${emoji} یہاں ایک سادہ مثال ہے:`
  );

  const exampleReplies = {
    post_load: pickStyleText(
      style,
      `${opener} If you need to move 8 pallets from Birmingham to Manchester tomorrow, you add pickup, delivery, timing, weight, and budget, then publish the load so carriers can respond.`,
      `${opener} Agar aapko kal Birmingham se Manchester 8 pallets bhejni hain, to aap pickup, delivery, timing, weight aur budget add karke load publish karte ho, phir carriers respond karte hain.`
    ),
    pricing: pickStyleText(
      style,
      `${opener} A standard local load may cost less, but if the same load becomes urgent and needs refrigerated transport, the price usually goes higher.`,
      `${opener} Ek standard local load kam cost kar sakta ha, lekin agar wahi load urgent ho aur refrigerated transport chahiye ho to price aam tor par barh jati ha.`
    ),
    verification: pickStyleText(
      style,
      `${opener} If a carrier uploads valid insurance, business documents, and passes safety review, they can move forward as a more trusted option on the platform.`,
      `${opener} Agar koi carrier valid insurance, business documents upload kare aur safety review pass kar le, to wo platform par zyada trusted option ban sakta ha.`
    ),
    tracking: pickStyleText(
      style,
      `${opener} A load can show booked first, then picked up, then in transit, and finally delivered once the shipment is completed.`,
      `${opener} Ek load pehle booked dikh sakta ha, phir picked up, phir in transit, aur akhir me delivered jab shipment complete ho jaye.`
    )
  };

  return exampleReplies[topic] || null;
}

function buildContinuationReply({ topic, assistantType, style = 'english' }) {
  const emoji = getTopicEmoji(topic, assistantType);
  const opener = pickStyleText(
    style,
    `${emoji} The next important part is this:`,
    `${emoji} Agla important hissa ye ha:`,
    `${emoji} اگلا اہم حصہ یہ ہے:`
  );

  const continuationReplies = {
    post_load: pickStyleText(
      style,
      `${opener} after publishing the load, you should watch carrier responses, compare bids, and move the best option into booked status.`,
      `${opener} load publish karne ke baad aapko carrier responses dekhne chahiye, bids compare karni chahiye, aur best option ko booked status me move karna chahiye.`
    ),
    pricing: pickStyleText(
      style,
      `${opener} a tight budget can slow matching, while a balanced budget range usually improves carrier quality and response speed.`,
      `${opener} bohat tight budget matching ko slow kar sakta ha, jab ke balanced budget range aam tor par better carrier quality aur response speed deti ha.`
    ),
    verification: pickStyleText(
      style,
      `${opener} verification is not just for documents, it also builds trust and reduces shipment risk.`,
      `${opener} verification sirf documents ke liye nahi hoti, ye trust build karti ha aur shipment risk kam karti ha.`
    ),
    tracking: pickStyleText(
      style,
      `${opener} if any delay happens, updated status and support coordination become very important for transparency.`,
      `${opener} agar koi delay ho jaye to updated status aur support coordination transparency ke liye bohat important ho jati ha.`
    ),
    wallet: assistantType === 'carrier'
      ? pickStyleText(
          style,
          `${opener} Wallet and Earnings are linked, but Wallet focuses on money movement while Earnings focuses on performance insight.`,
          `${opener} Wallet aur Earnings linked hote hain, lekin Wallet money movement dikhata ha jab ke Earnings performance insight dikhata ha.`
        )
      : null
  };

  return continuationReplies[topic] || null;
}

function joinReplyParts(parts = []) {
  return parts.filter(Boolean).join('\n\n').trim();
}

function detectLogisticsConcept(lowerMessage = '') {
  const normalized = String(lowerMessage || '').toLowerCase();

  if (/\brpm\b|rate per mile/i.test(normalized)) return 'rpm';
  if (/\bdeadhead\b|empty miles?/i.test(normalized)) return 'deadhead';
  if (/\bbackhaul\b|return load/i.test(normalized)) return 'backhaul';
  if (/\bpod\b|proof of delivery/i.test(normalized)) return 'pod';
  if (/\beta\b|estimated time of arrival/i.test(normalized)) return 'eta';
  if (/\bdetention\b|layover/i.test(normalized)) return 'detention';
  if (/\blumper\b/i.test(normalized)) return 'lumper';
  if (/\baccessorials?\b/i.test(normalized)) return 'accessorials';

  return null;
}

function buildConceptExplanation({ concept, style = 'english', responseLength = 'medium' }) {
  if (!concept) return null;

  const detailed = responseLength === 'detailed';

  if (concept === 'rpm') {
    return pickStyleText(
      style,
      joinReplyParts([
        `RPM means Rate Per Mile. It is one of the fastest ways to compare two loads fairly.`,
        `Basic formula:\n• RPM = Total Rate ÷ Loaded Miles`,
        detailed
          ? joinReplyParts([
              `For a cleaner reality check, include deadhead too:\n• Effective RPM = Total Rate ÷ (Loaded Miles + Deadhead Miles)`,
              `Example:\n• Rate: $1,450\n• Loaded: 450 miles\n• Deadhead: 20 miles\n• RPM: 1450 ÷ 450 = 3.22\n• Effective RPM: 1450 ÷ 470 = 3.09`,
              `Why it matters: RPM helps you see if the lane is strong, but you still confirm fuel cost, appointment risk, and reload/backhaul potential.`,
              `If you share your mpg and fuel price, I can estimate fuel cost and net profit too.`
            ])
          : `If you share rate + loaded miles, I can calculate RPM and tell you if it looks strong for your lane.`
      ]),
      joinReplyParts([
        `RPM ka matlab Rate Per Mile hota ha. Ye 2 loads ko quickly compare karne ka best tareeqa hota ha.`,
        `Basic formula:\n• RPM = Total Rate ÷ Loaded Miles`,
        detailed
          ? joinReplyParts([
              `Real picture ke liye deadhead bhi include karo:\n• Effective RPM = Total Rate ÷ (Loaded Miles + Deadhead Miles)`,
              `Example:\n• Rate: 1450\n• Loaded: 450 miles\n• Deadhead: 20 miles\n• RPM: 1450 ÷ 450 = 3.22\n• Effective RPM: 1450 ÷ 470 = 3.09`,
              `RPM help karta ha, lekin final decision me fuel cost, timing risk aur reload/backhaul potential bhi dekhna hota ha.`,
              `Agar aap mpg aur fuel price bhej dein to main fuel cost aur net profit bhi estimate kar dunga.`
            ])
          : `Aap rate aur loaded miles bhej dein, main RPM nikal kar bata dunga ke lane strong lag raha ha ya nahi.`
      ])
    );
  }

  if (concept === 'deadhead') {
    return pickStyleText(
      style,
      joinReplyParts([
        `Deadhead means the empty miles you drive without a paying load (usually to reach pickup, or after delivery).`,
        detailed
          ? joinReplyParts([
              `Why it matters: deadhead lowers your effective RPM and quietly reduces profit.`,
              `Quick checks:\n• Keep pickup deadhead controlled\n• Watch delivery-area reload chances\n• Use Effective RPM: Rate ÷ (Loaded + Deadhead)`,
              `If you share your current location + pickup city, I can estimate whether deadhead is reasonable.`
            ])
          : `Share loaded miles + deadhead miles and I will calculate your effective RPM.`
      ]),
      joinReplyParts([
        `Deadhead ka matlab empty miles hota ha (bina paid load ke). Ye aksar pickup tak jane ya delivery ke baad hota ha.`,
        detailed
          ? joinReplyParts([
              `Deadhead important is liye ha kyun ke effective RPM aur profit dono drop ho jate hain.`,
              `Quick checks:\n• Pickup deadhead control me rakho\n• Delivery area me reload chance dekho\n• Effective RPM use karo: Rate ÷ (Loaded + Deadhead)`,
              `Aap current location aur pickup city bhej dein, main bata dunga deadhead reasonable ha ya nahi.`
            ])
          : `Loaded miles aur deadhead miles bhej dein, main effective RPM calculate kar dunga.`
      ])
    );
  }

  if (concept === 'pod') {
    return pickStyleText(
      style,
      joinReplyParts([
        `POD means Proof of Delivery. It is the document (or digital confirmation) that the shipment was delivered.`,
        detailed
          ? joinReplyParts([
              `Why it matters: POD is often required to close out the load, start invoicing, and release payout.`,
              `Typical POD includes:\n• Receiver name/signature\n• Date/time delivered\n• Delivery location\n• Notes for damages/shortage if any`,
              `If you tell me what status you see (Delivered / Awaiting POD / Invoiced), I can guide the next step.`
            ])
          : `If you tell me the shipment status, I can tell you what to do next.`
      ]),
      joinReplyParts([
        `POD ka matlab Proof of Delivery hota ha. Ye confirmation hoti ha ke shipment deliver ho chuka ha.`,
        detailed
          ? joinReplyParts([
              `POD important is liye ha kyun ke iske baghair load close, invoice aur payout delay ho sakta ha.`,
              `Typical POD me hota ha:\n• Receiver signature/name\n• Date/time\n• Delivery location\n• Agar damage/shortage ho to notes`,
              `Aap status bata dein (Delivered / Awaiting POD / Invoiced), main next step guide kar dunga.`
            ])
          : `Aap shipment status bata dein, main next step bata dunga.`
      ])
    );
  }

  return null;
}

function getMissingLoadPostingFields(lowerMessage = '') {
  const checks = [
    ['Pickup Location', /\bpickup\b|\bfrom\b/i],
    ['Delivery Location', /\bdelivery\b|\bto\b/i],
    ['Load Type', /\bload type\b|\bcargo\b|\bcommodity\b/i],
    ['Weight', /\bweight\b|\bkg\b|\blb\b|\btons?\b/i],
    ['Equipment Type', /\bequipment\b|\breefer\b|\bdry van\b|\bflatbed\b|\bvan\b/i],
    ['Pickup Date', /\bpickup date\b|\bready on\b|\btoday\b|\btomorrow\b/i],
    ['Delivery Date', /\bdelivery date\b|\bdeliver by\b|\bdrop date\b/i],
    ['Offered Rate', /\brate\b|\bbudget\b|\$\s*\d+/i]
  ];

  return checks.filter(([, pattern]) => !pattern.test(lowerMessage)).map(([label]) => label);
}

function buildWorkflowStageReply({ assistantType = 'general', workflowStage = null, style = 'english' }) {
  if (!workflowStage) return null;

  const supplierReplies = {
    posted: pickStyleText(
      style,
      joinReplyParts([
        `Got it. If you already posted the load, here’s the clean next flow:`,
        `1) Open My Posts and select the posted load.`,
        `2) Double-check pickup/delivery windows + equipment + notes (clarity increases good bids).`,
        `3) Go to My Bids to see carrier offers on that load.`,
        `4) If bids are not coming, adjust budget or timing slightly and re-publish/update.`,
        `One thing I need: which load is it (pickup → delivery) so I guide the exact clicks?`
      ]),
      joinReplyParts([
        `Theek ha. Agar aap ne load post kar diya ha to next flow ye hai:`,
        `1) My Posts open karo aur apni posted load select karo.`,
        `2) Pickup/delivery windows + equipment + notes double-check karo (clear post par better bids aati hain).`,
        `3) My Bids me jao aur us load ki carrier offers dekho.`,
        `4) Agar bids nahi aa rahi, budget ya timing thori adjust karke update/re-publish karo.`,
        `Bas ek cheez: ye kaunsi load hai (pickup → delivery)?`
      ])
    ),
    bids_received: pickStyleText(
      style,
      joinReplyParts([
        `Perfect — bids aa gayi hain. Ab step-by-step:`,
        `1) My Bids open karo aur same load select karo.`,
        `2) Compare: rate, carrier verification, pickup timing fit, and equipment match.`,
        `3) Best-fit offer Accept karo (sirf price nahi, reliability + timing bhi).`,
        `4) Accept ke baad load booked ho jayega — phir tracking se pickup → transit → delivery follow karo.`,
        `Aapko accept karna hai ya sirf compare?`
      ]),
      joinReplyParts([
        `Perfect — bids aa gayi hain. Ab step-by-step:`,
        `1) My Bids open karo aur same load select karo.`,
        `2) Compare: rate, carrier verification, pickup timing fit, aur equipment match.`,
        `3) Best-fit offer Accept karo (sirf price nahi, reliability + timing bhi).`,
        `4) Accept ke baad load booked ho jayega — phir tracking se pickup → transit → delivery follow karo.`,
        `Aap accept karna chahte ho ya sirf compare?`
      ])
    ),
    booked: pickStyleText(
      style,
      joinReplyParts([
        `If the load is booked, now you’re in execution mode:`,
        `1) Confirm appointment windows and contact notes with the carrier.`,
        `2) Keep tracking ready for pickup confirmation.`,
        `3) If timing changes, update early to avoid delays.`,
        `What status do you see right now: Booked/Assigned, Pickup, or In Transit?`
      ]),
      joinReplyParts([
        `Agar load booked ho chuka ha, ab execution mode hai:`,
        `1) Carrier ke sath appointment windows aur contact notes confirm karo.`,
        `2) Pickup confirmation ke liye tracking ready rakho.`,
        `3) Agar timing change ho, jaldi update karo taa ke delay na bane.`,
        `Abhi status kya show ho raha hai: Booked/Assigned, Pickup, ya In Transit?`
      ])
    ),
    pickup: pickStyleText(
      style,
      joinReplyParts([
        `If pickup is done / happening:`,
        `1) Confirm pickup status is updated in tracking.`,
        `2) Share any special instructions early (receiver notes, delivery window).`,
        `3) Watch ETA updates and flag delays quickly.`,
        `Do you have an ETA or delivery appointment window?`
      ]),
      joinReplyParts([
        `Agar pickup ho gaya / ho raha hai:`,
        `1) Tracking me pickup status update confirm karo.`,
        `2) Receiver notes / delivery window jesi instructions pehle share karo.`,
        `3) ETA updates dekho aur delay ho to jaldi flag karo.`,
        `Aapke paas ETA ya delivery appointment window hai?`
      ])
    ),
    in_transit: pickStyleText(
      style,
      joinReplyParts([
        `If the load is in transit:`,
        `1) Track ETA changes and exception alerts.`,
        `2) If any delay risk appears, document the reason and communicate early.`,
        `3) Prepare for delivery confirmation and POD.`,
        `Is it running on-time or already delayed?`
      ]),
      joinReplyParts([
        `Agar load in transit hai:`,
        `1) ETA changes aur exception alerts track karo.`,
        `2) Delay risk aaye to reason note karo aur pehle communicate karo.`,
        `3) Delivery confirmation aur POD ke liye prepare raho.`,
        `On-time chal raha hai ya delay ho raha hai?`
      ])
    ),
    exception: pickStyleText(
      style,
      joinReplyParts([
        `If something is off (delay / stuck / issue), handle it like ops:`,
        `1) Identify the stage (at pickup, in transit, or at delivery).`,
        `2) Capture the reason (appointment, detention, breakdown, access issue).`,
        `3) Update tracking and notify support/receiver early.`,
        `Which stage is it stuck on: pickup, in transit, or delivery?`
      ]),
      joinReplyParts([
        `Agar delay / stuck / issue hai to ops flow ye hota hai:`,
        `1) Stage identify karo (pickup, in transit, ya delivery).`,
        `2) Reason note karo (appointment, detention, breakdown, access issue).`,
        `3) Tracking update karo aur support/receiver ko jaldi inform karo.`,
        `Kis stage par stuck hai: pickup, in transit, ya delivery?`
      ])
    ),
    delivered: pickStyleText(
      style,
      joinReplyParts([
        `If delivered:`,
        `1) Confirm delivery status is updated.`,
        `2) Make sure POD is uploaded/available if required.`,
        `3) Move to invoicing/payment workflow if applicable.`,
        `Do you see “Awaiting POD” or “Completed”?`
      ]),
      joinReplyParts([
        `Agar delivered:`,
        `1) Delivery status update confirm karo.`,
        `2) POD upload/available ho (agar required ho).`,
        `3) Phir invoicing/payment workflow complete karo.`,
        `Aapko “Awaiting POD” dikh raha hai ya “Completed”?`
      ])
    ),
    closed: pickStyleText(
      style,
      joinReplyParts([
        `If the shipment is closed:`,
        `1) Keep records (POD/invoice) saved.`,
        `2) Review carrier performance for future matching.`,
        `If you want, tell me the lane and I’ll suggest how to price the next one better.`
      ]),
      joinReplyParts([
        `Agar shipment close ho gaya:`,
        `1) Records (POD/invoice) save rakho.`,
        `2) Carrier performance note karo future matching ke liye.`,
        `Agar aap chaho to lane bata dein, main next load ki pricing strategy suggest kar dunga.`
      ])
    )
  };

  const carrierReplies = {
    searching: pickStyleText(
      style,
      joinReplyParts([
        `If you’re searching for loads, do it like a dispatcher:`,
        `1) Filter by pickup area, delivery area, equipment, pickup date.`,
        `2) Check deadhead to pickup and reload chance after delivery.`,
        `3) Shortlist 2–3 loads, then bid with effective RPM in mind.`,
        `What is your current location + equipment?`
      ]),
      joinReplyParts([
        `Agar aap loads search kar rahe ho to dispatcher-style karo:`,
        `1) Pickup area, delivery area, equipment, pickup date filters lagao.`,
        `2) Pickup tak deadhead aur delivery ke baad reload chance check karo.`,
        `3) 2–3 loads shortlist karo, phir effective RPM dekh kar bid karo.`,
        `Aapki current location + equipment kya hai?`
      ])
    ),
    bid_submitted: pickStyleText(
      style,
      joinReplyParts([
        `If you already submitted a bid:`,
        `1) Track bid status (pending/accepted/rejected).`,
        `2) Avoid over-committing — keep your pickup window realistic.`,
        `3) If it’s sitting too long, adjust your offer or pick a backup load.`,
        `Is your bid still pending or did it get accepted?`
      ]),
      joinReplyParts([
        `Agar aap ne bid submit kar di hai:`,
        `1) Bid status track karo (pending/accepted/rejected).`,
        `2) Over-commit na karo — pickup window realistic rakho.`,
        `3) Agar bohat der pending rahe, offer adjust karo ya backup load pick karo.`,
        `Aapki bid abhi pending hai ya accept ho gayi?`
      ])
    ),
    booked: pickStyleText(
      style,
      joinReplyParts([
        `If the load is booked:`,
        `1) Confirm appointment windows and required documents.`,
        `2) Plan route to arrive early (reduce delay risk).`,
        `3) Keep tracking updates clean from pickup to delivery.`,
        `Do you have pickup appointment time?`
      ]),
      joinReplyParts([
        `Agar load booked ho gaya:`,
        `1) Appointment windows aur required documents confirm karo.`,
        `2) Route aise plan karo ke early arrive ho (delay risk kam).`,
        `3) Pickup se delivery tak tracking updates clean rakho.`,
        `Pickup appointment time kya hai?`
      ])
    ),
    pickup: supplierReplies.pickup,
    in_transit: supplierReplies.in_transit,
    exception: supplierReplies.exception,
    delivered: supplierReplies.delivered,
    closed: pickStyleText(
      style,
      joinReplyParts([
        `If it’s closed/paid:`,
        `1) Make sure POD + paperwork is complete.`,
        `2) Review net profit (fuel + deadhead) so the next bid is smarter.`,
        `Want to calculate effective RPM on your last trip?`
      ]),
      joinReplyParts([
        `Agar close/paid ho gaya:`,
        `1) POD + paperwork complete hon confirm karo.`,
        `2) Net profit review karo (fuel + deadhead) taa ke next bid smarter ho.`,
        `Kya aap last trip ka effective RPM calculate karna chahte ho?`
      ])
    )
  };

  if (assistantType === 'supplier') {
    return supplierReplies[workflowStage] || null;
  }

  if (assistantType === 'carrier') {
    return carrierReplies[workflowStage] || null;
  }

  return null;
}

function buildIntentAwarePlainReply({
  userIntent,
  assistantType,
  topic = null,
  lowerMessage,
  style = 'english',
  responseLength = 'medium',
  memory
}) {
  const missingLoadFields = getMissingLoadPostingFields(lowerMessage);
  const location = memory.userLocation || 'your current area';
  const truckType = memory.truckType || memory.equipmentType || 'your truck type';
  const preferredLane = memory.preferredRoutes?.[0] || 'your preferred lane';
  const concept = detectLogisticsConcept(lowerMessage);
  const asksPageExplain =
    /\b(page|screen|tab|section)\b/i.test(lowerMessage) ||
    /\bexplain\b/i.test(lowerMessage);
  const refersAvailableLoads =
    topic === 'available_loads' ||
    /\bavailable load(s)?\b/i.test(lowerMessage) ||
    /\bload board\b/i.test(lowerMessage);
  const primaryPostFieldsMissing = missingLoadFields.filter((field) => ['Pickup Location', 'Delivery Location'].includes(field));
  const nextPostFieldsMissing = missingLoadFields.filter((field) => !['Pickup Location', 'Delivery Location'].includes(field)).slice(0, 4);
  const workflowStage = inferWorkflowStageFromText(lowerMessage, assistantType) || memory.workflowStage;
  const wantsSteps = /\b(step|steps|next step|what next|what should i do|guide|process)\b/i.test(lowerMessage) || /\b(kya karon|ab kya|next kya)\b/i.test(lowerMessage);

  if (wantsSteps && workflowStage) {
    const stageReply = buildWorkflowStageReply({ assistantType, workflowStage, style });
    if (stageReply) {
      return stageReply;
    }
  }

  switch (userIntent) {
    case 'Load Posting':
      return pickStyleText(
        style,
        joinReplyParts([
          `I can help you post that load step by step.`,
          primaryPostFieldsMissing.length
            ? `Start with these first:\n• ${primaryPostFieldsMissing.join('\n• ')}`
            : nextPostFieldsMissing.length
              ? `Next, send:\n• ${nextPostFieldsMissing.join('\n• ')}`
              : `You already mentioned most of the key details. I can help you turn them into a clean load posting.`,
          `Send them in one message and I will format the posting cleanly.`
        ]),
        joinReplyParts([
          `Main aapko ye load step by step post karne men help kar sakta hoon.`,
          primaryPostFieldsMissing.length
            ? `Pehle ye bhej dein:\n• ${primaryPostFieldsMissing.join('\n• ')}`
            : nextPostFieldsMissing.length
              ? `Phir ye bhej dein:\n• ${nextPostFieldsMissing.join('\n• ')}`
              : `Aap ne kaafi key details mention kar di hain. Main inko clean load posting men convert karne men help kar sakta hoon.`,
          `Aap ek message me bhej dein, main clean posting format bana dunga.`
        ])
      );

    case 'Load Search':
      if (asksPageExplain && refersAvailableLoads) {
        if (assistantType === 'supplier') {
          return pickStyleText(
            style,
            joinReplyParts([
              `The “Available Loads” page is mainly a carrier-side load board (carriers browse and book/bid on loads).`,
              `On the supplier side, you typically use:\n• Post a Load (create the shipment)\n• My Posts (manage your posted loads)\n• My Bids (review carrier offers / accept a bid)`,
              `If you want, tell me what you see on your screen (Post a Load / My Posts / My Bids), and I’ll explain that page step by step.`
            ]),
            joinReplyParts([
              `“Available Loads” page zyada tar carrier side ka load board hota ha (carriers loads browse karke bid/book karte hain).`,
              `Supplier side par aap usually ye use karte ho:\n• Post a Load (shipment create)\n• My Posts (apni posted loads manage)\n• My Bids (carriers ke offers compare/accept)`,
              `Aap bata dein aapke screen par kya show ho raha ha (Post a Load / My Posts / My Bids), main us page ko step by step samjha dunga.`
            ])
          );
        }

        return pickStyleText(
          style,
          joinReplyParts([
            `The “Available Loads” page is your load board. Here’s how to use it step by step:`,
            `1) Filter first: pickup area, delivery area, equipment type, pickup date, and your acceptable deadhead.`,
            `2) Read each load card: pickup → delivery, equipment, pickup/delivery windows, weight/notes, and rate/RPM (if shown).`,
            `3) Before bidding, sanity-check: deadhead to pickup, appointment times, commodity risk, detention/layover risk, and reload chance after delivery.`,
            `4) Use actions: View Load (full details), Bid Now (submit your rate), Save (keep it for later).`,
            `If you tell me your current location + equipment, I can also help you pick the top 3 loads from that page.`
          ]),
          joinReplyParts([
            `“Available Loads” page aapka load board hota ha. Step by step use aise karein:`,
            `1) Pehle filters: pickup area, delivery area, equipment type, pickup date, aur acceptable deadhead set karein.`,
            `2) Har load card me dekhein: pickup → delivery, equipment, pickup/delivery window, weight/notes, aur rate/RPM (agar show ho).`,
            `3) Bid se pehle check: pickup tak deadhead, appointment timings, commodity risk, detention/layover risk, aur delivery ke baad reload chance.`,
            `4) Actions: View Load (details), Bid Now (rate submit), Save (later ke liye).`,
            `Aap apni current location + equipment bata dein to main us page se top 3 best loads bhi short-list kar dunga.`
          ])
        );
      }

      if (assistantType === 'supplier') {
        return pickStyleText(
          style,
          joinReplyParts([
            `On the supplier side, you typically don’t “find loads” — you post loads and then carriers bid or get matched.`,
            `If your goal is to move freight, tell me:\n• Pickup location\n• Delivery location\n• Equipment type\n• Pickup date/time\n• Budget (if you have one)`,
            `I’ll help you create a clean posting and position it so you attract the right carriers.`
          ]),
          joinReplyParts([
            `Supplier side par aap normally “loads find” nahi karte — aap load post karte ho aur phir carriers bid/match karte hain.`,
            `Agar aapka goal shipment move karna ha to ye bhej dein:\n• Pickup location\n• Delivery location\n• Equipment type\n• Pickup date/time\n• Budget (agar ho)`,
            `Main aapke liye clean posting bana dunga aur isay aise position karwa dunga ke right carriers attract hon.`
          ])
        );
      }

      return pickStyleText(
        style,
        joinReplyParts([
          responseLength === 'short'
            ? `I can help find loads near ${location}, but the best matches depend on your truck type, preferred lane, and how much deadhead you can take.`
            : `I can help narrow down the right loads, not just list random options. The best search depends on location, truck type, lane preference, timing, and acceptable deadhead.`,
          `Right now I know ${truckType !== 'your truck type' ? `your equipment is ${truckType}` : `I still need your truck type`} and ${preferredLane !== 'your preferred lane' ? `your route context includes ${preferredLane}` : `I do not have your preferred lane yet`}.`,
          `Send your current location, truck type, and preferred route, and I will point out the strongest options first.`,
          `If you want, I can prioritize highest RPM, closest pickup, or best backhaul potential once I have those details.`
        ]),
        joinReplyParts([
          responseLength === 'short'
            ? `Main ${location} ke near loads dhoondhne men help kar sakta hoon, lekin best results truck type, preferred lane aur acceptable deadhead par depend karte hain.`
            : `Main sirf random loads list nahi karunga, balki stronger options narrow down karunga. Best search location, truck type, lane preference, timing aur acceptable deadhead par depend karti ha.`,
          `Abhi mujhe ${truckType !== 'your truck type' ? `aapki equipment ${truckType} lag rahi ha` : `abhi aapka truck type chahiye`} aur ${preferredLane !== 'your preferred lane' ? `route context men ${preferredLane} mil raha ha` : `abhi preferred lane clear nahi ha`}.`,
          `Aap current location, truck type aur preferred route bhej dein, main strongest options pehle point out kar dunga.`,
          `Agar aap chaho to main uske baad highest RPM, closest pickup ya best backhaul potential ke hisaab se bhi priority bana dunga.`
        ])
      );

    case 'Tracking':
      return pickStyleText(
        style,
        joinReplyParts([
          responseLength === 'short'
            ? `Tracking shows where a shipment is between pickup and final delivery.`
            : `Tracking helps you see where the shipment is, what stage it is in, and whether timing risk is building.`,
          responseLength === 'detailed'
            ? `Step-by-step tracking flow:\n• Booked / Assigned\n• Pickup confirmed\n• In transit updates\n• Delay / exception alerts (if something changes)\n• Updated ETA\n• Delivered + POD (proof of delivery)`
            : `The main checkpoints are pickup, transit, ETA updates, delays if they happen, and delivery confirmation.`,
          `If you have a shipment ID, route, or current status, send it and I can tell you what to check first.`
        ]),
        joinReplyParts([
          responseLength === 'short'
            ? `Tracking batati ha ke shipment pickup se final delivery ke darmiyan kis stage men ha.`
            : `Tracking se pata chalta ha ke shipment kahan ha, kis stage men ha, aur timing risk build ho raha ha ya nahi.`,
          responseLength === 'detailed'
            ? `Step-by-step tracking flow:\n• Booked / Assigned\n• Pickup confirmed\n• In transit updates\n• Delay / exception alert (agar kuch change ho)\n• Updated ETA\n• Delivered + POD (proof of delivery)`
            : `Iske main checkpoints pickup, transit, ETA updates, agar delay ho to alert, aur delivery confirmation hote hain.`,
          `Agar aap shipment ID, route ya current status bhej dein to main bata dunga ke sab se pehle kya check karna chahiye.`
        ])
      );

    case 'Earnings':
      return pickStyleText(
        style,
        joinReplyParts([
          `To improve earnings, focus on net trip quality instead of headline rate alone.`,
          responseLength === 'short'
            ? `The biggest levers are RPM, fuel cost, deadhead, and reload opportunity.`
            : `The biggest levers are RPM, fuel cost, deadhead miles, reload potential, and whether the route keeps the truck working after delivery.`,
          `If you share rate, loaded miles, deadhead, and fuel estimate, I can show where profit is leaking and what to improve first.`,
          `I can also help you decide whether the lane is worth repeating or only good as a one-off move.`
        ]),
        joinReplyParts([
          `Earnings improve karne ke liye sirf headline rate nahi, balki net trip quality par focus karo.`,
          responseLength === 'short'
            ? `Sab se important levers RPM, fuel cost, deadhead aur reload opportunity hain.`
            : `Sab se important levers RPM, fuel cost, deadhead miles, reload potential aur ye hain ke delivery ke baad truck kaam men rehta ha ya nahi.`,
          `Agar aap rate, loaded miles, deadhead aur fuel estimate bhej dein to main bata dunga ke profit kahan leak ho raha ha aur pehle kya improve karna chahiye.`,
          `Main ye bhi bata sakta hoon ke ye lane repeat karne layak ha ya sirf one-off move ke liye theek ha.`
        ])
      );

    case 'Fuel Cost':
      return pickStyleText(
        style,
        joinReplyParts([
          `Fuel cost matters because it can quietly eat into a good-looking rate.`,
          `A proper estimate depends on total miles, deadhead, truck fuel economy, and current fuel price.`,
          `Send loaded miles, deadhead miles, and your average mpg, and I will calculate a cleaner fuel estimate.`
        ]),
        joinReplyParts([
          `Fuel cost important ha kyun ke ye achi lagne wali rate ko bhi quietly kam kar sakti ha.`,
          `Proper estimate total miles, deadhead, truck fuel economy aur current fuel price par depend karti ha.`,
          `Loaded miles, deadhead miles aur average mpg bhej dein, main cleaner fuel estimate nikal dunga.`
        ])
      );

    case 'Route Planning':
      return pickStyleText(
        style,
        joinReplyParts([
          `A strong route is not always the shortest one.`,
          responseLength === 'short'
            ? `The best route balances fuel, deadhead, timing, and reload chance.`
            : `The best route balances fuel usage, traffic risk, tolls, delivery timing, and the chance of finding a backhaul after delivery.`,
          `If you share your current location and target lane, I can suggest the cleaner route strategy.`,
          `I can optimize either for lower cost, faster delivery time, or a stronger reload position after delivery.`
        ]),
        joinReplyParts([
          `Strong route hamesha shortest route nahi hoti.`,
          responseLength === 'short'
            ? `Best route fuel, deadhead, timing aur reload chance ko balance karti ha.`
            : `Best route fuel usage, traffic risk, tolls, delivery timing aur delivery ke baad backhaul milne ke chance ko balance karti ha.`,
          `Agar aap current location aur target lane bhej dein to main cleaner route strategy suggest kar dunga.`,
          `Main isay lower cost, faster delivery time ya stronger reload position men se jis cheez ko aap priority dein uske hisaab se optimize kar sakta hoon.`
        ])
      );

    case 'Fleet Management':
      return pickStyleText(
        style,
        joinReplyParts([
          `Fleet management is mainly about keeping trucks productive, drivers assigned well, and maintenance from becoming a surprise.`,
          `The key checks are truck utilization, idle time, driver assignment quality, and upcoming service needs.`,
          `Send the number of trucks, the issue you are seeing, and whether the pressure is utilization, maintenance, or driver coverage, and I will break it down operationally.`
        ]),
        joinReplyParts([
          `Fleet management ka main goal ye hota ha ke trucks productive rahen, drivers sahi assign hon, aur maintenance surprise na bane.`,
          `Iske key checks truck utilization, idle time, driver assignment quality aur upcoming service needs hote hain.`,
          `Aap trucks ki tadaad, exact issue aur ye bhej dein ke pressure utilization, maintenance ya driver coverage par ha, main usay operational tareeqe se break kar dunga.`
        ])
      );

    case 'Driver Support':
      return pickStyleText(
        style,
        joinReplyParts([
          `Driver support works best when dispatch, timing, route clarity, and issue escalation are all aligned.`,
          `Most problems start from unclear pickup instructions, weak ETA communication, or late exception updates.`,
          `If you tell me the driver's issue, I can suggest the next best operational step.`
        ]),
        joinReplyParts([
          `Driver support tab best hoti ha jab dispatch, timing, route clarity aur issue escalation aligned hon.`,
          `Zyada problems unclear pickup instructions, weak ETA communication ya late exception updates se start hoti hain.`,
          `Agar aap driver ka exact issue bata dein to main next best operational step suggest kar dunga.`
        ])
      );

    case 'Payouts':
      return pickStyleText(
        style,
        joinReplyParts([
          `Payout questions usually come down to timing, delivery confirmation, and whether any document or workflow step is still pending.`,
          `The fastest way to troubleshoot payout delay is to check delivery status, proof of delivery, and any missing payment step.`,
          `If you want, tell me whether this is about payout timing, payment status, or wallet activity.`
        ]),
        joinReplyParts([
          `Payout questions aam tor par timing, delivery confirmation aur kisi pending document ya workflow step par depend karti hain.`,
          `Payout delay troubleshoot karne ka fastest tareeqa ye ha ke delivery status, proof of delivery aur missing payment step check ki jaye.`,
          `Agar aap chaho to bata dein ke issue payout timing ka ha, payment status ka ha ya wallet activity ka.`
        ])
      );

    case 'Dispatching':
      return pickStyleText(
        style,
        joinReplyParts([
          `Good dispatching is about assigning the right truck to the right load at the right time.`,
          `The main trade-offs are equipment fit, deadhead, driver availability, timing pressure, and reload opportunity.`,
          `If you share the load and truck context, I can help you choose the smarter dispatch move.`
        ]),
        joinReplyParts([
          `Achhi dispatching ka matlab ha sahi truck ko sahi load ke sath sahi waqt par assign karna.`,
          `Main trade-offs equipment fit, deadhead, driver availability, timing pressure aur reload opportunity hote hain.`,
          `Agar aap load aur truck context share karein to main smarter dispatch move suggest kar dunga.`
        ])
      );

    case 'Shipment Management':
      return pickStyleText(
        style,
        joinReplyParts([
          `Shipment management is about keeping pickup, transit, delivery, and exception handling under control.`,
          `The most useful checks are timing, status visibility, carrier coordination, and any risk that can affect delivery.`,
          `If you want, tell me whether the issue is before pickup, in transit, or at delivery.`
        ]),
        joinReplyParts([
          `Shipment management ka matlab ha pickup, transit, delivery aur exception handling ko control men rakhna.`,
          `Iske most useful checks timing, status visibility, carrier coordination aur delivery ko affect karne wale risks hote hain.`,
          `Agar aap chaho to bata dein issue pickup se pehle ha, transit men ha ya delivery par ha.`
        ])
      );

    case 'General Logistics Questions':
      if (concept) {
        const conceptReply = buildConceptExplanation({ concept, style, responseLength });
        if (conceptReply) {
          return conceptReply;
        }
      }

      if (assistantType === 'supplier') {
        return pickStyleText(
          style,
          joinReplyParts([
            `I can help you as a supplier with posting loads, reviewing bids, tracking shipments, and pricing clarity.`,
            responseLength === 'short'
              ? `Which page are you working on: Post a Load, My Posts, or My Bids?`
              : `Tell me what you are trying to do (post a load, accept a bid, edit a post, or track a shipment) and I will guide the exact steps.`
          ]),
          joinReplyParts([
            `Main supplier side par aapko loads post karne, bids review/accept karne, shipments track karne aur pricing clear karne men help kar sakta hoon.`,
            responseLength === 'short'
              ? `Aap kis page par ho: Post a Load, My Posts, ya My Bids?`
              : `Aap bas ye bata dein aapko karna kya ha (load post, bid accept, post edit, ya tracking), main exact steps guide kar dunga.`
          ])
        );
      }

      if (assistantType === 'carrier') {
        return pickStyleText(
          style,
          joinReplyParts([
            `I can help you as a carrier with finding better loads, bidding, route strategy, deadhead reduction, and earnings/payout questions.`,
            responseLength === 'short'
              ? `What is your current location and equipment type?`
              : `Share your lane (from → to), equipment, and how much deadhead you can take, and I will recommend the best next move.`
          ]),
          joinReplyParts([
            `Main carrier side par aapko better loads find karne, bidding, route strategy, deadhead reduce karne aur earnings/payout questions men help kar sakta hoon.`,
            responseLength === 'short'
              ? `Aapki current location aur equipment type kya ha?`
              : `Aap apni lane (from → to), equipment aur acceptable deadhead bata dein, main best next move recommend kar dunga.`
          ])
        );
      }

      return pickStyleText(
        style,
        joinReplyParts([
          `I can help with loads, tracking, dispatch, routes, earnings, payouts, and day-to-day freight operations.`,
          responseLength === 'short'
            ? `Tell me the exact part you want to solve and I will keep the answer focused.`
            : `If you share the exact route, load, truck type, or operational issue, I can give a more useful answer instead of a generic one.`,
          `If you already have a lane, load, or shipment in mind, send that first and I will work from the real context.`
        ]),
        joinReplyParts([
          `Main loads, tracking, dispatch, routes, earnings, payouts aur day-to-day freight operations men help kar sakta hoon.`,
          responseLength === 'short'
            ? `Aap exact part bata dein, main focused answer dunga.`
            : `Agar aap exact route, load, truck type ya operational issue share karein to main generic jawab ke bajaye zyada useful answer de sakta hoon.`,
          `Agar aapke paas pehle se koi lane, load ya shipment ha to woh bhej dein, main real context ke sath kaam karunga.`
        ])
      );

    default:
      return null;
  }
}

function getOllamaGenerationConfig({ responseLength = 'medium' } = {}) {
  if (responseLength === 'short') {
    return { num_predict: 170, timeoutMs: 20000, temperature: 0.35 };
  }

  if (responseLength === 'detailed') {
    return { num_predict: 420, timeoutMs: 45000, temperature: 0.38 };
  }

  return { num_predict: 260, timeoutMs: 30000, temperature: 0.36 };
}

function buildNaturalReply({ assistantType, topic, lowerMessage, history, style = 'english', selectedMode = null }) {
  const followUpTopic = !topic && (isVagueFollowUp(lowerMessage) || wantsDetailedExplanation(lowerMessage) || wantsSimpleExplanation(lowerMessage) || wantsExample(lowerMessage) || wantsContinuation(lowerMessage))
    ? inferTopicFromHistory(history, lowerMessage, assistantType)
    : null;
  const resolvedTopic = topic || followUpTopic;
  const responseLength = detectResponseLength(lowerMessage);
  const operationalMemory = buildOperationalMemory(history, assistantType, resolvedTopic);
  const userIntent = detectUserIntent(lowerMessage, resolvedTopic, assistantType, selectedMode);
  const lastAssistantMessage = [...history].reverse().find((item) => item.role === 'assistant')?.content || '';
  const focusedFollowUpReply = buildFocusedFollowUpReply({
    assistantType,
    lowerMessage,
    style,
    memory: operationalMemory
  });
  const actionRequest = buildActionRequest({
    assistantType,
    lowerMessage,
    history,
    style
  });

  if (focusedFollowUpReply) {
    return focusedFollowUpReply;
  }

  if (actionRequest?.type === 'create_load') {
    if (actionRequest.status === 'needs_input') {
      return actionRequest.prompt;
    }

    if (actionRequest.status === 'ready') {
      const origin = actionRequest.payload?.origin || 'pickup';
      const destination = actionRequest.payload?.destination || 'delivery';
      const equipment = actionRequest.payload?.equipment || 'equipment';
      return pickStyleText(
        style,
        `Perfect. I have ${origin} to ${destination} with ${equipment}. I am preparing this load for creation in the platform now.`,
        `Perfect. Mere paas ${origin} se ${destination} tak ${equipment} ki details aa gayi hain. Main ab is load ko platform par create karne ke liye prepare kar raha hoon.`
      );
    }
  }

  if (wantsExample(lowerMessage) && resolvedTopic) {
    const exampleReply = buildExampleReply({ topic: resolvedTopic, assistantType, style });
    if (exampleReply) {
      return exampleReply;
    }
  }

  if (wantsSimpleExplanation(lowerMessage) && resolvedTopic) {
    const simpleReply = buildSimpleReply({ topic: resolvedTopic, assistantType, style });
    if (simpleReply) {
      return simpleReply;
    }
  }

  if (wantsDetailedExplanation(lowerMessage) && resolvedTopic) {
    const detailedReply = buildDetailedReply({ topic: resolvedTopic, assistantType, style });
    if (detailedReply) {
      return detailedReply;
    }
  }

  if (wantsContinuation(lowerMessage) && resolvedTopic) {
    const continuationReply = buildContinuationReply({ topic: resolvedTopic, assistantType, style });
    if (continuationReply) {
      return continuationReply;
    }
  }

  topic = resolvedTopic;
  const emoji = getTopicEmoji(topic, assistantType);
  const opener = pickStyleText(
    style,
    withEmoji(selectFreshVariant(lowerMessage, ['Absolutely.', 'Of course.', 'Sure.', 'Yes, definitely.'], lastAssistantMessage), emoji),
    withEmoji(selectFreshVariant(lowerMessage, ['Bilkul.', 'Ji haan.', 'Zaroor.', 'Bilkul theek.'], lastAssistantMessage), emoji),
    `جی ہاں۔ ${emoji}`
  );

  if (lowerMessage.includes('how are you')) {
    if (assistantType === 'carrier') {
      return pickStyleText(
        style,
        `😊 I'm doing well, thanks for asking! I'm ready to help with available loads, routes, payouts, or anything related to your carrier work.`,
        `😊 Main theek hoon, shukriya! Main aapko available loads, routes, payouts aur carrier work se related cheezon me help kar sakta hoon.`
      );
    }

    if (assistantType === 'supplier') {
      return pickStyleText(
        style,
        `😊 I'm doing great, thanks! I'm here to help you post loads, find verified carriers, and manage shipments more smoothly.`,
        `😊 Main bilkul theek hoon, shukriya! Main aapko load post karne, verified carriers dhoondhne aur shipments smoothly manage karne me help kar sakta hoon.`
      );
    }

    return pickStyleText(
      style,
      `😊 I'm doing well, thanks! I'm here and ready to help with Alpha Freight questions whenever you need.`,
      `😊 Main theek hoon, shukriya! Jab bhi aapko Alpha Freight se related help chahiye ho, main yahan hoon.`
    );
  }

  if (lowerMessage.includes('thank')) {
    return pickStyleText(
      style,
      `🙌 You're welcome! If you want, send me the next question and I'll help you step by step.`,
      `🙌 Koi baat nahi. Agar aap chaho to next sawal bhejo, main step by step help kar dunga.`
    );
  }

  if (topic && SERVICE_DETAILS[topic]) {
    return pickStyleText(
      style,
      `${opener} ${toTitleCase(topic)}: ${SERVICE_DETAILS[topic]}\n\nIf you want, I can also explain benefits, pricing flow, or who this service is best for.`,
      `${opener} ${toTitleCase(topic)}: ${SERVICE_DETAILS[topic]}\n\nAgar aap chaho to main is service ke benefits, pricing flow aur kis ke liye best ha wo bhi simple tareeqe se bata sakta hoon.`
    );
  }

  const intentAwareReply = buildIntentAwarePlainReply({
    userIntent,
    assistantType,
    topic: resolvedTopic,
    lowerMessage,
    style,
    responseLength,
    memory: operationalMemory
  });

  if (intentAwareReply && (userIntent !== 'Casual Conversation')) {
    return intentAwareReply;
  }

  switch (topic) {
    case 'dashboard':
      return pickStyleText(
        style,
        `${opener} The dashboard is your main control area.\n• It gives you a quick overview of activity\n• It helps you jump into loads, bids, payouts, support, and account sections\n• The exact tools shown depend on whether you are a supplier or a carrier\n\nIf you want, I can explain each dashboard section one by one.`,
        `${opener} Dashboard aapka main control area hota ha.\n• Yahan se aapko activity ka quick overview milta ha\n• Yahin se loads, bids, payouts, support aur account sections access hote hain\n• Supplier aur carrier ke hisab se dashboard tools thore different hote hain\n\nAgar aap chaho to main har dashboard section ko ek ek karke samjha deta hoon.`
      );
    case 'company_info':
      return pickStyleText(
        style,
        `${opener} Here are the main Alpha Freight company details:\n• Company Name: ALPHA FREIGHT SOLUTIONS LIMITED\n• Company Number: 16860760\n• Incorporation Date: November 17th, 2026\n• Registered Office: 124 City Road, London EC1V 2NX, United Kingdom\n• Phone: +44 7782 294718\n• Email: support@alphafreightuk.com\n• Website: www.alphafreightuk.com\n• Business Hours: Mon-Fri, 8:00 AM - 6:00 PM\n\nAlpha Freight Solutions Limited is a UK freight brokerage company focused on transparency, trust, and connecting suppliers with reliable carriers.`,
        `${opener} Alpha Freight ki main company details ye hain:\n• Company Name: ALPHA FREIGHT SOLUTIONS LIMITED\n• Company Number: 16860760\n• Incorporation Date: November 17th, 2026\n• Registered Office: 124 City Road, London EC1V 2NX, United Kingdom\n• Phone: +44 7782 294718\n• Email: support@alphafreightuk.com\n• Website: www.alphafreightuk.com\n• Business Hours: Mon-Fri, 8:00 AM - 6:00 PM\n\nAlpha Freight Solutions Limited UK ki freight brokerage company ha jo transparency, trust aur reliable carriers ke sath suppliers ko connect karne par focus karti ha.`
      );
    case 'pricing':
      return pickStyleText(
        style,
        `${opener} Pricing mainly depends on shipment details.\n• Route and distance\n• Pickup and delivery timing\n• Cargo type, weight, and volume\n• Equipment type and special handling needs\n• Minimum and maximum budget range set during posting\n\nSpecial jobs like urgent, refrigerated, ADR, tail lift, or white glove loads usually cost more than a standard load.\n\nIf you want, I can explain pricing from the supplier side in a simple example.`,
        `${opener} Pricing zyada tar shipment details par depend karti ha.\n• Route aur distance\n• Pickup aur delivery timing\n• Cargo type, weight aur volume\n• Equipment type aur special handling requirements\n• Load post karte waqt jo minimum aur maximum budget range set hoti ha\n\nUrgent, refrigerated, ADR, tail lift aur white glove jese loads aam standard load se zyada cost kar sakte hain.\n\nAgar aap chaho to main supplier side se pricing ko ek simple example ke sath samjha deta hoon.`
      );
    case 'verification':
      return pickStyleText(
        style,
        `${opener} Verification is meant to improve trust and shipment safety.\n• Identity and business registration review\n• Insurance verification\n• Safety and compliance screening\n• Fleet and document validation\n• Performance and reliability review\n\nRe-verification can happen when documents expire, insurance changes, or account review is due.\n\nIf you want, I can explain these 5 steps in simpler words too.`,
        `${opener} Verification ka maqsad trust aur shipment safety ko improve karna ha.\n• Identity aur business registration review\n• Insurance verification\n• Safety aur compliance screening\n• Fleet aur document validation\n• Performance aur reliability review\n\nRe-verification tab ho sakti ha jab documents expire ho jayen, insurance change ho ya account review due ho.\n\nAgar aap chaho to main ye 5 steps aur simple words me bhi samjha sakta hoon.`
      );
    case 'support_policy':
      return pickStyleText(
        style,
        `${opener} Support is designed around fast help and secure handling.\n• Live chat is best for urgent active shipment issues\n• Email support is better for non-urgent account or operational queries\n• Phone support is useful when direct coordination is needed\n• Escalation happens when live shipment timing, delivery, access, or payment is at risk\n• Complaint and dispute review should use shipment records and communication history\n\nIf you want, I can break this down into urgent vs normal support flow.`,
        `${opener} Support fast help aur secure handling ke liye design ki gayi ha.\n• Live chat urgent active shipment issues ke liye best ha\n• Email support non-urgent account ya operational questions ke liye better ha\n• Phone support direct coordination wali situation me useful hoti ha\n• Escalation tab hoti ha jab live shipment timing, delivery, access ya payment risk me ho\n• Complaint aur dispute review shipment records aur communication history ke sath hoti ha\n\nAgar aap chaho to main urgent aur normal support flow alag alag samjha sakta hoon.`
      );
    case 'post_load':
      return pickStyleText(
        style,
        `${opener} To post a load as a shipper:\n• Add pickup and delivery details\n• Enter load size, weight, and timing\n• Review pricing and any special requirements\n• Publish the load so verified carriers can be matched quickly\n\nIf you want, I can explain the posting flow step by step in simpler words too.`,
        `${opener} Shipper ke taur par load post karne ke liye:\n• Pickup aur delivery details add karo\n• Load size, weight aur timing enter karo\n• Pricing aur special requirements review karo\n• Phir load publish karo taake verified carriers jaldi match ho saken\n\nAgar aap chaho to main posting flow aur bhi simple words me step by step samjha deta hoon.`
      );
    case 'available_loads':
      return pickStyleText(
        style,
        `Available loads are shown based on your route, equipment, timing, and earning potential.\n• Look for route-compatible loads first\n• Prioritize backhauls to reduce empty miles\n• Compare payout timing and delivery windows\n\nIf you want, I can also explain how to choose the best load as a carrier.`,
        `Available loads aapke route, equipment, timing aur earning potential ke hisab se dikhaye jate hain.\n• Pehle route-compatible loads dekho\n• Empty miles kam karne ke liye backhauls ko priority do\n• Payout timing aur delivery windows compare karo\n\nAgar aap chaho to main ye bhi samjha sakta hoon ke carrier ke liye best load kaise choose karna chahiye.`
      );
    case 'smart_loads':
      return pickStyleText(
        style,
        `Smart Loads are AI-recommended opportunities based on route fit, timing, and earning potential.\n• They help surface stronger matches faster\n• They are meant to reduce manual searching\n• They can support better profit decisions\n\nIf you want, I can explain how Smart Loads help a carrier day to day.`,
        `Smart Loads AI-recommended opportunities hoti hain jo route fit, timing aur earning potential ke hisab se suggest hoti hain.\n• Ye strong matches jaldi dhoondhne me help karti hain\n• Manual searching kam hoti ha\n• Profit decision better ho sakta ha\n\nAgar aap chaho to main bata sakta hoon ke Smart Loads daily carrier work me kaise help karti hain.`
      );
    case 'my_loads':
      return assistantType === 'carrier'
        ? pickStyleText(
            style,
            `My Loads shows shipments already assigned to you.\n• You can review current jobs and progress\n• It helps you track execution after booking\n• It keeps your active workload organized\n\nIf you want, I can explain load statuses like booked, in-transit, and completed.`,
            `My Loads me wo shipments dikhte hain jo aapko assign ho chuke hote hain.\n• Aap current jobs aur unki progress dekh sakte ho\n• Booking ke baad execution track hoti ha\n• Aapka active workload organized rehta ha\n\nAgar aap chaho to main booked, in-transit aur completed statuses bhi samjha sakta hoon.`
          )
        : pickStyleText(
            style,
            `My Posts is the supplier-side area for tracking posted loads. If you want, I can explain supplier load tracking in simple steps.`,
            `My Posts supplier side ka section ha jahan posted loads track hote hain. Agar aap chaho to main isko simple steps me samjha deta hoon.`
          );
    case 'my_posts':
      return pickStyleText(
        style,
        `My Posts helps suppliers manage posted shipment requests.\n• You can review active, booked, in-transit, and completed loads\n• It keeps your shipment records organized\n• It gives you visibility into execution progress\n\nIf you want, I can explain each load status in simple words.`,
        `My Posts suppliers ko posted shipment requests manage karne me help karta ha.\n• Yahan aap active, booked, in-transit aur completed loads dekh sakte ho\n• Shipment records organized rehte hain\n• Execution progress clearly nazar aati ha\n\nAgar aap chaho to main har load status simple words me samjha deta hoon.`
      );
    case 'bids':
      return assistantType === 'supplier'
        ? pickStyleText(
            style,
            `My Bids helps suppliers review carrier offers on posted loads.\n• You can compare carrier bids\n• Accept the best-fit offer\n• Reject other bids once a carrier is selected\n• Move the load into booked status\n\nIf you want, I can explain the bid acceptance flow step by step.`,
            `My Bids suppliers ko posted loads par carrier offers review karne me help karta ha.\n• Aap carrier bids compare kar sakte ho\n• Best-fit offer accept kar sakte ho\n• Carrier select hone ke baad baqi bids reject ho sakti hain\n• Load booked status me chala jata ha\n\nAgar aap chaho to main bid acceptance flow step by step samjha deta hoon.`
          )
        : pickStyleText(
            style,
            `My Bids lets carriers track the offers they have submitted.\n• It helps you monitor pending, accepted, or rejected bids\n• It keeps your opportunities organized\n• It supports smarter follow-up on available work\n\nIf you want, I can explain bidding strategy too.`,
            `My Bids carriers ko apni submitted offers track karne deta ha.\n• Yahan pending, accepted aur rejected bids monitor hoti hain\n• Opportunities organized rehti hain\n• Available work par smarter follow-up me help milti ha\n\nAgar aap chaho to main bidding strategy bhi samjha sakta hoon.`
          );
    case 'earnings':
      return pickStyleText(
        style,
        `To improve earnings as a carrier, focus on:\n• Reducing empty miles\n• Taking strong backhaul loads\n• Choosing loads with good timing and payout value\n• Planning routes that avoid wasted fuel and downtime\n\nIf you want, I can break this down into practical daily tips.`,
        `Carrier earnings improve karne ke liye in cheezon par focus karo:\n• Empty miles kam karo\n• Strong backhaul loads lo\n• Achhi timing aur payout value wale loads choose karo\n• Aise routes plan karo jahan fuel aur downtime waste na ho\n\nAgar aap chaho to main isko practical daily tips me break kar deta hoon.`
      );
    case 'wallet':
      return assistantType === 'carrier'
        ? pickStyleText(
            style,
            `The Wallet section helps carriers manage money-related activity.\n• Review available balance\n• Check payout activity and transaction history\n• Follow completed-load revenue movement\n\nIf you want, I can also explain how Wallet and Earnings are different.`,
            `Wallet section carriers ko money-related activity manage karne me help karta ha.\n• Available balance dekh sakte ho\n• Payout activity aur transaction history check kar sakte ho\n• Completed loads ki revenue movement follow kar sakte ho\n\nAgar aap chaho to main Wallet aur Earnings ka difference bhi samjha sakta hoon.`
          )
        : pickStyleText(
            style,
            `For suppliers, payment management is usually tied to shipment payment workflow such as Pay Instant and Pay Later.\n\nIf you want, I can explain those payment options clearly.`,
            `Suppliers ke liye payment management zyada tar shipment payment workflow se linked hoti ha, jaise Pay Instant aur Pay Later.\n\nAgar aap chaho to main ye dono options clear tareeqe se samjha deta hoon.`
          );
    case 'payment':
      return assistantType === 'carrier'
        ? pickStyleText(
            style,
            `For carriers, Alpha Freight focuses on fast payout support.\n• Payments are processed after delivery confirmation\n• The target payout window is within 7 days\n• You can also review payout-related details inside the platform workflow\n\nIf you want, I can explain the payout process in simple steps.`,
            `Carriers ke liye Alpha Freight fast payout support par focus karta ha.\n• Delivery confirmation ke baad payment process hoti ha\n• Target payout window 7 din ke andar ha\n• Platform workflow me payout-related details bhi review ki ja sakti hain\n\nAgar aap chaho to main payout process simple steps me samjha deta hoon.`
          )
        : pickStyleText(
            style,
            `For shippers, pricing and payment clarity are important.\n• You review shipment details before posting\n• Special requirements can affect final cost\n• Tracking and verified carrier matching add more operational confidence\n\nIf you want, I can explain pricing factors more clearly.`,
            `Shippers ke liye pricing aur payment clarity bohat important hoti ha.\n• Load post karne se pehle shipment details review hoti hain\n• Special requirements final cost ko affect kar sakti hain\n• Tracking aur verified carrier matching se operational confidence barhta ha\n\nAgar aap chaho to main pricing factors aur clear tareeqe se samjha deta hoon.`
          );
    case 'pay_instant':
      return pickStyleText(
        style,
        `Pay Instant is the supplier payment flow for immediate checkout.\n• It supports direct card-based payment processing\n• It is useful when you want to clear payment right away\n• It keeps the payment step more immediate and controlled\n\nIf you want, I can explain when to choose Pay Instant over Pay Later.`,
        `Pay Instant supplier payment flow ha jo immediate checkout ke liye use hoti ha.\n• Isme direct card-based payment processing hoti ha\n• Jab aap foran payment clear karna chaho to ye useful hota ha\n• Payment step zyada immediate aur controlled rehti ha\n\nAgar aap chaho to main bata sakta hoon ke Pay Instant ko Pay Later ke upar kab choose karna chahiye.`
      );
    case 'pay_later':
      return pickStyleText(
        style,
        `Pay Later keeps supplier payments in a deferred queue.\n• Loads can stay in the payment queue until you are ready\n• You can move eligible orders into instant payment later\n• It gives suppliers more payment flexibility\n\nIf you want, I can explain the Pay Later workflow step by step.`,
        `Pay Later supplier payments ko deferred queue me rakhta ha.\n• Loads payment queue me tab tak reh sakte hain jab tak aap ready na ho\n• Eligible orders ko baad me instant payment me move kiya ja sakta ha\n• Suppliers ko zyada payment flexibility milti ha\n\nAgar aap chaho to main Pay Later workflow step by step samjha deta hoon.`
      );
    case 'tracking':
      return pickStyleText(
        style,
        `${opener} Tracking is designed to keep you updated from pickup to delivery.\n• Tracking becomes active once the load is booked for live execution\n• Pickup updates show the shipment has moved into operational progress\n• In-transit visibility can include progress, delay context, and arrival expectation\n• Delivery confirmation closes the shipment operationally\n• Delay updates are meant to keep both sides informed\n\nIf you want, I can explain the tracking flow step by step.`,
        `${opener} Tracking ka maqsad ye ha ke aap pickup se delivery tak updated raho.\n• Tracking tab active hoti ha jab load live execution ke liye booked ho jaye\n• Pickup update batati ha ke shipment operational progress me aa gayi ha\n• In-transit visibility me progress, delay context aur expected arrival aa sakta ha\n• Delivery confirmation ke baad shipment operationally close hoti ha\n• Delay updates dono sides ko informed rakhne ke liye hoti hain\n\nAgar aap chaho to main tracking flow step by step samjha sakta hoon.`
      );
    case 'find_carriers':
      return pickStyleText(
        style,
        `Yes, Alpha Freight helps you connect with verified carriers.\n• Carrier matching is designed to be fast\n• Verification improves reliability and trust\n• You can compare fit based on route and shipment needs\n\nIf you want, I can explain how carrier verification works too.`,
        `Ji haan, Alpha Freight aapko verified carriers se connect karne me help karta ha.\n• Carrier matching fast tareeqe se hoti ha\n• Verification se reliability aur trust barhta ha\n• Aap route aur shipment needs ke hisab se fit compare kar sakte ho\n\nAgar aap chaho to main carrier verification ka process bhi samjha sakta hoon.`
      );
    case 'route_planning':
      return pickStyleText(
        style,
        `Route planning is meant to help carriers move smarter.\n• Better routes reduce empty miles\n• Good planning supports fuel savings and timing control\n• It also helps improve earnings across multiple jobs\n\nIf you want, I can explain route planning from an operations point of view.`,
        `Route planning ka maqsad carriers ko smarter tareeqe se move karwana ha.\n• Better routes empty miles kam karti hain\n• Achhi planning fuel savings aur timing control me help karti ha\n• Multiple jobs me earnings improve hoti hain\n\nAgar aap chaho to main route planning ko operations point of view se samjha sakta hoon.`
      );
    case 'driver_panel':
      return pickStyleText(
        style,
        `Driver Panel helps carriers manage driver records.\n• Add driver profiles\n• Store contact details and license reference\n• Track operating region and experience\n• Keep the team ready for dispatch coordination\n\nIf you want, I can explain what details are usually added for each driver.`,
        `Driver Panel carriers ko driver records manage karne me help karta ha.\n• Driver profiles add ki ja sakti hain\n• Contact details aur license reference store hota ha\n• Operating region aur experience track hota ha\n• Team dispatch coordination ke liye ready rehti ha\n\nAgar aap chaho to main har driver ke liye kaun si details add hoti hain wo bhi samjha sakta hoon.`
      );
    case 'vehicles':
      return pickStyleText(
        style,
        `My Vehicles is used to manage fleet units and vehicle records.\n• Add vehicle identity and registration details\n• Store make, model, capacity, and operating region\n• Keep compliance files linked to the vehicle\n\nIf you want, I can explain what vehicle details matter most operationally.`,
        `My Vehicles fleet units aur vehicle records manage karne ke liye use hota ha.\n• Vehicle identity aur registration details add hoti hain\n• Make, model, capacity aur operating region store hota ha\n• Compliance files vehicle ke sath linked rehti hain\n\nAgar aap chaho to main bata sakta hoon ke operationally sab se important vehicle details kaun si hoti hain.`
      );
    case 'support':
      return pickStyleText(
        style,
        `Alpha Freight support is there to help with operational and account questions.\n• Live chat support\n• Email support\n• Phone support\n• FAQ guidance for tracking, payouts, vehicles, and workflow\n\nIf you want, tell me your issue and I'll guide you properly.`,
        `Alpha Freight support operational aur account questions me help ke liye ha.\n• Live chat support\n• Email support\n• Phone support\n• Tracking, payouts, vehicles aur workflow ke liye FAQ guidance\n\nAgar aap chaho to apna exact issue bhejo, main proper guide kar dunga.`
      );
    case 'referrals':
      return pickStyleText(
        style,
        `Referrals help you share Alpha Freight with other users and grow your network.\n• It can support network expansion\n• It gives users a dedicated place for referral activity\n\nIf you want, I can explain referrals from the supplier side or carrier side.`,
        `Referrals aapko Alpha Freight ko dusre users ke sath share karne aur apna network grow karne me help karti hain.\n• Is se network expansion support hoti ha\n• Referral activity ke liye dedicated jagah milti ha\n\nAgar aap chaho to main referrals ko supplier side ya carrier side se samjha sakta hoon.`
      );
    case 'settings':
      return pickStyleText(
        style,
        `Settings is the section for account preferences and platform configuration.\n• Manage profile-related preferences\n• Adjust account setup and workflow options\n• Keep your account organized for daily operations\n\nIf you want, I can explain what suppliers or carriers usually manage there.`,
        `Settings account preferences aur platform configuration ka section ha.\n• Profile-related preferences manage hoti hain\n• Account setup aur workflow options adjust hote hain\n• Daily operations ke liye account organized rehta ha\n\nAgar aap chaho to main bata sakta hoon ke suppliers ya carriers yahan aam tor par kya manage karte hain.`
      );
    case 'services':
      return pickStyleText(
        style,
        `${opener} Alpha Freight offers a range of logistics support, including:\n• Freight & Trucking\n• Container Transport\n• Last-Mile Delivery\n• Warehouse & Storage\n• Express Distribution\n• Freight Forwarding\n• Supply Chain Management\n\nIf you want, tell me which one to explain in more detail.`,
        `${opener} Alpha Freight multiple logistics services offer karta ha, jisme ye cheezen shamil hain:\n• Freight & Trucking\n• Container Transport\n• Last-Mile Delivery\n• Warehouse & Storage\n• Express Distribution\n• Freight Forwarding\n• Supply Chain Management\n\nAgar aap chaho to in me se kisi ek service ko main detail me samjha sakta hoon.`
      );
    case 'how_it_works':
      return pickStyleText(
        style,
        `Alpha Freight works in a simple flow:\n• Shipment details or truck availability are added\n• The system finds suitable matches\n• Tracking and visibility support the shipment journey\n• Verified operations improve trust and safety\n• Payout and delivery follow the operational workflow\n\nIf you want, I can explain this from the supplier side or carrier side.`,
        `Alpha Freight simple flow me kaam karta ha:\n• Shipment details ya truck availability add hoti ha\n• System suitable matches find karta ha\n• Tracking aur visibility shipment journey ko support karti ha\n• Verified operations trust aur safety improve karti hain\n• Delivery aur payout operational workflow ke mutabiq hoti ha\n\nAgar aap chaho to main is flow ko supplier side ya carrier side se samjha sakta hoon.`
      );
    default:
      if (isVagueFollowUp(lowerMessage)) {
        const previousTopic = inferTopicFromHistory(history, lowerMessage, assistantType);
        if (previousTopic) {
          return buildNaturalReply({
            assistantType,
            topic: previousTopic,
            lowerMessage: '',
            history,
            style,
          });
        }
      }

      const recentTopic = inferTopicFromHistory(history, lowerMessage, assistantType);
      if (recentTopic) {
        return pickStyleText(
          style,
          `${opener} We were recently talking about ${formatTopicLabel(recentTopic)}. If you want, I can continue from there or explain the next step more clearly.`,
          `${opener} Hum abhi ${formatTopicLabel(recentTopic)} ke bare me baat kar rahe thay. Agar aap chaho to main wahi se continue kar sakta hoon ya next step aur clear samjha sakta hoon.`
        );
      }

      if (assistantType === 'supplier') {
        return pickStyleText(
          style,
          `${opener} I can help with supplier topics like posting loads, finding verified carriers, tracking shipments, or pricing. Tell me which one you want to focus on and I'll keep it simple.`,
          `${opener} Main supplier side par load posting, verified carriers, tracking ya pricing me help kar sakta hoon. Aap bas bata dein kis cheez par focus chahiye, main simple tareeqe se samjha dunga.`
        );
      }

      if (assistantType === 'carrier') {
        return pickStyleText(
          style,
          `${opener} I can help with carrier topics like available loads, route planning, payouts, or earnings. Tell me which part matters most and I'll answer directly.`,
          `${opener} Main carrier side par available loads, route planning, payouts ya earnings me help kar sakta hoon. Aap bata dein kis part par focus chahiye, main direct answer dunga.`
        );
      }

      return pickStyleText(
        style,
        `${opener} I can help with Alpha Freight services, tracking, pricing, supplier workflow, or carrier workflow. Tell me the exact part you want and I'll keep the answer focused.`,
        `${opener} Main Alpha Freight services, tracking, pricing, supplier workflow ya carrier workflow me help kar sakta hoon. Aap exact cheez bata dein, main focused answer dunga.`
      );
  }
}

async function ensureSupabaseVectorRpcCheck() {
  if (!supabase) {
    supabaseVectorRpcChecked = true;
    supabaseVectorRpcError = 'Supabase is not configured';
    return false;
  }

  await scoreSupabaseSemanticChunks('shipment tracking pricing support', 'general');
  return supabaseVectorRpcChecked && !supabaseVectorRpcError;
}

// System prompt for Alpha Freight
const SYSTEM_PROMPT = `You are Alpha Freight AI, a premium AI Logistics Copilot for modern freight operations.

ABOUT ALPHA FREIGHT:
- A platform connecting shippers and carriers
- AI-powered load matching
- Real-time shipment tracking
- Verified carrier network
- Fast 7-day payouts for carriers
- 24/7 customer support

CORE BEHAVIOR:
- Detect the user's intent first before answering.
- Possible intents include Load Posting, Load Search, Load Analysis, Tracking, Route Planning, Fleet Management, Driver Support, Earnings, Payouts, Fuel Cost, Dispatching, Shipment Management, General Logistics Questions, and Casual Conversation.
- Before every response:
  1) Identify the main topic.
  2) Identify the user's goal.
  3) Write a one-line internal summary (do not show it to the user).
- Always verify the response topic matches the user's question before sending.
- Never switch topics. If the user asks about earnings, do not answer tracking. If the user asks about tracking, do not answer load analysis.
- Default to a ChatGPT-style conversation, not a dashboard.
- Use advanced analysis structure only when it adds real value, such as load analysis, route optimization, profit calculation, fleet analysis, earnings breakdown, or shipment analysis.
- For normal questions, answer naturally with short paragraphs and bullets only when helpful.
- Vary response length based on question complexity.
- Be proactive: suggest better options, warn about risks, and recommend next steps when appropriate.
- Keep responses voice-friendly and easy to read aloud.

IMPORTANT LANGUAGE RULE:
- Reply in the same language and style as the user.
- If the user writes in Roman Urdu, reply in Roman Urdu.
- If the user writes in English, reply in English.
- If the user uses Urdu script, reply in Urdu script if possible.
- Avoid repeating the same opening sentence again and again.
- Continue the previous topic naturally when the user sends a short follow-up.
- Start with the answer directly instead of filler.
- Sound human, smooth, and confident, not robotic.
- If context is weak, say what you do know and ask one focused follow-up question.
- Do not repeat the user's question back unless it helps clarity.
- Do not sound like a template-based FAQ bot or reporting dashboard.`;

const greetingPatterns = [
  'hi',
  'hello',
  'hey',
  'salam',
  'assalam',
  'aslam',
  'hi there',
  'hello there'
];

// Chat API endpoint - with Ollama integration
app.post('/api/chat', requireSupabaseAuth, async (req, res) => {
  const {
    message,
    assistantType = 'general',
    history = [],
    mode = null,
    carrierContext = null,
    stream: streamMode = false,
  } = req.body;

  const emitStream = streamMode
    ? (event) => {
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache, no-transform');
          res.setHeader('Connection', 'keep-alive');
          if (typeof res.flushHeaders === 'function') {
            res.flushHeaders();
          }
        }
        res.write(`${JSON.stringify(event)}\n`);
      }
    : null;

  const sendChatReply = (structuredMessage, phase = null) => {
    const payload = {
      success: true,
      message: composeStructuredText(structuredMessage),
      structuredMessage,
    };

    if (emitStream) {
      if (phase) {
        emitStream({ type: 'phase', phase });
      }
      emitStream({ type: 'complete', ...payload });
      res.end();
      return;
    }

    return res.json(payload);
  };
  
  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const lowerMessage = message.toLowerCase().trim();
  const normalizedAssistantType = ['general', 'supplier', 'carrier'].includes(assistantType)
    ? assistantType
    : 'general';
  const conversationHistory = normalizeHistory(history);
  const conversationMemory = extractConversationMemory(conversationHistory, normalizedAssistantType);
  const serviceIntent = detectServiceIntent(lowerMessage);
  const responseStyle = resolveResponseStyle(message, conversationHistory);
  let inferredTopic = detectTopicFromText(lowerMessage, normalizedAssistantType)
    || inferTopicFromHistory(conversationHistory, lowerMessage, normalizedAssistantType)
    || conversationMemory.activeTopic;
  const responseLength = detectResponseLength(lowerMessage);
  const heuristicIntentMeta = detectUserIntentWithConfidence(lowerMessage, inferredTopic, normalizedAssistantType, mode);
  let userIntent = heuristicIntentMeta.intent;

  if (
    responseStyle !== 'other_language' &&
    responseLength !== 'short' &&
    heuristicIntentMeta.confidence < 0.6 &&
    !serviceIntent
  ) {
    try {
      const classified = await classifyIntentViaOllama({
        message: lowerMessage,
        assistantType: normalizedAssistantType,
        topic: inferredTopic,
        style: responseStyle
      });

      if (classified?.intent) {
        userIntent = String(classified.intent || '').trim() || userIntent;
      }

      if (classified?.topic && classified.topic !== 'none' && !inferredTopic) {
        inferredTopic = classified.topic;
      }
    } catch {
      userIntent = heuristicIntentMeta.intent;
    }
  }

  const canonicalTopic = mapIntentToTopic(userIntent, normalizedAssistantType);
  if (!serviceIntent && canonicalTopic && inferredTopic !== canonicalTopic) {
    inferredTopic = canonicalTopic;
  }

  if (greetingPatterns.includes(lowerMessage)) {
    const greetingByRole = {
      general: pickStyleText(
        responseStyle,
        `Hey there! 👋 I’m Alpha Freight AI. How can I help you today?`,
        `Assalam o alaikum! Main aapka Alpha Freight AI assistant hoon. Aaj main aapki kis cheez me help karoon? Chahe aap carrier ho ya shipper, main help ke liye yahan hoon.`
      ),
      supplier: pickStyleText(
        responseStyle,
        `Hey there! 👋 I can help you post a load, review bids, or track a shipment.`,
        `Assalam o alaikum! Main aapka Alpha Freight supplier assistant hoon. Main aapko loads post karne, verified carriers dhoondhne, shipments track karne aur pricing samajhne me help kar sakta hoon.`
      ),
      carrier: pickStyleText(
        responseStyle,
        `Hey there! 👋 I can help you find loads, reduce deadhead, and improve earnings.`,
        `Assalam o alaikum! Main aapka Alpha Freight carrier assistant hoon. Main aapko available loads, smarter routes, payout questions aur earnings improve karne me help kar sakta hoon.`
      )
    };

    const plainGreeting = greetingByRole[normalizedAssistantType];
    const structuredGreeting = buildStructuredAssistantReply({
      assistantType: normalizedAssistantType,
      lowerMessage,
      topic: inferredTopic,
      plainReply: plainGreeting,
      memory: conversationMemory,
      style: responseStyle,
      selectedMode: mode,
      history: conversationHistory,
    });

    return sendChatReply(structuredGreeting);
  }

  if (normalizedAssistantType === 'carrier' && carrierContext) {
    const carrierDataReply = buildCarrierContextStructuredReply({
      lowerMessage,
      carrierContext,
      style: responseStyle,
      assistantType: normalizedAssistantType,
    });

    if (carrierDataReply) {
      return sendChatReply(carrierDataReply);
    }
  }

  const needsWebSearch = isExternalWebQuestion(lowerMessage, {
    skipDirectCarrierData: true,
    isDirectCarrierDataQuestion: (text) => isDirectCarrierDataQuestion(text),
  });

  if (needsWebSearch) {
    try {
      const webSearchReply = await buildWebSearchAssistantReply({
        message,
        lowerMessage,
        style: responseStyle,
        ollama,
        modelName: MODEL_NAME,
      });

      if (webSearchReply) {
        return sendChatReply(webSearchReply, 'searching');
      }
    } catch (webSearchError) {
      console.warn('⚠️ Web search failed:', webSearchError.message);
    }
  }

  const focusedFollowUp = buildFocusedFollowUpReply({
    assistantType: normalizedAssistantType,
    lowerMessage,
    style: responseStyle,
    memory: conversationMemory
  });

  if (focusedFollowUp) {
    const structuredFollowUp = buildStructuredAssistantReply({
      assistantType: normalizedAssistantType,
      lowerMessage,
      topic: serviceIntent || inferredTopic,
      plainReply: focusedFollowUp,
      memory: conversationMemory,
      style: responseStyle,
      selectedMode: mode,
      history: conversationHistory,
    });

    return sendChatReply(structuredFollowUp, 'thinking');
  }

  const shouldUseFastPath =
    responseStyle !== 'other_language' &&
    !needsWebSearch && (
    lowerMessage.includes('how are you') ||
    lowerMessage.includes('thank') ||
    isVagueFollowUp(lowerMessage) ||
    Boolean(serviceIntent) ||
    Boolean(inferredTopic) ||
    userIntent === 'Casual Conversation' ||
    userIntent === 'Load Posting' ||
    userIntent === 'Load Search' ||
    (
      ['Tracking', 'Payouts', 'Fuel Cost'].includes(userIntent) &&
      responseLength !== 'detailed' &&
      !(normalizedAssistantType === 'carrier' && carrierContext && isDirectCarrierDataQuestion(lowerMessage))
    ) ||
    (
      ['Route Planning', 'Fleet Management', 'Driver Support', 'Earnings', 'Dispatching', 'Shipment Management'].includes(userIntent) &&
      responseLength === 'short'
    ) ||
    (
      userIntent === 'General Logistics Questions' &&
      responseLength === 'short'
    )
    );

  if (shouldUseFastPath) {
    const fastReply = buildNaturalReply({
      assistantType: normalizedAssistantType,
      topic: serviceIntent || inferredTopic,
      lowerMessage,
      history: conversationHistory,
      style: responseStyle,
      selectedMode: mode,
    });
    const structuredFastReply = buildStructuredAssistantReply({
      assistantType: normalizedAssistantType,
      lowerMessage,
      topic: serviceIntent || inferredTopic,
      plainReply: fastReply,
      memory: conversationMemory,
      style: responseStyle,
      selectedMode: mode,
      history: conversationHistory,
    });

    return sendChatReply(structuredFastReply, 'thinking');
  }
  
  try {
    const knowledgeSearchInput = buildKnowledgeSearchInput(message, inferredTopic, conversationMemory);
    const relevantInfo = await findRelevantKnowledge(knowledgeSearchInput, normalizedAssistantType);
    const mainTopic = formatTopicLabel(mapIntentToTopic(userIntent, normalizedAssistantType) || inferredTopic || userIntent);
    const userGoal = inferUserGoal({
      userIntent,
      assistantType: normalizedAssistantType,
      workflowStage: conversationMemory.workflowStage
    });
    const prompt = `${SYSTEM_PROMPT}

ROLE:
${ROLE_PROMPTS[normalizedAssistantType]}

RESPONSE RULES:
- Reply in a warm, professional tone.
- Be specific to the current role and user question.
- Detect the user's intent first and answer for that intent instead of using one generic template.
- Do not answer based on keyword similarity. Answer the user's goal.
- Verify the response topic matches the user's question before sending. If it does not match, fix it.
- Never switch topics. If the user asks about earnings, do not answer tracking. If the user asks about tracking, do not answer load analysis.
- If the user asks a short follow-up like "available loads" or a service name, use recent conversation to infer the topic.
- Use the memory summary to continue the active topic instead of restarting from scratch.
- Keep answers concise for simple questions, medium for normal questions, and detailed for complex logistics questions.
- Prefer short paragraphs by default; use bullet points only when they improve clarity.
- Do not generate dashboard-style analysis cards in text form for simple prompts like thanks, hello, what is tracking, or explain RPM.
- Emojis are allowed in greetings. Avoid emojis inside operational step-by-step answers unless the user is already using them heavily.
- Do not invent features that are not supported by the knowledge base.
- Avoid generic lines like "I can help with that" when you already have enough context.
- Avoid repeating the same opener or the same closing offer from the previous assistant reply.
- If the answer comes from known Alpha Freight details, say it clearly and naturally.
- When information is missing for a task like load posting, load search, route planning, or earnings review, ask one focused follow-up question.

MAIN TOPIC:
${mainTopic}

USER GOAL:
${userGoal}

INTERNAL SUMMARY (DO NOT OUTPUT):
User wants: ${userGoal}

CONVERSATION MEMORY:
${formatConversationMemory(conversationMemory)}

RECENT CONVERSATION:
${formatHistory(conversationHistory)}

INFERRED TOPIC:
${inferredTopic || 'none'}

DETECTED USER INTENT:
${userIntent}

DETECTED USER STYLE:
${responseStyle}

SELECTED AI MODE:
${normalizeSelectedMode(mode) || 'auto'}

KNOWLEDGE BASE:
${relevantInfo}

LIVE CARRIER DATA (from this user's Alpha Freight account — prioritize this for loads, bids, wallet, and earnings questions):
${formatCarrierContext(carrierContext)}

CARRIER DATA RULES:
- When the user asks about their loads, bids, wallet, earnings, or available freight, use LIVE CARRIER DATA first.
- Mention specific load codes, routes, prices, and statuses from LIVE CARRIER DATA when available.
- Do not invent loads, bids, or wallet balances that are not listed in LIVE CARRIER DATA.
- If LIVE CARRIER DATA is empty for a category, say that clearly and guide the user to the right screen in the app.

USER QUESTION:
${message}`;

    const generationConfig = getOllamaGenerationConfig({ responseLength });

    // Try Ollama first
    try {
      if (emitStream) {
        emitStream({ type: 'phase', phase: 'thinking' });

        let fullText = '';
        const ollamaStream = await ollama.generate({
          model: MODEL_NAME,
          prompt: prompt,
          stream: true,
          keep_alive: '30m',
          options: {
            temperature: generationConfig.temperature,
            num_predict: generationConfig.num_predict,
            repeat_penalty: 1.12
          }
        });

        for await (const chunk of ollamaStream) {
          const piece = chunk.response || '';
          if (!piece) continue;
          fullText += piece;
          emitStream({ type: 'delta', text: piece });
        }

        const polishedResponse = polishAssistantReply({
          reply: fullText,
          lowerMessage,
          assistantType: normalizedAssistantType,
          style: responseStyle,
          history: conversationHistory,
          topic: serviceIntent || inferredTopic
        });
        const structuredReply = buildStructuredAssistantReply({
          assistantType: normalizedAssistantType,
          lowerMessage,
          topic: serviceIntent || inferredTopic,
          plainReply: polishedResponse,
          memory: conversationMemory,
          style: responseStyle,
          selectedMode: mode,
          history: conversationHistory,
        });

        return sendChatReply(structuredReply);
      }

      const ollamaResponse = await withTimeout(
        ollama.generate({
          model: MODEL_NAME,
          prompt: prompt,
          stream: false,
          keep_alive: '30m',
          options: {
            temperature: generationConfig.temperature,
            num_predict: generationConfig.num_predict,
            repeat_penalty: 1.12
          }
        }),
        generationConfig.timeoutMs
      );
      
      const polishedResponse = polishAssistantReply({
        reply: ollamaResponse.response,
        lowerMessage,
        assistantType: normalizedAssistantType,
        style: responseStyle,
        history: conversationHistory,
        topic: serviceIntent || inferredTopic
      });
      const structuredReply = buildStructuredAssistantReply({
        assistantType: normalizedAssistantType,
        lowerMessage,
        topic: serviceIntent || inferredTopic,
        plainReply: polishedResponse,
        memory: conversationMemory,
        style: responseStyle,
        selectedMode: mode,
        history: conversationHistory,
      });

      return sendChatReply(structuredReply);
    } catch (ollamaError) {
      console.warn('⚠️ Ollama not available, using fallback responses:', ollamaError.message);
      
      // Fallback responses if Ollama isn't available
      let response = "";

      if (greetingPatterns.some(pattern => lowerMessage.includes(pattern))) {
        const greetingByRole = {
          general: pickStyleText(
            responseStyle,
            `Hey there! 👋 I’m Alpha Freight AI. How can I help you today?`,
            `Assalam o alaikum! Main aapka Alpha Freight AI assistant hoon. Aaj main aapki kis cheez me help karoon?`
          ),
          supplier: pickStyleText(
            responseStyle,
            `Hey there! 👋 Are you trying to post a load, review bids, or track a shipment?`,
            `Assalam o alaikum! Main aapka Alpha Freight supplier assistant hoon. Aapko kya karna ha: load post, bids review, ya shipment track?`
          ),
          carrier: pickStyleText(
            responseStyle,
            `Hey there! 👋 Are you trying to find loads, plan a route, or check earnings?`,
            `Assalam o alaikum! Main aapka Alpha Freight carrier assistant hoon. Aapko kya karna ha: loads find, route plan, ya earnings check?`
          )
        };

        response = greetingByRole[normalizedAssistantType] || greetingByRole.general;
      } else {
        response = buildNaturalReply({
          assistantType: normalizedAssistantType,
          topic: serviceIntent || inferredTopic,
          lowerMessage,
          history: conversationHistory,
          style: responseStyle,
        });
      }
      
      response = polishAssistantReply({
        reply: response,
        lowerMessage,
        assistantType: normalizedAssistantType,
        style: responseStyle,
        history: conversationHistory,
        topic: serviceIntent || inferredTopic
      });
      const structuredFallbackReply = buildStructuredAssistantReply({
        assistantType: normalizedAssistantType,
        lowerMessage,
        topic: serviceIntent || inferredTopic,
        plainReply: response,
        memory: conversationMemory,
        style: responseStyle,
        selectedMode: mode,
          history: conversationHistory,
      });

      return sendChatReply(structuredFallbackReply, 'thinking');
    }
  } catch (error) {
    console.error('❌ Error in chat endpoint:', error);
    if (emitStream) {
      emitStream({
        type: 'complete',
        success: false,
        error: 'Internal server error',
        message: 'Sorry, I encountered an error. Please try again later.',
      });
      res.end();
      return;
    }

    res.status(500).json({
      success: false, 
      error: 'Internal server error',
      message: 'Sorry, I encountered an error. Please try again later.' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Alpha Freight AI Backend Server is running!`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`🔐 Auth required: ${AI_REQUIRE_AUTH ? 'yes' : 'no (dev mode)'}`);
  console.log(`🤖 Ollama URL: ${OLLAMA_URL}`);
  console.log(`🧠 Model: ${MODEL_NAME}`);
  console.log(`\n`);

  ensureLocalVectorIndex().catch((error) => {
    console.warn('⚠️ Background vector warmup skipped:', error.message);
  });

  ensureSupabaseVectorRpcCheck()
    .then((available) => {
      if (available) {
        console.log(`✅ Supabase vector RPC "${SUPABASE_VECTOR_RPC}" verified`);
      } else if (supabase) {
        console.warn(`⚠️ Supabase vector RPC "${SUPABASE_VECTOR_RPC}" check failed: ${supabaseVectorRpcError}`);
      }
    })
    .catch((error) => {
      console.warn(`⚠️ Supabase vector RPC verification skipped: ${error.message}`);
    });
});
