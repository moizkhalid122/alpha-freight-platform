const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const AI_REQUIRE_AUTH = process.env.AI_REQUIRE_AUTH === 'true';
const AI_RATE_LIMIT = Number(process.env.AI_RATE_LIMIT || 40);
const AI_RATE_WINDOW_MS = Number(process.env.AI_RATE_WINDOW_MS || 60_000);

const rateLimitBuckets = new Map();

function isRateLimited(userId) {
  if (!userId || AI_RATE_LIMIT <= 0) {
    return false;
  }

  const now = Date.now();
  const bucket = rateLimitBuckets.get(userId) || {
    count: 0,
    resetAt: now + AI_RATE_WINDOW_MS,
  };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + AI_RATE_WINDOW_MS;
  }

  bucket.count += 1;
  rateLimitBuckets.set(userId, bucket);

  return bucket.count > AI_RATE_LIMIT;
}

async function requireSupabaseAuth(req, res, next) {
  if (!AI_REQUIRE_AUTH) {
    return next();
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(503).json({
      success: false,
      error: 'Auth is enabled but Supabase is not configured',
      message: 'AI auth is misconfigured on the server.',
    });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Login required to use AI assistant.',
    });
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired session. Please log in again.',
    });
  }

  if (isRateLimited(user.id)) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Too many AI requests. Please wait a minute and try again.',
    });
  }

  req.user = user;
  req.authToken = token;
  return next();
}

module.exports = {
  requireSupabaseAuth,
  AI_REQUIRE_AUTH,
};
