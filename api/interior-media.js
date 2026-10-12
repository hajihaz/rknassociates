module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = req.query.id, variant = req.query.variant === 'thumb' ? 'thumb_path' : 'path';
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return res.status(404).json({ error: 'Image not found' });
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return res.status(503).json({ error: 'Interior service is awaiting setup' });
  const headers = { apikey: key };
  try {
    const content = await fetch(url + '/rest/v1/interior_publication?id=eq.1&select=snapshot', { headers, cache: 'no-store', signal: AbortSignal.timeout(4000) });
    if (!content.ok) throw new Error('content_unavailable');
    const rows = await content.json(); const media = rows[0]?.snapshot?.media?.[id];
    if (!media || !media[variant] || !/^[0-9a-f-]{36}\/(full|thumb)\.webp$/.test(media[variant])) return res.status(404).json({ error: 'Image not found' });
    // Storage RLS independently checks that this object is in the CURRENT publication.
    const file = await fetch(url + '/storage/v1/object/authenticated/rkn-interior/' + media[variant], { headers, cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!file.ok) return res.status(404).json({ error: 'Image not found' });
    res.setHeader('Content-Type', 'image/webp'); return res.status(200).send(Buffer.from(await file.arrayBuffer()));
  } catch (_) { return res.status(503).json({ error: 'Image temporarily unavailable' }); }
};
