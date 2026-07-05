const TAVILY_API_URL = 'https://api.tavily.com/search';
const WEB_SEARCH_TIMEOUT_MS = 12000;

function normalizeMessage(message = '') {
  return String(message || '').trim().toLowerCase();
}

function isExternalWebQuestion(message = '', options = {}) {
  const normalized = normalizeMessage(message);
  if (!normalized || normalized.length < 4) {
    return false;
  }

  if (options.skipDirectCarrierData && options.isDirectCarrierDataQuestion?.(normalized)) {
    return false;
  }

  if (
    /^(hi|hello|hey|thanks?|thank you|ok(ay)?|assalam|salam)[.!?]?$/i.test(normalized)
  ) {
    return false;
  }

  const internalOnlyPatterns = [
    /\b(my wallet|wallet balance|my bids?|my loads?|available loads?|place a bid|post a load)\b/i,
    /\b(alpha freight app|how do i (?:bid|post|track|withdraw))\b/i,
    /\bwhat is (?:pod|proof of delivery|rpm)\b/i,
  ];

  if (internalOnlyPatterns.some((pattern) => pattern.test(normalized))) {
    return false;
  }

  const webSearchPatterns = [
    /\b(diesel|petrol|fuel|desial) (?:price|prices|cost|rate)\b/i,
    /\b(?:uk|british) (?:diesel|fuel|petrol|hgv)\b/i,
    /\b(today|current|latest|now|this week|right now)\b/i,
    /\b(news|closure|closed|traffic|delay|accident|weather|forecast)\b/i,
    /\b(m\d+|a\d+|motorway|highway|road)\b.*\b(closure|closed|traffic|delay|accident|works)\b/i,
    /\b(closure|closed|traffic|delay|accident|works)\b.*\b(m\d+|motorway|road|lane)\b/i,
    /\b(hgv|lorry|haulage|freight) (?:rules|regulations|law|limits|news)\b/i,
    /\b(weather|forecast)\b.*\b(london|manchester|birmingham|uk|england|scotland|wales)\b/i,
    /\b(london|manchester|birmingham|uk|england)\b.*\b(weather|forecast|temperature)\b/i,
    /\bsearch (?:the )?web\b/i,
    /\b(on the )?internet\b/i,
    /\b(live|real.?time)\b.*\b(update|status|price|news)\b/i,
  ];

  return webSearchPatterns.some((pattern) => pattern.test(normalized));
}

function buildWebSearchQuery(message = '') {
  const trimmed = String(message || '').trim();
  const normalized = trimmed.toLowerCase();

  if (/\b(diesel|fuel|petrol)\b/i.test(normalized) && !/\buk\b/i.test(normalized)) {
    return `${trimmed} UK haulage`;
  }

  if (/\b(m\d+|motorway)\b/i.test(normalized) && !/\buk\b/i.test(normalized)) {
    return `${trimmed} UK traffic`;
  }

  return trimmed;
}

function formatWebResultsForPrompt(searchPayload = {}) {
  const lines = [];

  if (searchPayload.answer) {
    lines.push(`Search summary: ${searchPayload.answer}`);
  }

  (searchPayload.results || []).forEach((result, index) => {
    lines.push(
      `[${index + 1}] ${result.title || 'Result'}\nURL: ${result.url || 'n/a'}\n${result.content || ''}`.trim()
    );
  });

  return lines.join('\n\n');
}

function pickStyleText(style, englishText, romanUrduText) {
  if (style === 'roman_urdu') {
    return romanUrduText;
  }
  return englishText;
}

function extractBulletPoints(text = '', limit = 5) {
  return String(text || '')
    .split('\n')
    .map((line) => line.replace(/^[-*•\d.)]+\s*/, '').trim())
    .filter((line) => line.length > 12)
    .slice(0, limit);
}

async function withTimeout(promise, timeoutMs = WEB_SEARCH_TIMEOUT_MS) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Web search timed out')), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function searchWeb(message, options = {}) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: 'missing_api_key',
      query: buildWebSearchQuery(message),
      answer: null,
      results: [],
    };
  }

  const query = buildWebSearchQuery(message);

  try {
    const response = await withTimeout(
      fetch(TAVILY_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: options.searchDepth || 'basic',
          max_results: options.maxResults || 3,
          include_answer: true,
        }),
      }),
      options.timeoutMs || WEB_SEARCH_TIMEOUT_MS
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        error: `tavily_http_${response.status}`,
        query,
        answer: null,
        results: [],
        details: errorText.slice(0, 240),
      };
    }

    const data = await response.json();
    return {
      ok: true,
      query,
      answer: data.answer || null,
      results: Array.isArray(data.results) ? data.results : [],
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'web_search_failed',
      query,
      answer: null,
      results: [],
    };
  }
}

async function synthesizeWebSearchReply({
  message,
  searchPayload,
  style = 'english',
  ollama = null,
  modelName = 'llama3.1',
}) {
  if (searchPayload.answer) {
    return searchPayload.answer.trim();
  }

  const formattedResults = formatWebResultsForPrompt(searchPayload);
  if (!formattedResults.trim()) {
    return null;
  }

  const shouldSynthesizeWithOllama =
    process.env.WEB_SEARCH_USE_OLLAMA === 'true' && Boolean(ollama);

  if (shouldSynthesizeWithOllama) {
    const prompt = `You are Alpha Freight AI, a helpful UK freight and haulage assistant.

Use ONLY the web search results below to answer the user's question.
- Be concise and practical for UK carriers and haulage operators.
- Mention key numbers, dates, or locations when the sources include them.
- If sources disagree or data is uncertain, say that clearly.
- Do not invent facts that are not supported by the search results.
- Reply in ${style === 'roman_urdu' ? 'Roman Urdu mixed with English freight terms' : 'clear English'}.
- Do not use markdown headings. Plain text only.

WEB SEARCH RESULTS:
${formattedResults}

USER QUESTION:
${message}

Answer:`;

    try {
      const response = await withTimeout(
        ollama.generate({
          model: modelName,
          prompt,
          stream: false,
          keep_alive: '15m',
          options: {
            temperature: 0.35,
            num_predict: 320,
            repeat_penalty: 1.1,
          },
        }),
        25000
      );

      const synthesized = String(response.response || '').trim();
      if (synthesized.length > 40) {
        return synthesized;
      }
    } catch {
      // Fall through to direct formatting.
    }
  }

  const topSnippets = (searchPayload.results || [])
    .slice(0, 3)
    .map((result) => `${result.title}: ${result.content}`)
    .join('\n\n');

  return topSnippets.trim() || null;
}

function buildWebSearchTopicTitle(message = '', lowerMessage = '') {
  const normalized = lowerMessage || normalizeMessage(message);

  if (/\b(diesel|desial|petrol|fuel)\b/i.test(normalized)) {
    return '⛽ UK Fuel Prices';
  }

  if (/\b(m\d+|motorway)\b/i.test(normalized)) {
    const motorway = normalized.match(/\bm\d+\b/i)?.[0]?.toUpperCase();
    if (/\b(closure|closed|traffic|delay|accident|works)\b/i.test(normalized)) {
      return motorway ? `🛣️ ${motorway} Traffic Update` : '🛣️ Motorway Traffic';
    }
    return motorway ? `🛣️ ${motorway} Update` : '🛣️ Motorway Update';
  }

  if (/\bweather|forecast|temperature\b/i.test(normalized)) {
    const city = normalized.match(/\b(london|manchester|birmingham|leeds|glasgow|liverpool|uk)\b/i)?.[0];
    if (city) {
      const label = city.toLowerCase() === 'uk' ? 'UK' : city.charAt(0).toUpperCase() + city.slice(1);
      return `🌤️ ${label} Weather`;
    }
    return '🌤️ Weather Update';
  }

  if (/\b(hgv|lorry|haulage)\b/i.test(normalized)) {
    return '📋 HGV & Haulage Update';
  }

  if (/\bnews\b/i.test(normalized)) {
    return '📰 Latest News';
  }

  const cleaned = String(message || '').trim();
  if (cleaned.length > 0 && cleaned.length <= 52) {
    const titled = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return `🔎 ${titled.replace(/\?$/, '')}`;
  }

  return '🔎 Live Update';
}

function buildWebSearchStructuredReply({
  message,
  lowerMessage,
  plainReply,
  searchPayload,
  style = 'english',
}) {
  const sourceTitles = (searchPayload.results || [])
    .slice(0, 3)
    .map((result) => result.title)
    .filter(Boolean);

  const nextStep = pickStyleText(
    style,
    sourceTitles.length
      ? `Sources checked: ${sourceTitles.join(' · ')}`
      : 'Ask a follow-up if you need a specific route, date, or location.',
    sourceTitles.length
      ? `Sources: ${sourceTitles.join(' · ')}`
      : 'Agar specific route, date ya location chahiye ho to follow-up bhej dein.'
  );

  const rawText = [plainReply, nextStep].filter(Boolean).join('\n\n');

  return {
    mode: 'logistics_copilot',
    displayStyle: 'plain',
    userIntent: 'Web Search',
    responseLength: 'medium',
    modeLabel: 'Logistics Copilot',
    assistantName: 'Alpha Freight Co-Pilot',
    confidence: searchPayload.ok ? 0.88 : 0.5,
    knowledgeSource: 'web_search',
    title: buildWebSearchTopicTitle(message, lowerMessage),
    shortExplanation: plainReply,
    keyPoints: [],
    recommendation: '',
    nextStep,
    metrics: [],
    sections: [],
    routePreview: null,
    quickActions: [],
    suggestedQuestions: [],
    platformIntent: null,
    actionRequest: null,
    memory: {
      activeTopic: 'web_search',
      lastResolvedTopic: 'web_search',
    },
    rawText,
    webSearch: {
      query: searchPayload.query,
      resultCount: (searchPayload.results || []).length,
      sources: (searchPayload.results || []).slice(0, 3).map((result) => ({
        title: result.title,
        url: result.url,
      })),
    },
  };
}

async function buildWebSearchAssistantReply({
  message,
  lowerMessage,
  style = 'english',
  ollama = null,
  modelName = 'llama3.1',
}) {
  const searchPayload = await searchWeb(message);

  if (!searchPayload.ok) {
    if (searchPayload.error === 'missing_api_key') {
      return buildWebSearchStructuredReply({
        message,
        lowerMessage,
        style,
        searchPayload,
        plainReply: pickStyleText(
          style,
          'Web search is not configured yet. Add TAVILY_API_KEY to the backend .env file and restart the server.',
          'Web search abhi configure nahi hua. Backend .env me TAVILY_API_KEY add karo aur server restart karo.'
        ),
      });
    }

    return buildWebSearchStructuredReply({
      message,
      lowerMessage,
      style,
      searchPayload,
      plainReply: pickStyleText(
        style,
        'I tried searching the web but could not fetch live results right now. Please try again in a moment.',
        'Main web search try kiya lekin abhi live results nahi mil sakay. Thori der baad dubara try karein.'
      ),
    });
  }

  const plainReply = await synthesizeWebSearchReply({
    message,
    searchPayload,
    style,
    ollama,
    modelName,
  });

  if (!plainReply) {
    return buildWebSearchStructuredReply({
      message,
      lowerMessage,
      style,
      searchPayload,
      plainReply: pickStyleText(
        style,
        'I searched the web but did not find a reliable answer for that question. Try adding a location, date, or motorway name.',
        'Main web search ki lekin is sawal ka reliable jawab nahi mila. Location, date ya motorway ka naam add karke dubara try karein.'
      ),
    });
  }

  return buildWebSearchStructuredReply({
    message,
    lowerMessage,
    style,
    searchPayload,
    plainReply,
  });
}

module.exports = {
  isExternalWebQuestion,
  searchWeb,
  buildWebSearchAssistantReply,
};
