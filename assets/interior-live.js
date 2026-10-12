(function () {
  const root = document.getElementById('rkn-interior-content');
  if (!root) return;
  let version = null, fetching = false, cleanup = null;
  async function update() {
    if (fetching || document.visibilityState === 'hidden') return;
    fetching = true;
    try {
      const response = await fetch('/api/interior', { cache: 'no-store', signal: AbortSignal.timeout(4500) });
      if (!response.ok) throw new Error('Content service unavailable');
      const snapshot = await response.json();
      if (!Array.isArray(snapshot.sections) || !Array.isArray(snapshot.products)) throw new Error('Invalid content response');
      if (snapshot.version !== version) {
        cleanup?.(); cleanup = window.RknInterior.render(root, snapshot); version = snapshot.version;
      }
    } catch (_) {
      if (version === null) {
        const message = document.createElement('div'); message.className = 'cms-service-status'; message.setAttribute('role', 'status'); message.textContent = 'Our interior collection is temporarily unavailable. You can still discuss your project with RKN.';
        const link = document.createElement('a'); link.href = '#int-enquire'; link.textContent = 'Request a consultation'; message.append(link); root.replaceChildren(message);
      }
    } finally { fetching = false; }
  }
  update(); const timer = setInterval(update, 3000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') update(); });
  window.addEventListener('pagehide', () => { clearInterval(timer); cleanup?.(); }, { once: true });
})();
