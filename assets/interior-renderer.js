(function (scope) {
  'use strict';
  function node(tag, cls, text) {
    const element = document.createElement(tag);
    if (cls) element.className = cls;
    if (text !== undefined) element.textContent = String(text);
    return element;
  }
  function safeLink(value) {
    if (typeof value !== 'string' || /[\u0000-\u0020\\]/.test(value)) return '#int-enquire';
    if (/^#[a-zA-Z0-9_-]+$/.test(value) || /^\/(?!\/)[a-zA-Z0-9/_?.=&%#-]*$/.test(value)) return value;
    try { if (new URL(value).protocol === 'https:') return value; } catch (_) {}
    return '#int-enquire';
  }
  function price(product) {
    if (product.priceMode === 'contact' || product.price == null) return 'Contact for price';
    const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
    if (product.priceMode === 'starting') return 'From ' + money(product.price);
    if (product.priceMode === 'range') return money(product.price) + ' – ' + money(product.priceMax);
    return money(product.price);
  }
  function render(root, snapshot, options) {
    options = options || {};
    const url = options.mediaUrl || ((id, variant) => '/api/interior-media?id=' + encodeURIComponent(id) + '&variant=' + variant);
    const products = new Map((snapshot.products || []).map(p => [p.id, p]));
    const categories = new Map((snapshot.categories || []).map(c => [c.id, c]));
    const image = (id, alt, variant, priority) => {
      const media = snapshot.media && snapshot.media[id];
      if (!media) return node('div', 'cms-image-placeholder', 'RKN Interior');
      const img = node('img', 'cms-image');
      img.src = url(id, variant || 'full'); img.alt = alt || media.alt || '';
      img.loading = priority ? 'eager' : 'lazy'; img.decoding = 'async';
      if (priority) img.fetchPriority = 'high';
      if (media.width && media.height) { img.width = media.width; img.height = media.height; }
      return img;
    };
    const enquire = product => {
      if (options.preview) return;
      const notes = document.querySelector('#int-form textarea[name="notes"]');
      if (notes) notes.value = 'Interested in: ' + (product.sku ? product.sku + ' — ' : '') + product.title + '. ' + (notes.value || '');
      const select = document.querySelector('#int-form select[name="interest"]');
      if (select) { const label = categories.get(product.categoryId)?.title || ''; select.value = /mirror/i.test(label) ? 'mirror' : /mosaic/i.test(label) ? 'mosaic' : 'wallpaper'; }
      document.querySelector('#int-enquire')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    };
    let activeDialog = null;
    function details(product, trigger) {
      if (activeDialog) activeDialog.remove();
      const dialog = node('dialog', 'cms-dialog'); activeDialog = dialog;
      dialog.setAttribute('aria-label', product.title);
      const close = node('button', 'cms-dialog-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close design');
      const dismiss = () => { dialog.close(); dialog.remove(); activeDialog = null; trigger?.focus(); };
      close.onclick = dismiss;
      const visual = node('div', 'cms-detail-visual');
      const gallery = [{ mediaId: product.coverMediaId, alt: product.title }, ...(product.gallery || []).filter(g => g.mediaId !== product.coverMediaId)].filter(g => g.mediaId);
      let index = 0;
      const photo = node('div', 'cms-detail-photo');
      const count = node('span', 'cms-gallery-count');
      function update() { photo.replaceChildren(image(gallery[index]?.mediaId, gallery[index]?.alt)); count.textContent = (index + 1) + ' / ' + gallery.length; }
      update(); visual.append(photo);
      if (gallery.length > 1) {
        const nav = node('div', 'cms-gallery-nav');
        const previous = node('button', '', '←'), next = node('button', '', '→'); previous.type = next.type = 'button';
        previous.setAttribute('aria-label', 'Previous image'); next.setAttribute('aria-label', 'Next image');
        previous.onclick = () => { index = (index + gallery.length - 1) % gallery.length; update(); };
        next.onclick = () => { index = (index + 1) % gallery.length; update(); };
        nav.append(previous, count, next); visual.append(nav);
      }
      const body = node('div', 'cms-detail-body');
      body.append(node('p', 'cms-eyebrow', categories.get(product.categoryId)?.title || 'The RKN collection'), node('h2', 'cms-detail-title', product.title));
      if (product.sku) body.append(node('p', 'cms-sku', product.sku));
      body.append(node('p', 'cms-description', product.description), node('p', 'cms-price', price(product)));
      const specs = node('dl', 'cms-specs');
      for (const [key, value] of Object.entries({ Material: product.material, Dimensions: product.dimensions, Color: product.color, Finish: product.finish, ...(product.specifications || {}) })) {
        if (value) { specs.append(node('dt', '', key), node('dd', '', value)); }
      }
      body.append(specs);
      const contact = node('button', 'cms-link cms-link-dark', product.ctaLabel || 'Enquire about this design'); contact.type = 'button';
      contact.onclick = () => { dismiss(); enquire(product); }; body.append(contact);
      dialog.append(close, visual, body);
      dialog.onclick = event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dismiss(); } };
      dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
      root.append(dialog); dialog.showModal(); close.focus();
    }
    const card = (product, featured) => {
      const button = node('button', 'cms-product' + (featured ? ' cms-product-featured' : '')); button.type = 'button'; button.dataset.categoryId = product.categoryId || ''; button.setAttribute('aria-label', 'View ' + product.title);
      const frame = node('div', 'cms-product-frame'); frame.append(image(product.coverMediaId, product.title));
      const text = node('div', 'cms-product-meta');
      text.append(node('span', 'cms-product-category', categories.get(product.categoryId)?.title || 'RKN Interior'), node('h3', '', product.title), node('span', 'cms-product-price', price(product)));
      const arrow = node('span', 'cms-product-arrow', '↗'); arrow.setAttribute('aria-hidden', 'true'); text.append(arrow);
      button.append(frame, text); button.onclick = () => details(product, button); return button;
    };
    function intro(data, sectionIndex) {
      const heading = node('div', 'cms-section-heading');
      if (data.subtitle) heading.append(node('p', 'cms-eyebrow', data.subtitle));
      else if (sectionIndex !== undefined) heading.append(node('p', 'cms-eyebrow', 'The collection / ' + String(sectionIndex + 1).padStart(2, '0')));
      if (data.title) heading.append(node('h2', 'cms-title', data.title));
      if (data.description) heading.append(node('p', 'cms-description', data.description));
      return heading;
    }
    function block(data) {
      const wrapper = node('div', 'cms-block cms-block-' + data.layout);
      const assigned = Array.from(products.values()).filter(p => (p.blockIds || []).includes(data.id)).map(p => p.id);
      const selected = [...new Set([...(data.productIds || []), ...assigned])].map(id => products.get(id)).filter(Boolean);
      if (data.layout === 'category_grid') {
        const grid = node('div', 'cms-categories');
        for (const category of categories.values()) {
          const entry = node('button', 'cms-category'); entry.type = 'button';
          if (category.coverMediaId) entry.append(image(category.coverMediaId, category.title, 'thumb'));
          entry.append(node('span', '', category.title), node('span', 'cms-category-arrow', '↗'));
          entry.onclick = () => { root.querySelectorAll('.cms-filter').forEach(control => { if (control.dataset.category === category.id) control.click(); }); const target = Array.from(root.querySelectorAll('.cms-product')).find(product => product.dataset.categoryId === category.id); (target?.closest('.cms-section') || root.querySelector('.cms-block-product_grid'))?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
          grid.append(entry);
        }
        wrapper.append(grid); return wrapper;
      }
      if (data.layout === 'hero') {
        const hero = node('div', 'cms-hero');
        const text = node('div', 'cms-hero-text'); text.append(node('p', 'cms-eyebrow', data.subtitle || 'RKN Interior / Surface library'), node('h1', 'cms-hero-title', data.title), node('p', 'cms-description', data.description));
        const link = node('a', 'cms-link cms-link-dark', data.ctaLabel || 'Explore the collection'); link.href = safeLink(data.ctaUrl); text.append(link);
        const footer = node('div', 'cms-hero-caption'); footer.append(node('span', '', 'Material. Finish. Atmosphere.'), node('span', '', 'Curated by RKN')); text.append(footer);
        const visual = node('div', 'cms-hero-visual'); visual.append(image(data.coverMediaId, data.title, 'full', true));
        const label = node('span', 'cms-hero-image-note', 'A new chapter for your walls'); visual.append(label); hero.append(text, visual); wrapper.append(hero); return wrapper;
      }
      if (data.layout === 'banner') {
        const banner = node('div', 'cms-banner'); banner.append(image(data.coverMediaId, data.title)); banner.append(intro(data)); wrapper.append(banner); return wrapper;
      }
      if (data.layout === 'cta') {
        wrapper.append(intro(data)); const link = node('a', 'cms-link', data.ctaLabel || 'Discuss your project'); link.href = safeLink(data.ctaUrl); wrapper.append(link); return wrapper;
      }
      if (data.layout === 'split') {
        const item = selected[0] || data;
        const split = node('div', 'cms-split'); const visual = node('div', 'cms-split-visual'); visual.append(image(item.coverMediaId, item.title));
        const text = intro(item); const link = node('button', 'cms-link cms-link-dark', 'Explore the design'); link.type = 'button'; link.onclick = () => selected[0] ? details(selected[0], link) : enquire(item); text.append(link);
        split.append(visual, text); wrapper.append(split);
        if (selected.length > 1) { const grid = node('div', 'cms-grid'); selected.slice(1).forEach(p => grid.append(card(p))); wrapper.append(grid); }
        return wrapper;
      }
      if (data.layout === 'image_gallery') {
        if (data.title && data.showHeading !== false) wrapper.append(intro(data));
        const grid = node('div', 'cms-gallery');
        (data.gallery || []).forEach((entry, index) => { const figure = node('figure', index === 0 ? 'cms-gallery-large' : ''); figure.append(image(entry.mediaId, entry.alt)); if (entry.alt) figure.append(node('figcaption', '', entry.alt)); grid.append(figure); }); wrapper.append(grid); return wrapper;
      }
      if (data.title && data.showHeading !== false) wrapper.append(intro(data));
      const grid = node('div', 'cms-grid' + (data.layout === 'featured_collection' ? ' cms-featured-grid' : ''));
      const draw = category => { grid.replaceChildren(); const list = selected.filter(p => !category || p.categoryId === category); list.forEach(p => grid.append(card(p, data.layout === 'featured_collection'))); if (!list.length) grid.append(node('p', 'cms-empty', 'New designs will appear here soon.')); };
      if (data.layout === 'product_grid' && selected.length > 3) {
        const filters = node('div', 'cms-filters'); filters.setAttribute('role', 'group'); filters.setAttribute('aria-label', 'Filter designs by category');
        const choices = [['', 'All designs'], ...Array.from(categories.values()).filter(c => selected.some(p => p.categoryId === c.id)).map(c => [c.id, c.title])];
        choices.forEach(([id, title]) => { const button = node('button', 'cms-filter' + (!id ? ' selected' : ''), title); button.type = 'button'; button.dataset.category = id; button.setAttribute('aria-pressed', id ? 'false' : 'true'); button.onclick = () => { filters.querySelectorAll('button').forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', b === button ? 'true' : 'false'); }); draw(id); }; filters.append(button); }); wrapper.append(filters);
      }
      draw(''); wrapper.append(grid); return wrapper;
    }
    const content = node('div', 'cms-page');
    (snapshot.sections || []).forEach((section, index) => {
      const element = node('section', 'cms-section cms-theme-' + (['ivory', 'sand', 'dark'].includes(section.theme) ? section.theme : 'ivory'));
      element.id = 'cms-' + section.slug;
      const blocks = (snapshot.blocks || []).filter(b => b.sectionId === section.id);
      const hero = blocks.some(b => b.layout === 'hero' || b.layout === 'banner');
      if (!hero && section.title) element.append(intro(section, index));
      blocks.forEach(b => element.append(block(b))); content.append(element);
    });
    if (!content.children.length) content.append(node('div', 'cms-empty', 'Our interior collection is being updated. Please contact RKN for a consultation.'));
    root.replaceChildren(content);
    return () => { activeDialog?.remove(); activeDialog = null; };
  }
  scope.RknInterior = { render, safeLink, price };
})(typeof window !== 'undefined' ? window : globalThis);
