/* Порт 41 - общая логика: шапка, меню, поиск, корзина, избранное, рендер страниц. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = n => n.toLocaleString('ru-RU') + ' ₽';
  const IMG = 'assets/img/';
  const byId = id => P41.PRODUCTS.find(p => p.id === id);
  const catById = id => P41.CATS.find(c => c.id === id);
  const page = document.body.dataset.page || '';
  const qs = new URLSearchParams(location.search);

  /* ---------- Хранилище ---------- */
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  };
  let cart = store.get('p41_cart', {});   // { "id|opt": {id, opt, qty} }
  let fav = store.get('p41_fav', {});
  const saveCart = () => { store.set('p41_cart', cart); renderCounts(); };
  const saveFav = () => { store.set('p41_fav', fav); renderCounts(); };
  const cartKey = (id, opt) => opt ? id + '|' + opt : id;
  const cartCount = () => Object.values(cart).reduce((a, i) => a + i.qty, 0);
  const lineTotal = i => { const p = byId(i.id); if (!p) return 0; const mult = i.opt && p.opts ? (p.opts.find(o => o[0] === i.opt) || [0, 1])[1] : 1; return Math.round(p.price * mult) * i.qty; };
  const cartTotal = () => Object.values(cart).reduce((a, i) => a + lineTotal(i), 0);
  const qtyOf = (id) => Object.values(cart).filter(i => i.id === id).reduce((a, i) => a + i.qty, 0);

  function addToCart(id, opt, d = 1) {
    const k = cartKey(id, opt);
    const cur = cart[k] || { id, opt: opt || null, qty: 0 };
    cur.qty += d;
    if (cur.qty <= 0) delete cart[k]; else cart[k] = cur;
    saveCart();
    if (d > 0) toast('Добавлено в корзину', 'cart.html', 'Открыть');
    document.dispatchEvent(new CustomEvent('cart:change'));
  }
  function toggleFav(id) { fav[id] ? delete fav[id] : fav[id] = 1; saveFav(); document.dispatchEvent(new CustomEvent('fav:change')); }

  /* ---------- Иконки ---------- */
  const I = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-7-4.6-9.3-9A5.3 5.3 0 0 1 12 6a5.3 5.3 0 0 1 9.3 6c-2.3 4.4-9.3 9-9.3 9z"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 8h12l1 13H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    burger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
    taste: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 16 0v2H4z"/><path d="M2 14h20"/><path d="M12 4V2"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    snow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/></svg>'
  };
  const catLinks = () => P41.CATS.map(c => `<a href="catalog.html?cat=${c.id}">${c.name}</a>`).join('');
  const infoLinks = '<a href="about.html">О магазине</a><a href="delivery.html">Доставка и оплата</a><a href="wholesale.html">Оптовикам и HoReCa</a><a href="news.html">Новости</a><a href="contacts.html">Контакты</a>';

  /* ---------- Хром страницы ---------- */
  function mountChrome() {
    const top = document.createElement('div'); top.className = 'topline';
    top.innerHTML = `<div class="wrap"><span class="lead"><i class="dot"></i>Доставка по Москве в день заказа*</span><span>Дегустация перед покупкой</span><nav>${infoLinks}</nav><span class="soc"><a href="https://t.me/port41" target="_blank" rel="noopener">Telegram</a><a href="https://wa.me/79510404141" target="_blank" rel="noopener">WhatsApp</a></span></div>`;
    const head = document.createElement('header'); head.className = 'header';
    head.innerHTML = `<div class="wrap">
      <button class="icon-btn burger" aria-label="Меню" data-open="drawer">${I.burger}</button>
      <a class="brand" href="index.html"><img src="assets/mark-on-light.png" alt=""><span><b>ПОРТ 41</b><small>рыба и морепродукты</small></span></a>
      <nav class="main"><a class="cat-link" href="catalog.html">${I.burger}Каталог</a>${P41.CATS.slice(0, 5).map(c => `<a href="catalog.html?cat=${c.id}">${c.name}</a>`).join('')}<a href="catalog.html" style="color:var(--mute)">Ещё</a></nav>
      <div class="acts">
        <div class="phone"><a href="tel:${P41.PHONE_RAW}">${P41.PHONE}</a><span>${P41.HOURS}</span></div>
        <button class="icon-btn" aria-label="Поиск" data-open="search">${I.search}</button>
        <a class="icon-btn" href="favorites.html" aria-label="Избранное">${I.heart}<span class="badge-count" data-count="fav"></span></a>
        <a class="icon-btn" href="tel:${P41.PHONE_RAW}" aria-label="Позвонить" data-mobile-only>${I.phone}</a>
        <a class="btn coral cart-btn" href="cart.html">${I.cart}<span data-cart-label>Корзина</span><span class="badge-count" data-count="cart"></span></a>
      </div></div>`;
    const tab = document.createElement('nav'); tab.className = 'tabbar'; tab.setAttribute('aria-label', 'Основная навигация');
    tab.innerHTML = `<a href="index.html" data-tab="home">${I.home}Главная</a><a href="catalog.html" data-tab="catalog">${I.grid}Каталог</a><a href="#" data-open="search" data-tab="search">${I.search}Поиск</a><a href="favorites.html" data-tab="favorites">${I.heart}<span class="badge-count" data-count="fav"></span>Избранное</a><a href="cart.html" data-tab="cart">${I.cart}<span class="badge-count" data-count="cart"></span>Корзина</a>`;
    const ov = document.createElement('div'); ov.className = 'overlay'; ov.dataset.close = '1';
    const dr = document.createElement('aside'); dr.className = 'drawer';
    dr.innerHTML = `<div class="drawer-head"><a class="brand" href="index.html"><img src="assets/mark-on-light.png" alt=""><span><b>ПОРТ 41</b><small>рыба и морепродукты</small></span></a><button class="icon-btn" style="border:0" data-close="1" aria-label="Закрыть">${I.close}</button></div>
      <nav>${P41.CATS.map(c => `<a href="catalog.html?cat=${c.id}"><img src="${IMG}${c.img}" alt="">${c.name}</a>`).join('')}</nav>
      <nav class="sub">${infoLinks}</nav>
      <div class="drawer-foot"><a class="tel" href="tel:${P41.PHONE_RAW}">${P41.PHONE}</a><span class="mute" style="font-size:13px">${P41.HOURS}</span><div style="display:flex;gap:8px"><a class="btn white sm" href="https://t.me/port41" target="_blank" rel="noopener">Telegram</a><a class="btn white sm" href="https://wa.me/79510404141" target="_blank" rel="noopener">WhatsApp</a></div></div>`;
    const se = document.createElement('div'); se.className = 'search';
    se.innerHTML = `<div class="search-bar"><input type="search" placeholder="Икра, нерка, краб…" aria-label="Поиск по каталогу" autocomplete="off"><button class="icon-btn" style="border:0" data-close="1" aria-label="Закрыть">${I.close}</button></div><div class="search-res"><div class="empty">Начните вводить название - например, «нерка»</div></div>`;
    const ft = document.createElement('footer'); ft.className = 'footer';
    ft.innerHTML = `<div class="wrap"><div class="footer-grid">
      <div><img class="logo" src="assets/logo-on-light.png" alt="Порт 41"><p>Рыба и морепродукты с Дальнего Востока - в розницу, оптом и для HoReCa. Доставка по Москве и всей России.</p><div class="soc"><a href="https://t.me/port41" target="_blank" rel="noopener">Telegram</a><a href="https://wa.me/79510404141" target="_blank" rel="noopener">WhatsApp</a></div></div>
      <details><summary>Каталог</summary><div class="col">${catLinks()}</div></details>
      <details><summary>Покупателям</summary><div class="col">${infoLinks}</div></details>
      <div class="col"><div class="col-title">Контакты</div><a class="tel" href="tel:${P41.PHONE_RAW}">${P41.PHONE}</a><span>${P41.HOURS}</span><a href="mailto:${P41.EMAIL}">${P41.EMAIL}</a><span>${P41.ADDRESS}</span></div>
      </div><div class="copy"><span>© 2026 Порт 41 - интернет-магазин рыбы и морепродуктов</span><span>* Условия доставки в день заказа уточняйте у менеджера</span><a href="#">Политика конфиденциальности</a></div></div>`;
    const toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.id = 'toast';
    document.body.prepend(head); document.body.prepend(top);
    document.body.append(ft, tab, ov, dr, se, toastEl);
    // подсветка активной вкладки
    const map = { home: 'home', catalog: 'catalog', product: 'catalog', favorites: 'favorites', cart: 'cart' };
    const t = tab.querySelector(`[data-tab="${map[page]}"]`); if (t) t.classList.add('on');
    // открытие/закрытие
    document.addEventListener('click', e => {
      const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); open(o.dataset.open); return; }
      if (e.target.closest('[data-close]')) closeAll();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
    const inp = se.querySelector('input'); inp.addEventListener('input', () => search(inp.value, se.querySelector('.search-res')));
    function open(w) { closeAll(); document.body.classList.add('no-scroll'); ov.classList.add('open'); if (w === 'drawer') dr.classList.add('open'); if (w === 'search') { se.classList.add('open'); setTimeout(() => inp.focus(), 250); } }
    function closeAll() { document.body.classList.remove('no-scroll'); ov.classList.remove('open'); dr.classList.remove('open'); se.classList.remove('open'); }
    renderCounts();
  }
  function renderCounts() {
    const c = cartCount(), f = Object.keys(fav).length;
    $$('[data-count="cart"]').forEach(el => el.textContent = c || '');
    $$('[data-count="fav"]').forEach(el => el.textContent = f || '');
    $$('[data-cart-label]').forEach(el => el.textContent = c ? fmt(cartTotal()) : 'Корзина');
  }
  let toastT;
  function toast(msg, href, linkText) {
    const el = $('#toast'); if (!el) return;
    el.innerHTML = msg + (href ? ` <a href="${href}">${linkText}</a>` : '');
    el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
  }
  function search(q, box) {
    q = q.trim().toLowerCase();
    if (q.length < 2) { box.innerHTML = '<div class="empty">Начните вводить название - например, «нерка»</div>'; return; }
    const res = P41.PRODUCTS.filter(p => (p.name + ' ' + p.sub + ' ' + catById(p.cat).name).toLowerCase().includes(q));
    box.innerHTML = res.length ? res.map(p => `<a class="search-row" href="product.html?id=${p.id}"><img src="${IMG}${p.img}" alt=""><span><b>${p.name}</b><span>${p.sub}</span></span><span class="price">${fmt(p.price)}${p.unit}</span></a>`).join('') : '<div class="empty">Ничего не нашли. Попробуйте «икра» или «краб»</div>';
  }

  /* ---------- Карточка товара ---------- */
  function badges(p) {
    const b = [];
    if (p.tags.includes('hit')) b.push('<span class="badge">Хит</span>');
    if (p.tags.includes('new')) b.push('<span class="badge new">Новинка</span>');
    if (p.old) b.push(`<span class="badge sale">−${Math.round((1 - p.price / p.old) * 100)}%</span>`);
    return b.join('');
  }
  function cardHTML(p) {
    const q = qtyOf(p.id);
    const ctrl = p.opts
      ? `<a class="add-btn" href="product.html?id=${p.id}" aria-label="Выбрать фасовку">${I.plus}</a>`
      : q ? `<div class="qty"><button data-dec="${p.id}" aria-label="Убрать">−</button><span>${q}</span><button data-inc="${p.id}" aria-label="Добавить">+</button></div>`
        : `<button class="add-btn" data-inc="${p.id}" aria-label="В корзину">${I.plus}</button>`;
    return `<article class="pc" data-id="${p.id}">
      <a class="ph" href="product.html?id=${p.id}"><img src="${IMG}${p.img}" alt="${p.name}" loading="lazy"><div class="badges">${badges(p)}</div></a>
      <button class="fav${fav[p.id] ? ' on' : ''}" data-fav="${p.id}" aria-label="В избранное">${I.heart}</button>
      <div class="info"><a class="name" href="product.html?id=${p.id}">${p.name}</a><div class="sub">${p.sub}</div>
      <div class="foot"><div><div class="price">${fmt(p.price)}<small>${p.unit}</small></div>${p.old ? `<div class="old">${fmt(p.old)}</div>` : ''}</div>${ctrl}</div></div></article>`;
  }
  function renderGrid(el, list, emptyHTML) {
    el.innerHTML = list.length ? list.map(cardHTML).join('') : (emptyHTML || '<div class="empty-state" style="grid-column:1/-1"><h3>Пока пусто</h3>Загляните в каталог - там точно найдётся что-то вкусное.<br><br><a class="btn" href="catalog.html">В каталог</a></div>');
  }
  document.addEventListener('click', e => {
    const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]'), f = e.target.closest('[data-fav]');
    if (inc) { addToCart(inc.dataset.inc, null, 1); }
    if (dec) { addToCart(dec.dataset.dec, null, -1); }
    if (f) { toggleFav(f.dataset.fav); }
  });
  // перерисовка карточек в сетках при изменении
  document.addEventListener('cart:change', () => $$('.grid[data-live]').forEach(g => g.dispatchEvent(new Event('rerender'))));
  document.addEventListener('fav:change', () => { $$('[data-fav]').forEach(b => b.classList.toggle('on', !!fav[b.dataset.fav])); if (page === 'favorites') pageFavorites(); });

  /* ---------- Страницы ---------- */
  function pageHome() {
    const cats = $('#cats'); if (cats) cats.innerHTML = P41.CATS.map(c => `<a class="cat" href="catalog.html?cat=${c.id}"><div class="ph"><img src="${IMG}${c.img}" alt=""></div><b>${c.name}</b></a>`).join('');
    const grid = $('#hits'); let tab = 'hits';
    const draw = () => { const l = P41.PRODUCTS.filter(p => tab === 'new' ? p.tags.includes('new') : tab === 'sale' ? !!p.old : p.tags.includes('hit')).slice(0, 8); renderGrid(grid, l); };
    grid.addEventListener('rerender', draw); draw();
    $$('#hit-tabs button').forEach(b => b.addEventListener('click', () => { $$('#hit-tabs button').forEach(x => x.classList.remove('on')); b.classList.add('on'); tab = b.dataset.tab; draw(); }));
    const news = $('#news'); if (news) news.innerHTML = P41.NEWS.map((n, i) => `<a class="news-item" href="news.html#n${i}"><span><small>${n.date}</small><b>${n.title}</b></span>${I.ext}</a>`).join('');
    const hero = $('[data-hero-add]'); if (hero) hero.addEventListener('click', () => addToCart('ikra-gorbushi', null, 1));
  }
  function pageCatalog() {
    let cat = qs.get('cat') || 'all', sort = 'pop';
    const chips = $('#chips'), grid = $('#grid'), title = $('#cat-title'), lead = $('#cat-lead'), count = $('#count');
    const drawChips = () => chips.innerHTML = [`<a class="chip${cat === 'all' ? ' on' : ''}" href="catalog.html" data-cat="all">Все</a>`].concat(P41.CATS.map(c => `<a class="chip${cat === c.id ? ' on' : ''}" href="catalog.html?cat=${c.id}" data-cat="${c.id}">${c.name}</a>`)).join('');
    const draw = () => {
      let l = P41.PRODUCTS.filter(p => cat === 'all' || p.cat === cat);
      if (sort === 'asc') l = [...l].sort((a, b) => a.price - b.price);
      if (sort === 'desc') l = [...l].sort((a, b) => b.price - a.price);
      if (sort === 'new') l = [...l].sort((a, b) => b.tags.includes('new') - a.tags.includes('new'));
      if (sort === 'pop') l = [...l].sort((a, b) => b.tags.includes('hit') - a.tags.includes('hit'));
      renderGrid(grid, l);
      const c = catById(cat);
      title.textContent = c ? c.name : 'Каталог'; lead.textContent = c ? c.desc : 'Рыба, икра, краб и морепродукты с Дальнего Востока. Весовой товар взвешиваем перед отправкой - итоговая сумма может немного отличаться.';
      document.title = (c ? c.name : 'Каталог') + ' - Порт 41';
      count.textContent = l.length + ' ' + plural(l.length, ['товар', 'товара', 'товаров']);
      const on = chips.querySelector('.chip.on'); if (on) chips.scrollTo({ left: on.offsetLeft - 16, behavior: 'smooth' });
    };
    chips.addEventListener('click', e => { const a = e.target.closest('[data-cat]'); if (!a) return; e.preventDefault(); cat = a.dataset.cat; history.replaceState(null, '', cat === 'all' ? 'catalog.html' : 'catalog.html?cat=' + cat); drawChips(); draw(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    $('#sort').addEventListener('change', e => { sort = e.target.value; draw(); });
    grid.addEventListener('rerender', draw);
    drawChips(); draw();
  }
  function pageProduct() {
    const p = byId(qs.get('id')) || P41.PRODUCTS[0];
    const c = catById(p.cat);
    document.title = p.name + ' - Порт 41';
    let opt = p.opts ? p.opts[0][0] : null;
    const mult = () => p.opts ? p.opts.find(o => o[0] === opt)[1] : 1;
    const price = () => Math.round(p.price * mult());
    $('#crumbs').innerHTML = `<a href="index.html">Главная</a><span>/</span><a href="catalog.html">Каталог</a><span>/</span><a href="catalog.html?cat=${c.id}">${c.name}</a>`;
    $('#gallery').innerHTML = `<img src="${IMG}${p.img}" alt="${p.name}"><div class="badges">${badges(p)}</div><button class="fav${fav[p.id] ? ' on' : ''}" data-fav="${p.id}" aria-label="В избранное">${I.heart}</button>`;
    $('#pd-cat').textContent = c.name; $('#pd-name').textContent = p.name; $('#pd-sub').textContent = p.sub;
    const priceBox = $('#pd-price'), sticky = $('#sticky');
    const drawPrice = () => {
      priceBox.innerHTML = `<b>${fmt(price())}<small>${p.opts ? '' : p.unit}</small></b>${p.old ? `<s>${fmt(Math.round(p.old * mult()))}</s>` : ''}${p.opts && p.unit ? `<span class="mute" style="font-size:14px">${fmt(p.price)}${p.unit}</span>` : ''}`;
      sticky.querySelector('.p').innerHTML = `${fmt(price())}<small>${p.name}${opt ? ' · ' + opt : ''}</small>`;
    };
    if (p.opts) { const o = $('#opts'); o.innerHTML = `<div class="mute" style="font-size:13px;width:100%">Фасовка</div>` + p.opts.map(x => `<button class="${x[0] === opt ? 'on' : ''}" data-opt="${x[0]}">${x[0]}</button>`).join('');
      o.addEventListener('click', e => { const b = e.target.closest('[data-opt]'); if (!b) return; opt = b.dataset.opt; $$('[data-opt]', o).forEach(x => x.classList.toggle('on', x.dataset.opt === opt)); drawPrice(); }); }
    drawPrice();
    let q = 1; const qEl = $('#qty span');
    $('#qty').addEventListener('click', e => { if (e.target.dataset.q === '-') q = Math.max(1, q - 1); if (e.target.dataset.q === '+') q++; qEl.textContent = q; });
    const buy = () => addToCart(p.id, opt, q);
    $('#buy').addEventListener('click', buy); $('#buy2').addEventListener('click', buy);
    $('#desc').innerHTML = `<p>${p.desc}</p><p>Весовой товар взвешиваем перед отправкой - итоговая сумма может отличаться в пределах 10%. Перед покупкой можно попробовать: спросите менеджера о дегустации.</p>`;
    $('#spec').innerHTML = Object.entries(p.spec || {}).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    $$('#pd-tabs button').forEach(b => b.addEventListener('click', () => { $$('#pd-tabs button').forEach(x => x.classList.remove('on')); b.classList.add('on'); $$('.pd-panel').forEach(x => x.classList.toggle('hidden', x.id !== b.dataset.panel)); }));
    const sim = $('#similar'); const draw = () => renderGrid(sim, P41.PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).concat(P41.PRODUCTS.filter(x => x.tags.includes('hit') && x.cat !== p.cat)).slice(0, 4));
    sim.addEventListener('rerender', draw); draw();
    // sticky-кнопка, когда основная кнопка ушла из вида
    const io = new IntersectionObserver(([e]) => sticky.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe($('#buy'));
  }
  function pageCart() {
    const list = $('#cart-list'), sum = $('#summary'), form = $('#order'), wrap = $('#cart-page'), empty = $('#cart-empty');
    const draw = () => {
      const items = Object.values(cart);
      wrap.classList.toggle('hidden', !items.length); empty.classList.toggle('hidden', !!items.length);
      list.innerHTML = items.map(i => { const p = byId(i.id); if (!p) return ''; const k = cartKey(i.id, i.opt); return `<div class="cart-row"><a href="product.html?id=${p.id}"><img src="${IMG}${p.img}" alt=""></a><div><a class="name" href="product.html?id=${p.id}">${p.name}</a><div class="sub">${i.opt ? 'Фасовка: ' + i.opt : p.sub}</div>
        <div class="row"><div class="qty"><button data-k="${k}" data-d="-1" aria-label="Убрать">−</button><span>${i.qty}</span><button data-k="${k}" data-d="1" aria-label="Добавить">+</button></div><div class="sum">${fmt(lineTotal(i))}</div></div>
        <div class="row" style="margin-top:6px"><button class="del" data-k="${k}" data-d="-999">Удалить</button></div></div></div>`; }).join('');
      const total = cartTotal(), dm = form.querySelector('[name=delivery]:checked').value, dp = dm === 'pickup' || total >= P41.FREE_FROM ? 0 : P41.DELIVERY_PRICE;
      sum.innerHTML = `<div class="line"><span>${cartCount()} ${plural(cartCount(), ['товар', 'товара', 'товаров'])}</span><span>${fmt(total)}</span></div><div class="line"><span>Доставка</span><span>${dp ? fmt(dp) : 'бесплатно'}</span></div><div class="total"><span>Итого</span><span>${fmt(total + dp)}</span></div>${dp ? `<div class="free">До бесплатной доставки ещё ${fmt(P41.FREE_FROM - total)}</div>` : ''}`;
    };
    list.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k, d = +b.dataset.d; const it = cart[k]; if (!it) return; it.qty += d; if (it.qty <= 0) delete cart[k]; saveCart(); draw(); });
    form.addEventListener('change', draw);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.name_, phone = form.phone; let ok = true;
      [name, phone].forEach(f => { const bad = !f.value.trim() || (f === phone && f.value.replace(/\D/g, '').length < 10); f.classList.toggle('err', bad); if (bad) ok = false; });
      if (!ok) { toast('Заполните имя и телефон'); return; }
      // Здесь подключите отправку: fetch('/api/order', {method:'POST', body: JSON.stringify({...})})
      const num = 'П41-' + String(Date.now()).slice(-5);
      cart = {}; saveCart();
      $('#cart-wrap').innerHTML = `<div class="success"><div class="ok">${I.check}</div><h2>Заказ ${num} принят</h2><p>Менеджер перезвонит на ${phone.value} в течение 15 минут, уточнит вес и время доставки.</p><a class="btn" href="catalog.html" style="margin-top:22px">Вернуться в каталог</a></div>`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    form.phone.addEventListener('input', e => { let v = e.target.value.replace(/\D/g, '').replace(/^8/, '7').slice(0, 11); if (v && v[0] !== '7') v = '7' + v; let s = v ? '+7' : ''; if (v.length > 1) s += ' (' + v.slice(1, 4); if (v.length >= 4) s += ') ' + v.slice(4, 7); if (v.length >= 7) s += '-' + v.slice(7, 9); if (v.length >= 9) s += '-' + v.slice(9, 11); e.target.value = s; });
    draw();
  }
  function pageFavorites() {
    const g = $('#grid'); const draw = () => renderGrid(g, P41.PRODUCTS.filter(p => fav[p.id]), '<div class="empty-state" style="grid-column:1/-1"><h3>В избранном пока пусто</h3>Нажмите ♥ на товаре - и он появится здесь.<br><br><a class="btn" href="catalog.html">В каталог</a></div>');
    g.addEventListener('rerender', draw); draw();
  }
  function pageNews() { $('#articles').innerHTML = P41.NEWS.map((n, i) => `<article class="article" id="n${i}"><small>${n.date}</small><h3>${n.title}</h3><p>${n.text}</p></article>`).join(''); }
  function pageForm() { // оптовикам / контакты - форма заявки
    $$('form[data-lead]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); const ph = f.querySelector('[name=phone]'); if (!ph.value.replace(/\D/g, '').length) { ph.classList.add('err'); return; } f.innerHTML = `<div class="success"><div class="ok">${I.check}</div><h3>Заявка отправлена</h3><p>Перезвоним в рабочее время: ${P41.HOURS}.</p></div>`; }));
  }
  function plural(n, f) { n = Math.abs(n) % 100; const n1 = n % 10; if (n > 10 && n < 20) return f[2]; if (n1 > 1 && n1 < 5) return f[1]; if (n1 === 1) return f[0]; return f[2]; }

  document.addEventListener('DOMContentLoaded', () => {
    mountChrome();
    ({ home: pageHome, catalog: pageCatalog, product: pageProduct, cart: pageCart, favorites: pageFavorites, news: pageNews }[page] || (() => {}))();
    pageForm();
  });
  window.P41.api = { addToCart, toggleFav, fmt };
})();
