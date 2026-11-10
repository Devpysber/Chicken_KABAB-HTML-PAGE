/* =========================================================
   The Best Chicken Kabab Corner — app logic
   Menu tabs, cart, mobile drawer and WhatsApp checkout.
   Depends on config.js (SITE, IMAGES) and menu-data.js (CATEGORIES, MENU).
   ========================================================= */

(function () {
  'use strict';

  /* ---------- Helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const formatPrice = (n) => '₹' + Number(n).toLocaleString('en-IN');
  const PORTION_LABEL = { half: 'Half', full: 'Full' };

  const escapeHTML = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;

  const ALL_ITEMS = Object.values(MENU).flat();

  // "All" tab shows every category in one list; the rest come from menu-data.js
  const TABS = [{ id: 'all', label: 'All' }, ...CATEGORIES];
  const tabCount = (id) => (id === 'all' ? ALL_ITEMS.length : MENU[id].length);
  const findItem = (id) => ALL_ITEMS.find((i) => i.id === id);

  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Re-trigger a CSS animation class on an element
  const restartClass = (el, cls) => {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };

  /* ---------- State ---------- */
  const STORAGE_KEY = 'bkc-cart-v1';
  let cart = loadCart(); // [{ key, id, portion, qty }]
  let activeCategory = TABS[0].id;
  const rowState = {}; // item id -> { portion, qty }
  let newLineKey = null; // cart line to highlight on next render

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!Array.isArray(saved)) return [];
      // Drop anything no longer on the menu
      return saved.filter((l) => findItem(l.id) && PORTION_LABEL[l.portion] && l.qty > 0);
    } catch (e) {
      return [];
    }
  }

  function saveCart() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) { /* storage unavailable */ }
  }

  // Prices always come from the menu data, so edits there apply to saved carts too.
  const linePrice = (line) => findItem(line.id)[line.portion];
  const totalQty = () => cart.reduce((s, l) => s + l.qty, 0);
  const subtotal = () => cart.reduce((s, l) => s + l.qty * linePrice(l), 0);

  /* ---------- Cart actions ---------- */
  function addToCart(id, portion, qty) {
    const key = `${id}:${portion}`;
    const existing = cart.find((l) => l.key === key);
    if (existing) existing.qty = Math.min(existing.qty + qty, 99);
    else cart.push({ key, id, portion, qty });
    newLineKey = key;
    commit();
    bumpBadge();
    const item = findItem(id);
    showToast(`${qty} × ${item.name} (${PORTION_LABEL[portion]}) added to cart`);
  }

  function changeQty(key, delta) {
    const line = cart.find((l) => l.key === key);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) cart = cart.filter((l) => l.key !== key);
    else line.qty = Math.min(line.qty, 99);
    commit();
  }

  function removeLine(key) {
    cart = cart.filter((l) => l.key !== key);
    commit();
  }

  function clearCart() {
    cart = [];
    commit();
  }

  function commit() {
    saveCart();
    renderCart();
  }

  /* ---------- Site details from config ---------- */
  function fillSiteDetails() {
    $$('[data-site]').forEach((el) => { el.textContent = SITE[el.dataset.site] || ''; });

    $$('[data-phones]').forEach((el) => {
      el.innerHTML = SITE.phones
        .map((p) => `<a href="tel:${p.replace(/\s+/g, '')}">${escapeHTML(p)}</a>`)
        .join('');
    });

    const waHref = `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(`Hi! I have a question about ${SITE.name}.`)}`;
    $$('[data-wa-link]').forEach((el) => { el.href = waHref; });

    const mapsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(SITE.mapsQuery)}`;
    $$('[data-maps-link]').forEach((el) => { el.href = mapsHref; });

    $('#mapFrame').src = `https://www.google.com/maps?q=${encodeURIComponent(SITE.mapsQuery)}&output=embed`;
    $('#heroImg').src = IMAGES.hero;
    // Absolute URL so the path resolves from the page, not from css/styles.css
    $('.hero').style.setProperty('--hero-bg', `url("${new URL(IMAGES.hero, document.baseURI).href}")`);
    $('#aboutImg').src = IMAGES.about;
    $('#year').textContent = new Date().getFullYear();

    // Social links: only render the ones that are actually configured
    const socials = Object.entries(SITE.social || {}).filter(([, url]) => url);
    $('#footerSocial').innerHTML = socials
      .map(([name, url]) =>
        `<a href="${escapeHTML(url)}" target="_blank" rel="noopener" aria-label="${name}">${icon(name)}</a>`)
      .join('');
  }

  /* ---------- Menu ---------- */
  function renderTabs() {
    $('#menuTabs').innerHTML = TABS.map((c) => `
      <button class="tab" type="button" role="tab" id="tab-${c.id}"
        aria-selected="${c.id === activeCategory}" aria-controls="menuPanel"
        tabindex="${c.id === activeCategory ? 0 : -1}" data-category="${c.id}">
        ${escapeHTML(c.label)}<span class="tab__count">(${tabCount(c.id)})</span>
      </button>`).join('');
    $('#menuPanel').setAttribute('aria-labelledby', `tab-${activeCategory}`);
  }

  function getRowState(id) {
    if (!rowState[id]) rowState[id] = { portion: 'half', qty: 1 };
    return rowState[id];
  }

  function menuItemHTML(item, isVeg, index) {
    const st = getRowState(item.id);
    return `
      <li class="menu-item" data-id="${item.id}" style="--i:${index}">
        <div class="menu-item__info">
          <h3 class="menu-item__name">
            <span class="diet ${isVeg ? 'diet--veg' : 'diet--nonveg'}" role="img"
              aria-label="${isVeg ? 'Vegetarian' : 'Non-vegetarian'}" title="${isVeg ? 'Vegetarian' : 'Non-vegetarian'}"></span>
            <span>${escapeHTML(item.name)}</span>
          </h3>
          <p class="menu-item__desc">${escapeHTML(item.desc || '')}</p>
          <p class="menu-item__incart" hidden></p>
        </div>
        <div class="menu-item__controls">
          <div class="portion" role="group" aria-label="Portion for ${escapeHTML(item.name)}">
            ${['half', 'full'].map((p) => `
              <button type="button" class="portion__opt" data-action="portion" data-portion="${p}"
                aria-pressed="${st.portion === p}" aria-label="${PORTION_LABEL[p]}, ${formatPrice(item[p])}">
                <small>${PORTION_LABEL[p]}</small><strong>${formatPrice(item[p])}</strong>
              </button>`).join('')}
          </div>
          <div class="order-ctl">
            <div class="qty" role="group" aria-label="Quantity">
              <button type="button" data-action="dec" aria-label="Decrease quantity" ${st.qty <= 1 ? 'disabled' : ''}>${icon('minus')}</button>
              <span class="qty__val" aria-live="polite">${st.qty}</span>
              <button type="button" data-action="inc" aria-label="Increase quantity" ${st.qty >= 20 ? 'disabled' : ''}>${icon('plus')}</button>
            </div>
            <button type="button" class="add-btn" data-action="add" aria-label="Add ${escapeHTML(item.name)} to cart">
              ${icon('plus')}<span>Add</span>
            </button>
          </div>
        </div>
      </li>`;
  }

  function renderMenu() {
    const isAll = activeCategory === 'all';
    const cat = TABS.find((c) => c.id === activeCategory);

    // Each entry: the dish, its category, and the sub-heading it sits under.
    // "All" uses the dish group (e.g. Tandoori Chicken) or else the category name.
    const entries = isAll
      ? CATEGORIES.flatMap((c) => MENU[c.id].map((item) => ({ item, cat: c, heading: item.group || c.label })))
      : MENU[activeCategory].map((item) => ({ item, cat, heading: item.group || null }));

    $('#menuHead').innerHTML = `
      <div>
        <h3 class="menu-list__title">${isAll ? 'Full Menu' : escapeHTML(cat.label)}</h3>
        <p class="menu-list__meta">${entries.length} dishes${cat.veg ? ' · 100% vegetarian' : ''}</p>
      </div>
      <p class="menu-list__hint">Choose <strong>Half</strong> or <strong>Full</strong>, set quantity, then tap <strong>Add</strong></p>`;

    // Insert a sub-heading whenever the heading changes
    let html = '';
    let lastHeading = null;
    let n = 0; // running index for the staggered entrance
    entries.forEach(({ item, cat: itemCat, heading }) => {
      if (heading && heading !== lastHeading) {
        const count = entries.filter((e) => e.heading === heading).length;
        html += `<li class="menu-group" role="presentation" style="--i:${Math.min(n++, 12)}"><span>${escapeHTML(heading)}</span><small>${count} item${count > 1 ? 's' : ''}</small></li>`;
        lastHeading = heading;
      }
      html += menuItemHTML(item, Boolean(itemCat.veg), Math.min(n++, 12));
    });
    $('#menuItems').innerHTML = html;
    updateInCart();
  }

  // Show "2 × Full in cart" under dishes that are already in the cart
  function updateInCart() {
    $$('#menuItems .menu-item').forEach((row) => {
      const lines = cart.filter((l) => l.id === row.dataset.id);
      const note = $('.menu-item__incart', row);
      row.classList.toggle('is-incart', lines.length > 0);
      note.hidden = !lines.length;
      note.innerHTML = lines.length
        ? `${icon('check')}<span>${lines.map((l) => `${l.qty} × ${PORTION_LABEL[l.portion]}`).join(' · ')} in cart</span>`
        : '';
    });
  }

  function updateRow(row, id) {
    const st = getRowState(id);
    $$('.portion__opt', row).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.portion === st.portion)));
    const val = $('.qty__val', row);
    if (val.textContent !== String(st.qty)) {
      val.textContent = st.qty;
      restartClass(val, 'tick');
    }
    $('[data-action="dec"]', row).disabled = st.qty <= 1;
    $('[data-action="inc"]', row).disabled = st.qty >= 20;
  }

  function setCategory(id, focus) {
    if (id === activeCategory) return;
    activeCategory = id;
    renderTabs();
    renderMenu();
    if (focus) $(`#tab-${id}`).focus();
  }

  function bindMenu() {
    $('#menuTabs').addEventListener('click', (e) => {
      const tab = e.target.closest('[data-category]');
      if (tab) setCategory(tab.dataset.category);
    });

    // Arrow-key navigation between tabs
    $('#menuTabs').addEventListener('keydown', (e) => {
      const idx = TABS.findIndex((c) => c.id === activeCategory);
      let next = null;
      if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length;
      if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = TABS.length - 1;
      if (next !== null) {
        e.preventDefault();
        setCategory(TABS[next].id, true);
      }
    });

    $('#menuItems').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const row = btn.closest('.menu-item');
      const id = row.dataset.id;
      const st = getRowState(id);

      switch (btn.dataset.action) {
        case 'portion': st.portion = btn.dataset.portion; break;
        case 'inc': st.qty = Math.min(st.qty + 1, 20); break;
        case 'dec': st.qty = Math.max(st.qty - 1, 1); break;
        case 'add':
          addToCart(id, st.portion, st.qty);
          st.qty = 1;
          flashAdded(btn);
          flyToCart(btn);
          break;
      }
      updateRow(row, id);
    });
  }

  /* A small dot arcs from the Add button to whichever cart is on screen */
  function flyToCart(fromEl) {
    const onScreen = (el) => {
      if (!el || el.hidden) return null;
      const r = el.getBoundingClientRect();
      return r.width && r.bottom > 0 && r.top < window.innerHeight ? r : null;
    };
    const targets = [$('.cart-panel .cart__title'), $('#cartFab'), $('#headerCartBtn')];
    let rect = null;
    for (const el of targets) { rect = onScreen(el); if (rect) break; }

    if (reducedMotion() || !rect || !fromEl.animate) { pulseCart(); return; }

    const a = fromEl.getBoundingClientRect();
    const x0 = a.left + a.width / 2;
    const y0 = a.top + a.height / 2;
    const dx = rect.left + Math.min(rect.width / 2, 40) - x0;
    const dy = rect.top + rect.height / 2 - y0;

    const dot = document.createElement('div');
    dot.className = 'fly-dot';
    dot.innerHTML = icon('plus');
    dot.style.left = `${x0}px`;
    dot.style.top = `${y0}px`;
    document.body.appendChild(dot);

    dot.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 90}px) scale(1.1)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.5)`, opacity: 0.3 },
    ], { duration: 700, easing: 'cubic-bezier(.4, 0, .6, 1)' }).onfinish = () => {
      dot.remove();
      pulseCart();
    };
  }

  function pulseCart() {
    restartClass(isDesktop() ? $('.cart-panel .cart') : $('#cartFab'), 'pulse');
    restartClass($('#headerCartBtn'), 'shake');
  }

  function flashAdded(btn) {
    btn.classList.add('is-added');
    btn.innerHTML = `${icon('check')}<span>Added</span>`;
    clearTimeout(btn._t);
    btn._t = setTimeout(() => {
      btn.classList.remove('is-added');
      btn.innerHTML = `${icon('plus')}<span>Add</span>`;
    }, 1300);
  }

  /* ---------- Cart rendering ---------- */
  function cartHTML() {
    const qty = totalQty();
    const head = `
      <div class="cart__head">
        <h2 class="cart__title">Your Order${qty ? `<small>${qty} item${qty > 1 ? 's' : ''}</small>` : ''}</h2>
        ${cart.length ? `<button type="button" class="link-btn" data-cart-action="clear">Clear cart</button>` : ''}
      </div>`;

    if (!cart.length) {
      return `<div class="cart">${head}
        <div class="cart__body">
          <div class="cart__empty">
            <span class="cart__empty-icon">${icon('cart')}</span>
            <h3>Your cart is empty</h3>
            <p>Choose a portion and tap <strong>Add</strong> on any dish to start your order.</p>
          </div>
        </div>
        <div class="cart__foot">
          <button type="button" class="btn btn--whatsapp btn--block" disabled>${icon('whatsapp')} Place Order on WhatsApp</button>
        </div>
      </div>`;
    }

    const lines = cart.map((l) => {
      const item = findItem(l.id);
      const price = linePrice(l);
      return `
        <li class="cart-line${l.key === newLineKey ? ' is-new' : ''}">
          <div class="cart-line__info">
            <div class="cart-line__name">${escapeHTML(item.name)}</div>
            <div class="cart-line__meta"><span class="chip">${PORTION_LABEL[l.portion]}</span>${formatPrice(price)} each</div>
          </div>
          <button type="button" class="icon-btn cart-line__remove" data-cart-action="remove" data-key="${l.key}"
            aria-label="Remove ${escapeHTML(item.name)} (${PORTION_LABEL[l.portion]})">${icon('trash')}</button>
          <div class="qty qty--sm" role="group" aria-label="Quantity of ${escapeHTML(item.name)}">
            <button type="button" data-cart-action="dec" data-key="${l.key}" aria-label="Decrease">${icon('minus')}</button>
            <span class="qty__val">${l.qty}</span>
            <button type="button" data-cart-action="inc" data-key="${l.key}" aria-label="Increase" ${l.qty >= 99 ? 'disabled' : ''}>${icon('plus')}</button>
          </div>
          <div class="cart-line__total">${formatPrice(price * l.qty)}</div>
        </li>`;
    }).join('');

    return `<div class="cart">${head}
      <ul class="cart__body">${lines}</ul>
      <div class="cart__foot">
        <div class="cart__row"><span>Total quantity</span><span>${qty}</span></div>
        <div class="cart__row"><span>Subtotal</span><span>${formatPrice(subtotal())}</span></div>
        <div class="cart__row cart__row--total"><span>Total</span><span>${formatPrice(subtotal())}</span></div>
        <p class="cart__note">Delivery charges, if any, will be confirmed on WhatsApp.</p>
        <button type="button" class="btn btn--whatsapp btn--block" data-cart-action="checkout">${icon('whatsapp')} Place Order on WhatsApp</button>
      </div>
    </div>`;
  }

  function renderCart() {
    const html = cartHTML();
    $$('.cart-mount').forEach((m) => { m.innerHTML = html; });
    newLineKey = null;
    updateInCart();

    const qty = totalQty();
    const badge = $('#cartBadge');
    badge.textContent = qty > 99 ? '99+' : qty;
    badge.hidden = qty === 0;
    $('#headerCartBtn').setAttribute('aria-label', `Open cart, ${qty} item${qty === 1 ? '' : 's'}`);

    const fab = $('#cartFab');
    fab.hidden = qty === 0;
    document.body.classList.toggle('has-fab', qty > 0);
    $('#fabCount').textContent = qty;
    $('#fabTotal').textContent = formatPrice(subtotal());
    fab.setAttribute('aria-label', `View cart: ${qty} items, total ${formatPrice(subtotal())}`);
  }

  function bumpBadge() {
    restartClass($('#cartBadge'), 'bump');
  }

  function bindCart() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cart-action]');
      if (!btn) return;
      const key = btn.dataset.key;
      switch (btn.dataset.cartAction) {
        case 'inc': changeQty(key, 1); break;
        case 'dec': changeQty(key, -1); break;
        case 'remove': removeLine(key); break;
        case 'clear':
          if (confirm('Remove all items from your cart?')) clearCart();
          break;
        case 'checkout': openCheckout(); break;
      }
    });

    $('#headerCartBtn').addEventListener('click', () => {
      if (isDesktop()) {
        $('#menu').scrollIntoView({ behavior: 'smooth' });
      } else {
        openDrawer();
      }
    });
    $('#cartFab').addEventListener('click', openDrawer);
    $('#drawerOverlay').addEventListener('click', closeDrawer);
    $$('[data-close-drawer]').forEach((b) => b.addEventListener('click', closeDrawer));
  }

  /* ---------- Drawer ---------- */
  let lastFocus = null;

  function lockScroll() { document.body.classList.add('no-scroll'); }
  function unlockScroll() {
    if ($('#cartDrawer').hidden && $('#checkoutModal').hidden) document.body.classList.remove('no-scroll');
  }

  function openDrawer() {
    lastFocus = document.activeElement;
    $('#drawerOverlay').hidden = false;
    $('#cartDrawer').hidden = false;
    lockScroll();
    $('#cartDrawer .drawer__close').focus();
  }

  function closeDrawer() {
    $('#drawerOverlay').hidden = true;
    $('#cartDrawer').hidden = true;
    unlockScroll();
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  // Close the drawer if the viewport grows to desktop while it is open
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
    if (e.matches && !$('#cartDrawer').hidden) closeDrawer();
  });

  /* ---------- Checkout ---------- */
  const form = $('#detailsForm');
  let order = null;
  let lastWhatsAppUrl = '';

  function showStep(step) {
    $('#detailsForm').hidden = step !== 1;
    $('#summaryStep').hidden = step !== 2;
    $('#doneStep').hidden = step !== 3;
    const items = $$('#checkoutSteps li');
    items.forEach((li, i) => {
      li.classList.toggle('is-active', i + 1 === step);
      li.classList.toggle('is-done', i + 1 < step || step === 3);
    });
    $('#checkoutSteps').hidden = step === 3;
    $('#checkoutTitle').textContent = step === 3 ? 'Almost done!' : 'Checkout';
  }

  function openCheckout() {
    if (!cart.length) {
      showToast('Your cart is empty. Add a dish first.');
      return;
    }
    if (!$('#cartDrawer').hidden) {
      $('#drawerOverlay').hidden = true;
      $('#cartDrawer').hidden = true;
    } else {
      lastFocus = document.activeElement;
    }
    clearErrors();
    showStep(1);
    $('#modalOverlay').hidden = false;
    $('#checkoutModal').hidden = false;
    lockScroll();
    setTimeout(() => $('#custName').focus(), 50);
  }

  function closeCheckout() {
    $('#modalOverlay').hidden = true;
    $('#checkoutModal').hidden = true;
    unlockScroll();
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  function setError(field, msg) {
    const input = form.elements[field];
    const wrap = input.closest('.field');
    $(`#err-${field}`).textContent = msg;
    wrap.classList.toggle('has-error', Boolean(msg));
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) input.setAttribute('aria-describedby', `err-${field}`);
  }

  function clearErrors() {
    ['name', 'phone', 'address'].forEach((f) => setError(f, ''));
  }

  const normalisePhone = (raw) => {
    let digits = raw.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    return digits;
  };

  function validate() {
    clearErrors();
    const name = form.elements.name.value.trim();
    const phone = normalisePhone(form.elements.phone.value);
    const address = form.elements.address.value.trim();
    const note = form.elements.note.value.trim();
    let firstInvalid = null;

    if (name.length < 2) {
      setError('name', 'Please enter your name.');
      firstInvalid = firstInvalid || 'name';
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('phone', 'Please enter a valid 10-digit mobile number.');
      firstInvalid = firstInvalid || 'phone';
    }
    if (!address) {
      setError('address', 'Please enter your address.');
      firstInvalid = firstInvalid || 'address';
    }
    if (firstInvalid) {
      form.elements[firstInvalid].focus();
      return null;
    }
    return { name, phone, address, note };
  }

  function renderSummary() {
    const items = cart.map((l) => {
      const item = findItem(l.id);
      return `<li>
        <span><span class="chip">${PORTION_LABEL[l.portion]}</span>${escapeHTML(item.name)} × ${l.qty}</span>
        <strong>${formatPrice(linePrice(l) * l.qty)}</strong>
      </li>`;
    }).join('');

    $('#orderSummary').innerHTML = `
      <div class="summary__block">
        <p class="summary__label">Customer</p>
        <dl>
          <dt>Name</dt><dd>${escapeHTML(order.name)}</dd>
          <dt>Mobile</dt><dd>+91 ${order.phone}</dd>
          <dt>Address</dt><dd>${escapeHTML(order.address)}</dd>
          ${order.note ? `<dt>Note</dt><dd>${escapeHTML(order.note)}</dd>` : ''}
        </dl>
      </div>
      <div class="summary__block">
        <p class="summary__label">Items (${totalQty()})</p>
        <ul class="summary__items">${items}</ul>
      </div>
      <div class="summary__total"><span>Total</span><span>${formatPrice(subtotal())}</span></div>`;
  }

  function buildWhatsAppMessage() {
    const lines = cart.map((l, i) => {
      const item = findItem(l.id);
      return `${i + 1}. ${item.name} (${PORTION_LABEL[l.portion]}) x ${l.qty} = ${formatPrice(linePrice(l) * l.qty)}`;
    });

    const parts = [
      `*New Order – ${SITE.name}*`,
      '',
      `*Name:* ${order.name}`,
      `*Mobile:* +91 ${order.phone}`,
      `*Address:* ${order.address}`,
    ];
    parts.push('', '*Items:*', ...lines, '');
    parts.push(`*Total Quantity:* ${totalQty()}`);
    parts.push(`*Total Amount:* ${formatPrice(subtotal())}`);
    if (order.note) parts.push('', `*Instructions:* ${order.note}`);
    parts.push('', 'Please confirm my order. Thank you!');
    return parts.join('\n');
  }

  function bindCheckout() {
    // Clear an error as soon as the user edits that field
    ['name', 'phone', 'address'].forEach((f) =>
      form.elements[f].addEventListener('input', () => {
        if (form.elements[f].closest('.field').classList.contains('has-error')) setError(f, '');
      }));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = validate();
      if (!data) return;
      order = data;
      renderSummary();
      showStep(2);
      $('#sendWhatsApp').focus();
    });

    $('#backToDetails').addEventListener('click', () => {
      showStep(1);
      $('#custName').focus();
    });

    $('#sendWhatsApp').addEventListener('click', () => {
      if (!cart.length || !order) return;
      lastWhatsAppUrl = `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(buildWhatsAppMessage())}`;
      $('#waRetry').href = lastWhatsAppUrl;
      window.open(lastWhatsAppUrl, '_blank', 'noopener');
      showStep(3);
    });

    $('#finishOrder').addEventListener('click', () => {
      clearCart();
      form.reset();
      order = null;
      closeCheckout();
      showToast('Thank you! We will confirm your order on WhatsApp.');
    });

    $('#modalOverlay').addEventListener('click', closeCheckout);
    $$('[data-close-modal]').forEach((b) => b.addEventListener('click', closeCheckout));
  }

  /* ---------- Focus trap + Escape for dialogs ---------- */
  document.addEventListener('keydown', (e) => {
    const dialog = !$('#checkoutModal').hidden ? $('#checkoutModal')
      : !$('#cartDrawer').hidden ? $('#cartDrawer') : null;
    if (!dialog) {
      if (e.key === 'Escape') closeNav();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      dialog.id === 'checkoutModal' ? closeCheckout() : closeDrawer();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = $$('button:not([disabled]), a[href], input, textarea, [tabindex]:not([tabindex="-1"])', dialog)
        .filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Toast ---------- */
  let toastTimer;
  function showToast(msg) {
    const t = $('#toast');
    t.innerHTML = `${icon('check')}<span>${escapeHTML(msg)}</span>`;
    t.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2200);
  }

  /* ---------- Header: sticky state, mobile nav, active link ---------- */
  function closeNav() {
    $('#nav').classList.remove('is-open');
    $('#menuToggle').setAttribute('aria-expanded', 'false');
    $('#menuToggle').setAttribute('aria-label', 'Open navigation');
    $('#menuToggle use').setAttribute('href', '#i-menu');
  }

  function bindHeader() {
    const header = $('#header');
    const toTop = $('#toTop');
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      toTop.classList.toggle('is-visible', window.scrollY > 700);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }));

    $('#menuToggle').addEventListener('click', () => {
      const open = !$('#nav').classList.contains('is-open');
      $('#nav').classList.toggle('is-open', open);
      $('#menuToggle').setAttribute('aria-expanded', String(open));
      $('#menuToggle').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      $('#menuToggle use').setAttribute('href', open ? '#i-close' : '#i-menu');
    });

    // Close mobile nav after choosing a link or tapping outside
    document.addEventListener('click', (e) => {
      if (e.target.closest('a[href^="#"]')) closeNav();
      else if (!e.target.closest('#nav') && !e.target.closest('#menuToggle')) closeNav();
    });

    // Highlight the nav link of the section in view
    const links = $$('.nav__link');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.toggle('is-active', l.dataset.section === entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((l) => {
      const section = document.getElementById(l.dataset.section);
      if (section) observer.observe(section);
    });
  }

  /* ---------- Reveal sections as they scroll into view ---------- */
  function initReveal() {
    let pending = $$('[data-reveal]');
    const show = (el) => {
      el.classList.add('is-visible');
      pending = pending.filter((p) => p !== el);
    };

    // Fallback check based on scroll position, so content can never stay hidden
    // (covers browsers without IntersectionObserver or with delayed callbacks).
    let timer = null;
    const check = () => {
      timer = null;
      const limit = window.innerHeight * 0.95;
      pending.slice().forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < limit && r.bottom > 0) show(el);
        else if (r.bottom <= 0) show(el); // already scrolled past (e.g. jumped via a link)
      });
    };
    const schedule = () => { if (!timer) timer = setTimeout(check, 80); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', check);
    check();

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          show(entry.target);
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      pending.forEach((el) => io.observe(el));
    }
  }

  /* ---------- Init ---------- */
  initReveal();
  fillSiteDetails();
  renderTabs();
  renderMenu();
  renderCart();
  bindHeader();
  bindMenu();
  bindCart();
  bindCheckout();
})();
