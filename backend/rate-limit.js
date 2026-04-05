const DEFAULT_WINDOW_MS = 60 * 1000;

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function createFixedWindowRateLimiter({ limit, windowMs }) {
  const buckets = new Map();

  function cleanup(now) {
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  return {
    take(key) {
      const now = Date.now();
      cleanup(now);

      let bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= now) {
        bucket = {
          count: 0,
          resetAt: now + windowMs
        };
      }

      bucket.count += 1;
      buckets.set(key, bucket);

      const remaining = Math.max(0, limit - bucket.count);
      const allowed = bucket.count <= limit;

      return {
        allowed,
        limit,
        remaining,
        resetAt: bucket.resetAt
      };
    }
  };
}

function createAnalyzeRateLimiters() {
  const imageUserLimitPerMinute = toPositiveInt(process.env.ANALYZE_RATE_LIMIT_PER_MINUTE, 5);
  const textUserLimitPerMinute = toPositiveInt(
    process.env.TEXT_ANALYZE_RATE_LIMIT_PER_MINUTE,
    10
  );
  const imageIpLimitPerMinute = toPositiveInt(process.env.ANALYZE_IP_RATE_LIMIT_PER_MINUTE, 20);
  const textIpLimitPerMinute = toPositiveInt(process.env.TEXT_ANALYZE_IP_RATE_LIMIT_PER_MINUTE, 40);
  const windowMs = toPositiveInt(process.env.ANALYZE_RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS);

  return {
    image: {
      user: createFixedWindowRateLimiter({ limit: imageUserLimitPerMinute, windowMs }),
      ip: createFixedWindowRateLimiter({ limit: imageIpLimitPerMinute, windowMs })
    },
    text: {
      user: createFixedWindowRateLimiter({ limit: textUserLimitPerMinute, windowMs }),
      ip: createFixedWindowRateLimiter({ limit: textIpLimitPerMinute, windowMs })
    }
  };
}

module.exports = {
  createAnalyzeRateLimiters
};
