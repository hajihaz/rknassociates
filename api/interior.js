module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return res.status(503).json({ error: 'Interior service is awaiting setup' });
  try {
    const upstream = await fetch(url + '/rest/v1/interior_publication?id=eq.1&select=snapshot', { headers: { apikey: key }, cache: 'no-store', signal: AbortSignal.timeout(4000) });
    if (!upstream.ok) throw new Error('content_unavailable');
    const rows = await upstream.json(); if (!rows[0]?.snapshot) throw new Error('content_missing');
    return res.status(200).json(rows[0].snapshot);
  } catch (_) { return res.status(503).json({ error: 'Interior collection is temporarily unavailable' }); }
};
