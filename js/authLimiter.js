const authLimiter = async (req, res, next) => {
  const ip = req.ip;
  const authCounts =
    authLimiter.authCounts || (authLimiter.authCounts = new Map());
  const now = Date.now();
  const maxRequests = 5;
  const windowMs = 60 * 60 * 1000; // 60 minutes

  // Retrieve the current count or initialize it
  const count = authCounts.get(ip) || { requests: 0, timestamp: now };

  // Reset count if the time window has elapsed
  if (now - count.timestamp > windowMs) {
    count.requests = 0;
    count.timestamp = now;
  }

  if (count.requests >= maxRequests) {
    const retryAfter = Math.ceil((count.timestamp + windowMs - now) / 1000);
    res.set("Retry-After", retryAfter);
    return res.status(429).json({
      error: "Too many incorrect password attempts. Please try again later.",
    });
  }

  // Increment request count
  count.requests++;
  authCounts.set(ip, count);

  next();
};

// Reset authentication rate limiter
authLimiter.reset = (ip) => {
  if (authLimiter.authCounts) {
    authLimiter.authCounts.delete(ip);
  }
};

export default authLimiter;
