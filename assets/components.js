/* ===================================================
   COMPONENTS.JS — Chèn Header/Footer & Kích hoạt Main.js
   =================================================== */

// ── Inject global nav-dropdown CSS (chạy trước khi render) ──
(function injectNavDropdownCSS() {
    const style = document.createElement('style');
    style.id = 'nav-dropdown-style';
    style.textContent = `
        /* ── Nav dropdown wrapper ── */
        .nav-has-dropdown { position: relative; }

        .nav-has-dropdown > a {
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }

        .nav-has-dropdown > a .nav-chevron {
            font-size: 9px;
            transition: transform 0.3s ease;
        }

        /* Dropdown panel */
        .nav-dropdown {
            display: none;
            position: absolute;
            top: calc(100% + 8px);
            left: 50%;
            transform: translateX(-50%);
            min-width: 160px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 35px rgba(0,51,102,0.15);
            border: 1px solid rgba(0,86,179,0.1);
            overflow: hidden;
            z-index: 1500;
            list-style: none;
            padding: 6px 0;
            animation: navDropIn 0.18s ease-out;
        }

        /* Vùng đệm ẩn lấp khoảng trống giữa link và panel,
           giúp chuột di chuyển xuống không làm mất hover */
        .nav-dropdown::before {
            content: '';
            position: absolute;
            top: -10px;
            left: 0;
            right: 0;
            height: 10px;
        }

        @keyframes navDropIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
        }

        .nav-has-dropdown:hover > a .nav-chevron { transform: rotate(180deg); }

        /* Dropdown mở bằng class JS thay vì :hover thuần CSS */
        .nav-has-dropdown.open .nav-dropdown    { display: block; }
        .nav-has-dropdown.open > a .nav-chevron { transform: rotate(180deg); }

        .nav-dropdown li a {
            display: block;
            padding: 9px 18px;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-dark);
            text-decoration: none;
            text-transform: capitalize;
            white-space: nowrap;
            transition: background 0.2s, color 0.2s;
        }

        /* Xóa gạch chân underline effect cho dropdown items */
        .nav-dropdown li a::after { display: none !important; }

        .nav-dropdown li a:hover {
            background: rgba(0,86,179,0.06);
            color: var(--primary-blue);
        }

        .nav-dropdown li a.active {
            color: var(--primary-blue);
            font-weight: 600;
            background: rgba(0,86,179,0.05);
        }

        /* Divider sau "Tất cả" */
        .nav-dropdown li:first-child {
            border-bottom: 1px solid rgba(0,0,0,0.06);
            margin-bottom: 4px;
        }
    `;
    document.head.appendChild(style);
})();

const headerHTML = `
    <a href="/index.html" class="logo">DEUX</a>
            <nav id="nav-menu">
                <ul>
                    <li><a href="/index.html" class="nav-item">Trang chủ</a></li>
                    <li><a href="/index.html#hot-section" class="nav-item">Xu hướng</a></li>
                    <li><a href="/index.html#sale-section" class="nav-item">Khuyến mãi</a></li>
                    <li class="nav-has-dropdown">
                        <a href="/pages/product-list/product-list.html" class="nav-item">
                            Sản phẩm <i class="fas fa-chevron-down nav-chevron"></i>
                        </a>
                        <ul class="nav-dropdown" id="nav-product-dropdown">
                            <li><a href="/pages/product-list/product-list.html">Tất cả sản phẩm</a></li>
                        </ul>
                    </li>
                </ul>
                <div class="nav-mobile-actions" style="display:none;">
                    <a href="/pages/auth/auth.html?mode=login" class="btn-login"><i class="far fa-user"></i> Đăng nhập</a>
                    <a href="/pages/cart/cart.html" class="btn-cart">
                        <i class="fas fa-shopping-bag"></i> Giỏ hàng <span id="cart-count-mobile">(0)</span>
                    </a>
                </div>
            </nav>
            <div class="nav-actions">
                <a href="/pages/auth/auth.html?mode=login" class="btn-login"><i class="far fa-user"></i> Đăng nhập</a>
                <a href="/pages/cart/cart.html" class="btn-cart">
                    <i class="fas fa-shopping-bag"></i> Giỏ hàng <span id="cart-count">(0)</span>
                </a>
            </div>
            <button class="menu-mobile" id="mobile-toggle"><i class="fas fa-bars"></i></button>
`;

const footerHTML = `
        <div class="container footer-grid">
            <div>
                <h3 class="logo">DEUX</h3>
                <p>Thương hiệu thời trang cao cấp mang phong cách hiện đại, tối giản.</p>
            </div>
            <div class="footer-contact">
                <h4>Thông tin liên hệ</h4>
                <p><i class="fas fa-map-marker-alt"></i> 123 Đường Blue, Quận 1, TP. HCM</p>
                <p><i class="fas fa-phone"></i> +84 123 456 789</p>
                <p><i class="fas fa-envelope"></i> contact@deux.com</p>
            </div>
        </div>
        <div class="footer-bottom">
            &copy; 2026 DEUX. All rights reserved.
        </div>
`;

(function injectComponents() {
    const headerNode = document.querySelector('header');
    const footerNode = document.querySelector('footer');

    if (headerNode) headerNode.innerHTML = headerHTML;
    if (footerNode) footerNode.innerHTML = footerHTML;

    // Lấy đường dẫn hiện tại
    const currentPath = window.location.pathname;

    document.querySelectorAll('.nav-item').forEach(link => {
        const href = link.getAttribute('href');

        // Xóa tất cả class active trước khi thiết lập lại
        link.classList.remove('active');

        // Logic kiểm tra Active
        if (currentPath === '/' || currentPath.endsWith('index.html')) {
            // Nếu ở trang chủ, dựa vào main.js xử lý Scroll Spy hoặc mặc định Trang chủ
            if (href === '/index.html' || href === '#') {
                link.classList.add('active');
            }
        }
        else if (currentPath.includes('product-list') || currentPath.includes('product-detail')) {
            // Nếu URL chứa 'product-list' hoặc 'product-detail', active mục "Sản phẩm"
            if (href.includes('product-list')) {
                link.classList.add('active');
            }
        }
        else {
            // Các trang khác (Login, Cart, v.v.)
            if (href !== '/index.html' && currentPath.includes(href.split('/').pop())) {
                link.classList.add('active');
            }
        }
    });

    // ── Hover-intent cho nav dropdown (tránh flicker khoảng trống) ──
    (function bindNavDropdownHover() {
        const items = document.querySelectorAll('.nav-has-dropdown');
        items.forEach(item => {
            let closeTimer = null;

            const open  = () => { clearTimeout(closeTimer); item.classList.add('open'); };
            const close = () => { closeTimer = setTimeout(() => item.classList.remove('open'), 120); };

            item.addEventListener('mouseenter', open);
            item.addEventListener('mouseleave', close);

            // Nếu di chuột vào dropdown panel → giữ mở
            const panel = item.querySelector('.nav-dropdown');
            if (panel) {
                panel.addEventListener('mouseenter', open);
                panel.addEventListener('mouseleave', close);
            }

            // ── Mobile: bấm vào li để toggle dropdown (không đi link) ──
            const link = item.querySelector(':scope > a');
            if (link) {
                link.addEventListener('click', function (e) {
                    // Chỉ xử lý khi là màn hình mobile (hamburger đang hiển thị)
                    const isMobile = window.matchMedia('(max-width: 1130px)').matches;
                    if (!isMobile) return; // desktop: đi link bình thường

                    e.preventDefault(); // ngăn đi link
                    const isOpen = item.classList.contains('open');
                    // Đóng tất cả dropdown khác trước
                    document.querySelectorAll('.nav-has-dropdown.open')
                        .forEach(el => el.classList.remove('open'));
                    if (!isOpen) item.classList.add('open');
                });
            }
        });

        // Đóng dropdown khi click ra ngoài
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.nav-has-dropdown')) {
                document.querySelectorAll('.nav-has-dropdown.open')
                    .forEach(el => el.classList.remove('open'));
            }
        });
    })();

    // ── Điền categories vào nav dropdown từ products.json ──
    fetch('/assets/products.json')
        .then(r => r.json())
        .then(products => {
            const dropdown = document.getElementById('nav-product-dropdown');
            if (!dropdown) return;

            // Lấy danh sách category duy nhất, giữ thứ tự xuất hiện
            const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
            const currentParams = new URLSearchParams(window.location.search);
            const activeCat = currentParams.get('category') || '';

            cats.forEach(cat => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                const slug = encodeURIComponent(cat);
                a.href = `/pages/product-list/product-list.html?category=${slug}`;
                // Viết hoa chữ đầu
                a.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
                if (activeCat === cat) a.classList.add('active');
                li.appendChild(a);
                dropdown.appendChild(li);
            });
        })
        .catch(() => {}); // Không làm vỡ trang nếu fetch lỗi

    // Kích hoạt lại sự kiện cho main.js
    window.dispatchEvent(new Event('DOMContentLoaded'));

    const logoutModalHTML = `
    <div id="logout-modal" class="custom-modal">
        <div class="modal-content">
            <h3>Xác nhận đăng xuất</h3>
            <p>Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?</p>
            <div class="modal-actions">
                <button id="confirm-logout" class="btn-modal btn-confirm">Đăng xuất</button>
                <button id="cancel-logout" class="btn-modal btn-cancel">Hủy bỏ</button>
            </div>
        </div>
    </div>
`;
    document.body.insertAdjacentHTML('beforeend', logoutModalHTML);

    // ── Logic User Menu (Session & Logout) ──
    const session = JSON.parse(localStorage.getItem('eb_session') || 'null');
    const loginBtns = document.querySelectorAll('.btn-login');

    if (session) {
        const firstName = session.fullname
            ? session.fullname.trim().split(/\s+/).pop()
            : session.email.split('@')[0];

        loginBtns.forEach(btn => {
            // Check if we already wrapped this button (prevents double wrapping)
            if (btn.parentElement.classList.contains('user-menu-wrapper')) return;

            // Bọc btn trong wrapper để định vị dropdown
            const wrapper = document.createElement('div');
            wrapper.className = 'user-menu-wrapper';
            btn.parentNode.insertBefore(wrapper, btn);
            wrapper.appendChild(btn);

            btn.innerHTML = `<i class="far fa-user"></i> ${firstName} <i class="fas fa-chevron-down user-chevron"></i>`;
            btn.href = '#'; // Prevent navigation
            btn.title = '';

            // Tạo dropdown
            const dropdown = document.createElement('div');
            dropdown.className = 'user-dropdown';
            dropdown.innerHTML = `
                <a href="/pages/orders/orders.html" class="user-dropdown-item">
                    <i class="fas fa-box-open"></i> Đơn hàng
                </a>
                <div class="user-dropdown-divider"></div>
                <button class="user-dropdown-item user-dropdown-logout">
                    <i class="fas fa-sign-out-alt"></i> Đăng xuất
                </button>
            `;
            wrapper.appendChild(dropdown);

            // Toggle dropdown khi click
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                wrapper.classList.toggle('open');
            });

            // Đăng xuất
            const logoutBtn = dropdown.querySelector('.user-dropdown-logout');
            const modal = document.getElementById('logout-modal');
            const confirmBtn = document.getElementById('confirm-logout');
            const cancelBtn = document.getElementById('cancel-logout');

            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.add('show');
                wrapper.classList.remove('open');
            });

            confirmBtn.onclick = () => {
                localStorage.removeItem('eb_session');
                location.reload();
            };

            cancelBtn.onclick = () => modal.classList.remove('show');
            modal.onclick = (e) => {
                if (e.target === modal) modal.classList.remove('show');
            };

            // Đóng khi click ra ngoài
            document.addEventListener('click', (e) => {
                if (!wrapper.contains(e.target)) {
                    wrapper.classList.remove('open');
                }
            });
        });
    }
})();