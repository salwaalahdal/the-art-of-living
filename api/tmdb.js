// Vercel serverless proxy for the TMDB API.
// Keep TMDB_READ_ACCESS_TOKEN in Vercel Environment Variables. Never commit it.
const ALLOWED_PATHS = new Set([
  "/search/movie",
  "/movie/popular",
  "/trending/movie/week",
  "/genre/movie/list"
]);

module.exports = async function handler(req, res) {
  // FRONTEND_ORIGIN accepts one origin or a comma-separated allowlist.
  // Example: https://the-art-of-living-amber.vercel.app,https://salwaalahdal.github.io
  const configuredOrigins = (process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
  const requestOrigin = req.headers.origin;
  const originAllowed = !requestOrigin || configuredOrigins.length === 0 || configuredOrigins.includes(requestOrigin);

  if (!originAllowed) {
    return res.status(403).json({ error: "Origin not allowed." });
  }

  res.setHeader("Vary", "Origin");
  if (requestOrigin && (configuredOrigins.length === 0 || configuredOrigins.includes(requestOrigin))) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });

  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "TMDB_READ_ACCESS_TOKEN is missing from Vercel Environment Variables." });
  }

  const path = String(req.query.path || "");
  if (!ALLOWED_PATHS.has(path)) {
    return res.status(400).json({ error: "This TMDB endpoint is not allowed." });
  }

  const url = new URL(`https://api.themoviedb.org/3${path}`);
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== "path" && typeof value === "string") url.searchParams.set(key, value);
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });
    const body = await upstream.json();
    return res.status(upstream.status).json(body);
  } catch (error) {
    return res.status(502).json({ error: "Could not reach TMDB. Please try again." });
  }
};

