/* ===================================================
   PRODUCT-LIST.JS — DEUX | Trang Danh Sách Sản Phẩm
   Chức năng:
     - Tải sản phẩm từ products.json và render dạng grid
     - Lọc theo giới tính (gender) và danh mục (category)
     - Tìm kiếm theo tên sản phẩm
     - Sắp xếp theo giá hoặc tên
     - Breadcrumb động theo bộ lọc đang áp dụng
     - Đọc/ghi URL params để đồng bộ trạng thái lọc
     - Thêm sản phẩm vào giỏ hàng (đồng bộ với localStorage)
     - Cập nhật badge giỏ hàng trên header
   =================================================== */

/* ── CART HELPERS: Dùng chung key với main.js ─────────────────────── */

/** Lấy key giỏ hàng trong localStorage theo email user hoặc "guest" */
function _getCartKey() {
    const session = JSON.parse(localStorage.getItem('eb_session') || 'null');
    if (session) {
        return `cart:${session.email}`;
    }
    return 'cart:guest';
}

/** Lấy mảng giỏ hàng từ localStorage */
function _getCart() {
    return JSON.parse(localStorage.getItem(_getCartKey()) || '[]');
}

/** Lưu mảng giỏ hàng vào localStorage */
function _saveCart(cart) {
    localStorage.setItem(_getCartKey(), JSON.stringify(cart));
}

/* ── NOTIFICATION TOAST ─────────────────────────────────────────────── */

/**
 * Hiển thị thông báo toast góc phải màn hình
 * Ưu tiên dùng showNotification từ main.js nếu đã được load
 * @param {string} message - Nội dung thông báo
 * @param {string} color   - Màu nền (mặc định xanh lá)
 */
function _notify(message, color = '#4CAF50') {
    // Nếu main.js đã expose showNotification → dùng lại, không thì tự tạo
    if (typeof showNotification === 'function') {
        showNotification(message, color);
        return;
    }
    // Xóa thông báo cũ trước khi hiện cái mới
    document.querySelectorAll('[data-pl-notify]').forEach(function(n) {
        n.remove();
    });
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
    setTimeout(function() {
        el.remove();
    }, 2200); // Tự xóa sau 2.2 giây
}

/* ── CẬP NHẬT SỐ LƯỢNG BADGE GIỎ HÀNG ─────────────────────────────── */

/** Cập nhật số lượng hiển thị trên icon giỏ hàng header (cả desktop + mobile) */
function _updateCartBadge() {
    const session = JSON.parse(localStorage.getItem('eb_session') || 'null');
    let total = 0;
    if (session) {
        total = _getCart().reduce(function(s, i) {
            return s + i.quantity;
        }, 0);
    }
    document.querySelectorAll('#cart-count, #cart-count-mobile').forEach(function(el) {
        el.textContent = `(${total})`;
    });
}

/* ── ĐỊNH DẠNG TIỀN VNĐ ─────────────────────────────────────────────── */

/**
 * Định dạng số thành chuỗi tiền tệ Việt Nam
 * @param {number} price - Số tiền
 * @returns {string} VD: "1.200.000đ"
 */
function _fmt(price) {
    return price.toLocaleString('vi-VN') + 'đ';
}

/* ═══════════════════════════════════════════════════════════════════════
   CATEGORY BAR (Thanh lọc danh mục)
   ═══════════════════════════════════════════════════════════════════════ */

// Bảng ánh xạ tên danh mục → icon FontAwesome tương ứng
const CAT_ICONS = {
    'váy':      'fa-solid fa-vest',
    'áo':       'fa-solid fa-shirt',
    'quần':     'fa-solid fa-person-pants',
    'áo khoác': 'fa-solid fa-mitten',
    'suit':     'fa-solid fa-user-tie',
    'giày':     'fa-solid fa-shoe-prints',
    'phụ kiện': 'fa-solid fa-glasses',
};

/**
 * Render thanh danh mục (pills) từ dữ liệu sản phẩm thực tế
 * Gồm pill "Tất cả" + pill riêng cho từng category duy nhất
 */
function _renderCategoryBar() {
    const bar = document.getElementById('plCatBar');
    if (!bar) {
        return;
    }

    // Lấy danh sách tên category duy nhất từ toàn bộ sản phẩm
    const cats = [...new Set(_allProducts.map(function(p) {
        return p.category;
    }).filter(Boolean))];

    const inner = document.createElement('div');
    inner.className = 'pl-cat-bar-inner';

    // ── Pill "Tất cả": reset bộ lọc danh mục ────────────────────────
    const allPill = _makePill('Tất cả', 'fa-solid fa-border-all', _category === '');
    allPill.addEventListener('click', function() {
        _category = '';
        _syncCategoryUI();
        _updateBreadcrumb();
        // Cập nhật URL: bỏ param category, giữ param gender nếu có
        let url = window.location.pathname;
        if (_gender) {
            url = `?gender=${_gender}`;
        }
        history.replaceState({}, '', url);
        _render();
    });
    inner.appendChild(allPill);

    // ── Đường phân cách giữa "Tất cả" và các category ───────────────
    const div = document.createElement('span');
    div.className = 'pl-cat-divider';
    inner.appendChild(div);

    // ── Tạo pill cho từng category ───────────────────────────────────
    cats.forEach(function(cat) {
        const iconClass = CAT_ICONS[cat.toLowerCase()] || 'fa-solid fa-tag'; // Fallback icon
        const isActive  = _category === cat;
        const pill      = _makePill(cat, iconClass, isActive);

        pill.addEventListener('click', function() {
            // Toggle: click lại danh mục đang chọn → bỏ lọc
            if (_category === cat) {
                _category = '';
            } else {
                _category = cat;
            }
            _syncCategoryUI();
            _updateBreadcrumb();

            // Cập nhật URL params theo trạng thái lọc mới
            const params = new URLSearchParams();
            if (_gender) {
                params.set('gender', _gender);
            }
            if (_category) {
                params.set('category', _category);
            }
            const qs = params.toString();
            let url = window.location.pathname;
            if (qs) {
                url = `?${qs}`;
            }
            history.replaceState({}, '', url);

            _render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        inner.appendChild(pill);
    });

    // Thay thế nội dung thanh category bằng nội dung mới render
    bar.innerHTML = '';
    bar.appendChild(inner);

    // Đồng bộ trạng thái active của nav dropdown trong header
    _syncNavDropdown();
}

/**
 * Tạo một pill (nút lọc danh mục)
 * @param {string} label      - Tên hiển thị
 * @param {string} iconClass  - Class FontAwesome icon
 * @param {boolean} isActive  - Có đang được chọn không
 * @returns {HTMLButtonElement}
 */
function _makePill(label, iconClass, isActive) {
    const btn = document.createElement('button');
    btn.className  = 'pl-cat-pill' + (isActive ? ' pl-cat-pill-active' : '');
    btn.dataset.cat = label === 'Tất cả' ? '' : label;
    btn.innerHTML  = `<i class="${iconClass}"></i>${label.charAt(0).toUpperCase() + label.slice(1)}`;
    return btn;
}

/** Đồng bộ lại trạng thái active của tất cả pills theo _category hiện tại */
function _syncCategoryUI() {
    document.querySelectorAll('.pl-cat-pill').forEach(function(pill) {
        const isAll = pill.dataset.cat === '' && _category === '';
        const isCat = pill.dataset.cat === _category && _category !== '';
        pill.classList.toggle('pl-cat-pill-active', isAll || isCat);
    });
    _syncNavDropdown();
}

/** Đồng bộ trạng thái active của các link trong nav dropdown header */
function _syncNavDropdown() {
    const dropdown = document.getElementById('nav-product-dropdown');
    if (!dropdown) {
        return;
    }
    dropdown.querySelectorAll('a').forEach(function(a) {
        const href     = a.getAttribute('href') || '';
        const catParam = new URL(href, window.location.origin).searchParams.get('category') || '';
        a.classList.toggle('active', catParam === _category);
    });
}

/* ═══════════════════════════════════════════════════════════════════════
   TẠO CARD SẢN PHẨM
   Dùng đúng class từ style.css:
   .card / .img-placeholder / .card-content
   .card-title / .card-price / .btn-add / .badge
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Tạo phần tử card sản phẩm hoàn chỉnh
 * @param {Object} product - Dữ liệu sản phẩm từ products.json
 * @returns {HTMLDivElement} Card DOM element đã gắn sự kiện
 */
function createCard(product) {
    const hasSale = product.sale && Number(product.sale) > 0;
    const isHot = product.hot === true;
    // Tính giá sau giảm (làm tròn) nếu có khuyến mãi
    let salePrice = null;
    if (hasSale) {
        salePrice = Math.round(product.price * (1 - Number(product.sale) / 100));
    }

    // Tạo HTML badge (SALE xx% hoặc HOT)
    let badgeHTML = '';
    if (hasSale) {
        badgeHTML = `<div class="badge badge-sale">SALE ${product.sale}%</div>`;
    } else if (isHot) {
        badgeHTML = `<div class="badge badge-hot">HOT</div>`;
    }

    // Tạo HTML phần giá (có 2 giá nếu đang sale)
    let priceHTML = '';
    if (hasSale) {
        priceHTML = `<p class="card-price">
            <span class="old-price">${_fmt(product.price)}</span>
            <span class="new-price">${_fmt(salePrice)}</span>
           </p>`;
    } else {
        priceHTML = `<p class="card-price">${_fmt(product.price)}</p>`;
    }

    const card = document.createElement('div');
    card.className  = 'card';
    card.dataset.id = product.id;

    card.innerHTML = `
        ${badgeHTML}
        <div class="img-placeholder">
            <!-- Click ảnh → chuyển tới trang chi tiết sản phẩm -->
            <a href="/pages/product-detail/product-detail.html?id=${product.id}">
                <img src="${product.images[0]}" alt="${product.name}" loading="lazy"
                     onerror="this.src='https://placehold.co/500x500/e0e8f4/0056b3?text=No+Image'">
            </a>
        </div>
        <div class="card-content">
            <h3 class="card-title">${product.name}</h3>
            ${priceHTML}
            <button class="btn btn-primary btn-add">
                <i class="fa-solid fa-bag-shopping"></i> Thêm vào giỏ
            </button>
        </div>
    `;

    // ── Sự kiện "Thêm vào giỏ" ────────────────────────────────────────
    card.querySelector('.btn-add').addEventListener('click', function () {
        // Kiểm tra đăng nhập trước
        const session = JSON.parse(localStorage.getItem('eb_session') || 'null');
        if (!session) {
            _notify('⚠️ Vui lòng đăng nhập để thêm vào giỏ hàng!', '#e67e22');
            setTimeout(function() {
                const ret = encodeURIComponent(window.location.pathname + window.location.search);
                window.location.href = `/pages/auth/auth.html?mode=login&returnUrl=${ret}`;
            }, 1500);
            return;
        }

        // Tính giá áp dụng (có giảm hoặc không)
        let finalPrice = _fmt(product.price);
        if (hasSale) {
            finalPrice = _fmt(salePrice);
        }
        const cart = _getCart();

        // Mặc định chọn size đầu tiên trong danh sách sizes
        let size = 'S';
        if (product.sizes && product.sizes.length > 0) {
            size = product.sizes[0];
        }
        const existing = cart.find(function(p) {
            return p.id === product.id && p.size === size;
        });

        if (existing) {
            existing.quantity++; // Đã có → tăng số lượng
        } else {
            // Chưa có → thêm mới
            cart.push({
                id: product.id,
                title: product.name,
                price: finalPrice,
                quantity: 1,
                size: size,
                image: product.images[0],
                availableSizes: product.sizes
            });
        }

        _saveCart(cart);
        _updateCartBadge();
        _notify(`Đã thêm ${product.name} vào giỏ hàng!`);

        // Phản hồi trực quan: đổi nội dung và màu nút trong 2 giây
        const btn = this;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Đã thêm';
        btn.style.background = 'linear-gradient(135deg,#4CAF50,#81C784)';
        setTimeout(function() {
            btn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> Thêm vào giỏ';
            btn.style.background = '';
        }, 2000);
    });

    return card;
}

/* ═══════════════════════════════════════════════════════════════════════
   BIẾN TRẠNG THÁI TOÀN CỤC
   ═══════════════════════════════════════════════════════════════════════ */
let _allProducts = []; // Toàn bộ sản phẩm từ JSON (không lọc)
let _gender      = ''; // Bộ lọc giới tính: 'Nam' | 'Nữ' | ''
let _category    = ''; // Bộ lọc danh mục: 'áo' | 'quần' | ... | ''
let _search      = ''; // Từ khóa tìm kiếm
let _sort        = ''; // Kiểu sắp xếp: 'asc' | 'desc' | 'name' | ''

// ── Các phần tử DOM giao diện ─────────────────────────────────────────
const _grid    = document.getElementById('productGrid');    // Grid hiển thị các card
const _count   = document.getElementById('plResultCount'); // Số lượng kết quả
const _searchEl = document.getElementById('plSearch');     // Input tìm kiếm
const _sortEl   = document.getElementById('plSort');       // Select sắp xếp

/* ═══════════════════════════════════════════════════════════════════════
   HÀM RENDER CHÍNH
   Áp dụng tất cả bộ lọc theo thứ tự và hiển thị kết quả lên grid
   ═══════════════════════════════════════════════════════════════════════ */
function _render() {
    let list = [..._allProducts]; // Bắt đầu với toàn bộ sản phẩm (shallow copy)

    /* Bước 1: Tìm kiếm theo tên (ưu tiên cao nhất, bỏ qua gender/category khi đang search) */
    if (_search) {
        const kw = _search.toLowerCase();
        list = list.filter(function(p) {
            return p.name.toLowerCase().includes(kw);
        });
    } else {
        /* Bước 2: Lọc theo giới tính */
        if (_gender) {
            list = list.filter(function(p) {
                return p.gender === _gender;
            });
        }
        /* Bước 3: Lọc theo danh mục */
        if (_category) {
            list = list.filter(function(p) {
                return p.category === _category;
            });
        }
    }

    /* Bước 4: Sắp xếp kết quả */
    // Hàm lấy giá hiệu dụng (sau giảm nếu có sale)
    const getEffPrice = function(p) {
        const hasSale = p.sale && Number(p.sale) > 0;
        if (hasSale) {
            return Math.round(p.price * (1 - Number(p.sale) / 100));
        }
        return p.price;
    };

    if (_sort === 'asc') {
        list.sort(function(a, b) {
            return getEffPrice(a) - getEffPrice(b);
        });
    }
    if (_sort === 'desc') {
        list.sort(function(a, b) {
            return getEffPrice(b) - getEffPrice(a);
        });
    }
    if (_sort === 'name') {
        list.sort(function(a, b) {
            return a.name.localeCompare(b.name, 'vi');
        });
    }

    /* Bước 5: Render kết quả lên grid */
    _grid.innerHTML = '';

    if (list.length === 0) {
        // Hiển thị thông báo "không tìm thấy" khi kết quả rỗng
        _grid.innerHTML = `
            <div class="pl-empty">
                <i class="fa-solid fa-box-open"></i>
                <p>Không tìm thấy sản phẩm phù hợp</p>
            </div>`;
    } else {
        list.forEach(function(p) {
            return _grid.appendChild(createCard(p));
        });
    }

    /* Cập nhật số lượng kết quả */
    if (_count) {
        const isFiltered = _search || _category || _gender;
        if (isFiltered && list.length < _allProducts.length) {
            _count.textContent = `Tìm thấy ${list.length} sản phẩm`;
        } else {
            _count.textContent = `${_allProducts.length} sản phẩm`;
        }
    }
}

/* ═══════════════════════════════════════════════════════════════════════
   BREADCRUMB ĐỘNG
   Hiển thị đường dẫn lọc hiện tại (VD: Tất cả → Nam → Áo)
   ═══════════════════════════════════════════════════════════════════════ */

// Bảng ánh xạ slug category → tên hiển thị thân thiện
const CATEGORY_LABELS = {
    'ao-thun':    'Áo Thun',
    'ao-polo':    'Áo Polo',
    'ao-so-mi':   'Áo Sơ Mi',
    'ao-khoac':   'Áo Khoác',
    'quan-dai':   'Quần Dài',
    'quan-short': 'Quần Short',
    'giay':       'Giày',
};

/** Cập nhật breadcrumb theo trạng thái lọc hiện tại */
function _updateBreadcrumb() {
    const bc = document.getElementById('plBreadcrumb');
    if (!bc) {
        return;
    }

    // Breadcrumb luôn bắt đầu bằng "Tất cả sản phẩm"
    let html = `<span class="pl-breadcrumb-item pl-breadcrumb-item-home" id="plBreadcrumbHome">
                    <i class="fa-solid fa-house"></i> Tất cả sản phẩm
                </span>`;

    // Thêm node giới tính nếu đang lọc
    if (_gender) {
        html += `<span class="pl-breadcrumb-sep"><i class="fa-solid fa-chevron-right"></i></span>
                 <span class="pl-breadcrumb-item pl-breadcrumb-item-active">${_gender}</span>`;
    }
    // Thêm node danh mục nếu đang lọc
    if (_category) {
        let label = _category;
        if (CATEGORY_LABELS[_category]) {
            label = CATEGORY_LABELS[_category];
        }
        html += `<span class="pl-breadcrumb-sep"><i class="fa-solid fa-chevron-right"></i></span>
                 <span class="pl-breadcrumb-item pl-breadcrumb-item-active">${label}</span>`;
    }
    // Thêm node tìm kiếm nếu có từ khóa
    if (_search) {
        html += `<span class="pl-breadcrumb-sep"><i class="fa-solid fa-chevron-right"></i></span>
                 <span class="pl-breadcrumb-item pl-breadcrumb-item-active">
                     Kết quả: "${_search}"
                 </span>`;
    }

    bc.innerHTML = html;

    // Gắn lại sự kiện click "Tất cả" sau mỗi lần innerHTML thay đổi
    const homeBtn = document.getElementById('plBreadcrumbHome');
    if (homeBtn) {
        homeBtn.addEventListener('click', _resetFilter);
    }
}

/** Reset toàn bộ bộ lọc về trạng thái ban đầu */
function _resetFilter() {
    _gender = _category = _search = '';
    if (_searchEl) {
        _searchEl.value = '';
    }
    history.replaceState({}, '', window.location.pathname); // Xóa query params khỏi URL
    _syncCategoryUI();
    _updateBreadcrumb();
    _render();
}

/* ═══════════════════════════════════════════════════════════════════════
   ĐỌC FILTER TỪ URL PARAMS
   Dùng khi người dùng navigate từ trang khác (VD: click link nav dropdown)
   ═══════════════════════════════════════════════════════════════════════ */
function _readURLParams() {
    const params = new URLSearchParams(window.location.search);
    _gender   = params.get('gender')   || '';
    _category = params.get('category') || '';
}

/* ═══════════════════════════════════════════════════════════════════════
   LẮNG NGHE SỰ KIỆN TỪ NAV DROPDOWN CỦA HEADER CHUNG
   components.js render header → cần đợi DOM xong mới bind được
   ═══════════════════════════════════════════════════════════════════════ */
function _bindNavEvents() {
    // Lắng nghe click vào các link trong nav dropdown "Sản phẩm"
    const navDropdown = document.getElementById('nav-product-dropdown');
    if (navDropdown) {
        navDropdown.querySelectorAll('a').forEach(function(a) {
            a.addEventListener('click', function (e) {
                // Lấy category từ href của link được click
                let catParam = '';
                const urlObj = new URL(this.href, window.location.origin);
                if (urlObj.searchParams.get('category')) {
                    catParam = urlObj.searchParams.get('category');
                }

                if (window.location.pathname.includes('product-list')) {
                    // Đang ở trang product-list → lọc tại chỗ, không navigate
                    e.preventDefault();
                    _category = catParam;
                    _search   = '';
                    if (_searchEl) {
                        _searchEl.value = '';
                    }

                    // Cập nhật URL params
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
                // Nếu không ở trang product-list → để href tự điều hướng
            });
        });
    }

    // Click vào logo → reset bộ lọc
    document.querySelectorAll('.logo').forEach(function(el) {
        el.addEventListener('click', _resetFilter);
    });
}

/* ═══════════════════════════════════════════════════════════════════════
   KHỞI ĐỘNG ỨNG DỤNG
   ═══════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {

    // Đọc bộ lọc từ URL trước khi fetch dữ liệu
    _readURLParams();

    // ── Sự kiện tìm kiếm: gõ real-time → render lại
    if (_searchEl) {
        _searchEl.addEventListener('input', function() {
            _search = _searchEl.value.trim();
            _updateBreadcrumb();
            _render();
        });
    }

    // ── Sự kiện sắp xếp: đổi option → render lại
    if (_sortEl) {
        _sortEl.addEventListener('change', function() {
            _sort = _sortEl.value;
            _render();
        });
    }

    // Đợi components.js render header xong rồi bind sự kiện nav dropdown
    // setTimeout(0) đảm bảo chạy sau tất cả các synchronous code trong event loop
    setTimeout(_bindNavEvents, 0);

    // ── Tải dữ liệu sản phẩm từ products.json ─────────────────────────
    fetch('/assets/products.json')
        .then(function(res) {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            return res.json();
        })
        .then(function(data) {
            _allProducts = Array.isArray(data) ? data : [];
            _grid.innerHTML = '';       // Xóa skeleton loading
            _renderCategoryBar();       // Render thanh filter category từ dữ liệu thực
            _updateBreadcrumb();        // Cập nhật breadcrumb
            _render();                  // Render danh sách sản phẩm
        })
        .catch(function(err) {
            // Hiển thị lỗi khi không tải được dữ liệu
            console.error('Không thể tải products.json:', err);
            _grid.innerHTML = `
                <div class="pl-empty">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>
                </div>`;
        });
});
