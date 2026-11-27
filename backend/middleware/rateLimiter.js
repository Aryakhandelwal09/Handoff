/**
 * Very simple in-memory rate limiter: N requests per IP per window.
 * Good enough for a solo/portfolio deployment. Resets if the server restarts —
 * fine for this scale, would need a shared store (e.g. Redis) for multi-instance deployments.
 */
function createRateLimiter({ windowMs = 60 * 60 * 1000, max = 5 } = {}) {
  const hits = new Map(); // ip -> array of timestamps

  return function rateLimiter(req, res, next) {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    const timestamps = (hits.get(ip) || []).filter(t => now - t < windowMs);
    if (timestamps.length >= max) {
      const retryAfterMs = windowMs - (now - timestamps[0]);
      return res.status(429).json({
        error: `Too many requests — please try again in about ${Math.ceil(retryAfterMs / 60000)} minute(s).`
      });
    }

    timestamps.push(now);
    hits.set(ip, timestamps);
    next();
  };
}

module.exports = { createRateLimiter };
