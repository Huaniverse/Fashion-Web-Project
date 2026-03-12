/* ── Cart helpers (cùng key với main.js) ── */
function _getCartKey() {
  const session = JSON.parse(localStorage.getItem('eb_session') || 'null');
  return session ? `cart:${session.email}` : 'cart:guest';
}

function _getCart() {
  return JSON.parse(localStorage.getItem(_getCartKey()) || '[]');
}

function _saveCart(cart) {
  localStorage.setItem(_getCartKey(), JSON.stringify(cart));
}

/* ── Notification (dùng lại style/animation đã có trong main.js) ── */
function _notify(message, color = '#4CAF50') {
  // Nếu main.js đã expose showNotification → dùng lại, không thì tự tạo
  if (typeof showNotification === 'function') {
    showNotification(message, color);
    return;
  }
  document.querySelectorAll('[data-pl-notify]').forEach(n => n.remove());
  const el = document.createElement('div');
  el.setAttribute('data-pl-notify', 'true');
  el.style.cssText = `
    position:fixed;top:90px;right:20px;
    background:${color};color:white;
    padding:14px 22px;border-radius:10px;
    box-shadow:0 8px 25px rgba(0,0,0,.2);
    z-index:9999;font-weight:600;font-family:'Poppins',sans-serif;
    animation:slideInRight .4s ease-out;
  `;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

/* ── Update cart badge (cùng selector với main.js) ── */
function _updateCartBadge() {
  const session = JSON.parse(localStorage.getItem('eb_session') || 'null');
  const total = session
    ? _getCart().reduce((s, i) => s + i.quantity, 0)
    : 0;
  document.querySelectorAll('#cart-count, #cart-count-mobile').forEach(el => {
    el.textContent = `(${total})`;
  });
}

/* ── Format tiền VND ── */
function _fmt(price) {
  return price.toLocaleString('vi-VN') + 'đ';
}

/* ═══════════════════════════════════════
   CATEGORY BAR
   ═══════════════════════════════════════ */

// Icon cho từng category (fallback: tag)
const CAT_ICONS = {
  'váy':       'fa-solid fa-vest',
  'áo':        'fa-solid fa-shirt',
  'quần':      'fa-solid fa-person-pants',
  'áo khoác':  'fa-solid fa-mitten',
  'suit':      'fa-solid fa-user-tie',
  'giày':      'fa-solid fa-shoe-prints',
  'phụ kiện':  'fa-solid fa-glasses',
};

function _renderCategoryBar() {
  const bar = document.getElementById('plCatBar');
  if (!bar) return;

  // Lấy danh sách category duy nhất từ dữ liệu thực
  const cats = [...new Set(_allProducts.map(p => p.category).filter(Boolean))];

  const inner = document.createElement('div');
  inner.className = 'pl-cat-bar__inner';

  // Pill "Tất cả"
  const allPill = _makePill('Tất cả', 'fa-solid fa-border-all', _category === '');
  allPill.addEventListener('click', () => {
    _category = '';
    _syncCategoryUI();
    _updateBreadcrumb();
    history.replaceState({}, '', _gender ? `?gender=${_gender}` : window.location.pathname);
    _render();
  });
  inner.appendChild(allPill);

  // Divider
  const div = document.createElement('span');
  div.className = 'pl-cat-divider';
  inner.appendChild(div);

  // Pill từng category
  cats.forEach(cat => {
    const iconClass = CAT_ICONS[cat.toLowerCase()] || 'fa-solid fa-tag';
    const isActive = _category === cat;
    const pill = _makePill(cat, iconClass, isActive);

    pill.addEventListener('click', () => {
      _category = (_category === cat) ? '' : cat; // toggle
      _syncCategoryUI();
      _updateBreadcrumb();
      const params = new URLSearchParams();
      if (_gender)   params.set('gender',   _gender);
      if (_category) params.set('category', _category);
      const qs = params.toString();
      history.replaceState({}, '', qs ? `?${qs}` : window.location.pathname);
      _render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    inner.appendChild(pill);
  });

  bar.innerHTML = '';
  bar.appendChild(inner);

  // Sync nav dropdown active state
  _syncNavDropdown();
}

function _makePill(label, iconClass, isActive) {
  const btn = document.createElement('button');
  btn.className = 'pl-cat-pill' + (isActive ? ' pl-cat-pill--active' : '');
  btn.dataset.cat = label === 'Tất cả' ? '' : label;
  btn.innerHTML = `<i class="${iconClass}"></i>${label.charAt(0).toUpperCase() + label.slice(1)}`;
  return btn;
}

// Cập nhật active state tất cả pills
function _syncCategoryUI() {
  document.querySelectorAll('.pl-cat-pill').forEach(pill => {
    const isAll  = pill.dataset.cat === '' && _category === '';
    const isCat  = pill.dataset.cat === _category && _category !== '';
    pill.classList.toggle('pl-cat-pill--active', isAll || isCat);
  });
  _syncNavDropdown();
}

// Cập nhật active state nav dropdown
function _syncNavDropdown() {
  const dropdown = document.getElementById('nav-product-dropdown');
  if (!dropdown) return;
  dropdown.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const catParam = new URL(href, window.location.origin).searchParams.get('category') || '';
    a.classList.toggle('active', catParam === _category);
  });
}

/* ═══════════════════════════════════════
   TẠO CARD  —  Dùng đúng class từ style.css:
   .card / .img-placeholder / .card-content
   .card-title / .card-price / .btn-add / .badge
   ═══════════════════════════════════════ */
function createCard(product) {
  const hasSale = product.sale && Number(product.sale) > 0;
  const isHot = product.hot === true;
  const salePrice = hasSale
    ? Math.round(product.price * (1 - Number(product.sale) / 100))
    : null;

  const badgeHTML = hasSale
    ? `<div class="badge sale">SALE ${product.sale}%</div>`
    : isHot
      ? `<div class="badge hot">HOT</div>`
      : '';

  const priceHTML = hasSale
    ? `<p class="card-price">
        <span class="old-price">${_fmt(product.price)}</span>
        <span class="new-price">${_fmt(salePrice)}</span>
       </p>`
    : `<p class="card-price">${_fmt(product.price)}</p>`;

  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id = product.id;
  card.innerHTML = `
    ${badgeHTML}
    <div class="img-placeholder">
      <a href="/pages/product-detail/product-detail.html?id=${product.id}">
        <img src="${product.images[0]}" alt="${product.name}" loading="lazy"
             onerror="this.src='https://placehold.co/500x500/e0e8f4/0056b3?text=No+Image'">
      </a>
    </div>
    <div class="card-content">
      <h3 class="card-title">${product.name}</h3>
      ${priceHTML}
      <button class="btn-add">
        <i class="fa-solid fa-bag-shopping"></i> Thêm vào giỏ
      </button>
    </div>
  `;

  /* ── Thêm vào giỏ ── */
  card.querySelector('.btn-add').addEventListener('click', function () {
    const session = JSON.parse(localStorage.getItem('eb_session') || 'null');
    if (!session) {
      _notify('⚠️ Vui lòng đăng nhập để thêm vào giỏ hàng!', '#e67e22');
      setTimeout(() => {
        const ret = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/pages/auth/login.html?returnUrl=${ret}`;
      }, 1500);
      return;
    }

    const finalPrice = hasSale ? _fmt(salePrice) : _fmt(product.price);
    const cart = _getCart();
    const size = (product.sizes && product.sizes.length > 0) ? product.sizes[0] : 'S'; // Mặc định size đầu tiên của product
    const existing = cart.find(p => p.id === product.id && p.size === size);
    if (existing) {
      existing.quantity++;
    } else {
      cart.push({ id: product.id, title: product.name, price: finalPrice, quantity: 1, size: size, image: product.images[0], availableSizes: product.sizes });
    }
    _saveCart(cart);
    _updateCartBadge();
    _notify(`Đã thêm ${product.name} vào giỏ hàng!`);

    const btn = this;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Đã thêm';
    btn.style.background = 'linear-gradient(135deg,#4CAF50,#81C784)';
    setTimeout(() => {
      btn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> Thêm vào giỏ';
      btn.style.background = '';
    }, 2000);
  });

  return card;
}

/* ═══════════════════════════════════════
   STATE & RENDER
   ═══════════════════════════════════════ */
let _allProducts = [];
let _gender = '';
let _category = '';
let _search = '';
let _sort = '';

const _grid = document.getElementById('productGrid');
const _count = document.getElementById('plResultCount');
const _searchEl = document.getElementById('plSearch');
const _sortEl = document.getElementById('plSort');

function _render() {
  let list = [..._allProducts];

  /* 1. Tìm kiếm (ưu tiên nhất) */
  if (_search) {
    const kw = _search.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(kw));
  } else {
    /* 2. Lọc gender */
    if (_gender) list = list.filter(p => p.gender === _gender);
    /* 3. Lọc category */
    if (_category) list = list.filter(p => p.category === _category);
  }

  /* 4. Sắp xếp */
  const getEffPrice = (p) => {
    const hasSale = p.sale && Number(p.sale) > 0;
    return hasSale ? Math.round(p.price * (1 - Number(p.sale) / 100)) : p.price;
  };

  if (_sort === 'asc')  list.sort((a, b) => getEffPrice(a) - getEffPrice(b));
  if (_sort === 'desc') list.sort((a, b) => getEffPrice(b) - getEffPrice(a));
  if (_sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  /* 5. Vẽ */
  _grid.innerHTML = '';

  if (list.length === 0) {
    _grid.innerHTML = `
      <div class="pl-empty">
        <i class="fa-solid fa-box-open"></i>
        <p>Không tìm thấy sản phẩm phù hợp</p>
      </div>`;
  } else {
    list.forEach(p => _grid.appendChild(createCard(p)));
  }

  if (_count) {
    const isFiltered = _search || _category || _gender;
    if (isFiltered && list.length < _allProducts.length) {
      _count.textContent = `Tìm thấy ${list.length} sản phẩm`;
    } else {
      _count.textContent = `${_allProducts.length} sản phẩm`;
    }
  }
}

/* ═══════════════════════════════════════
   BREADCRUMB
   ═══════════════════════════════════════ */
const CATEGORY_LABELS = {
  'ao-thun': 'Áo Thun', 'ao-polo': 'Áo Polo', 'ao-so-mi': 'Áo Sơ Mi',
  'ao-khoac': 'Áo Khoác', 'quan-dai': 'Quần Dài',
  'quan-short': 'Quần Short', 'giay': 'Giày',
};

function _updateBreadcrumb() {
  const bc = document.getElementById('plBreadcrumb');
  if (!bc) return;

  let html = `<span class="pl-breadcrumb__item pl-breadcrumb__item--home" id="plBreadcrumbHome">
                <i class="fa-solid fa-house"></i> Tất cả sản phẩm
              </span>`;

  if (_gender) {
    html += `<span class="pl-breadcrumb__sep"><i class="fa-solid fa-chevron-right"></i></span>
             <span class="pl-breadcrumb__item pl-breadcrumb__item--active">${_gender}</span>`;
  }
  if (_category) {
    const label = CATEGORY_LABELS[_category] || _category;
    html += `<span class="pl-breadcrumb__sep"><i class="fa-solid fa-chevron-right"></i></span>
             <span class="pl-breadcrumb__item pl-breadcrumb__item--active">${label}</span>`;
  }
  if (_search) {
    html += `<span class="pl-breadcrumb__sep"><i class="fa-solid fa-chevron-right"></i></span>
             <span class="pl-breadcrumb__item pl-breadcrumb__item--active">
               Kết quả: "${_search}"
             </span>`;
  }

  bc.innerHTML = html;

  // Gắn lại click "Tất cả" sau khi innerHTML thay đổi
  const homeBtn = document.getElementById('plBreadcrumbHome');
  if (homeBtn) homeBtn.addEventListener('click', _resetFilter);
}

function _resetFilter() {
  _gender = _category = _search = '';
  if (_searchEl) _searchEl.value = '';
  history.replaceState({}, '', window.location.pathname);
  _syncCategoryUI();
  _updateBreadcrumb();
  _render();
}

/* ═══════════════════════════════════════
   ĐỌC FILTER TỪ URL PARAMS
   (dùng khi nav trên trang khác link sang)
   ═══════════════════════════════════════ */
function _readURLParams() {
  const params = new URLSearchParams(window.location.search);
  _gender = params.get('gender') || '';
  _category = params.get('category') || '';
}

/* ═══════════════════════════════════════
   LẮNG NGHE NAV DROPDOWN của HEADER CHUNG
   components.js render header → đợi DOM xong
   ═══════════════════════════════════════ */
function _bindNavEvents() {
  /* Nav dropdown items → lọc category */
  const navDropdown = document.getElementById('nav-product-dropdown');
  if (navDropdown) {
    navDropdown.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', function (e) {
        const catParam = new URL(this.href, window.location.origin).searchParams.get('category') || '';
        if (window.location.pathname.includes('product-list')) {
          e.preventDefault();
          _category = catParam;
          _search = '';
          if (_searchEl) _searchEl.value = '';
          const params = new URLSearchParams();
          if (_gender)   params.set('gender',   _gender);
          if (_category) params.set('category', _category);
          const qs = params.toString();
          history.replaceState({}, '', qs ? `?${qs}` : window.location.pathname);
          _syncCategoryUI();
          _updateBreadcrumb();
          _render();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // Nếu không ở trang product-list → để href tự navigate
      });
    });
  }

  /* Click logo → reset */
  document.querySelectorAll('.logo, .header__logo').forEach(el => {
    el.addEventListener('click', _resetFilter);
  });
}

/* ═══════════════════════════════════════
   KHỞI ĐỘNG
   ═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  /* Đọc URL params trước khi fetch */
  _readURLParams();

  /* Bind events */
  if (_searchEl) {
    _searchEl.addEventListener('input', () => {
      _search = _searchEl.value.trim();
      _updateBreadcrumb();
      _render();
    });
  }

  if (_sortEl) {
    _sortEl.addEventListener('change', () => {
      _sort = _sortEl.value;
      _render();
    });
  }

  /* Đợi components.js render header xong rồi bind nav */
  setTimeout(_bindNavEvents, 0);

  /* Load sản phẩm từ products.json */
  fetch('/assets/products.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      _allProducts = Array.isArray(data) ? data : [];
      _grid.innerHTML = '';      // xóa skeleton
      _renderCategoryBar();      // vẽ category bar từ dữ liệu thực
      _updateBreadcrumb();
      _render();
    })
    .catch(err => {
      console.error('Không thể tải products.json:', err);
      _grid.innerHTML = `
        <div class="pl-empty">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>
        </div>`;
    });
});