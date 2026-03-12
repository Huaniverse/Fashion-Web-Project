document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const mobileActions = document.querySelector('.nav-mobile-actions');
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-item');
    const header = document.querySelector('header');
    const shopBtn = document.querySelector('.btn-shop');

    if (shopBtn) {
        shopBtn.addEventListener('click', () => {
            window.location.href = 'pages/product-list/product-list.html';
        });
    }

    // Khởi tạo giỏ hàng từ localStorage (theo từng user)
    const _initSession = JSON.parse(localStorage.getItem('eb_session') || 'null');
    const _cartKey = _initSession ? `cart:${_initSession.email}` : 'cart:guest';
    let cart = JSON.parse(localStorage.getItem(_cartKey)) || [];
    updateCartCount();

    // Toggle Mobile Menu
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            if (mobileActions) {
                mobileActions.style.display = navMenu.classList.contains('active') ? 'flex' : 'none';
            }
        });
    }

    // Đóng mobile menu khi resize lên desktop (> 1130px)
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1130) {
            if (navMenu) navMenu.classList.remove('active');
            if (mobileActions) mobileActions.style.display = 'none';
        }
    });

    // Tự động đóng menu & xử lý Active khi Click
    navItems.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            if (mobileActions) mobileActions.style.display = 'none';
            navItems.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });

    window.addEventListener('scroll', () => {
        // 1. CHỈ chạy logic Scroll Spy nếu có tồn tại các <section> (thường là trang chủ)
        // Và quan trọng: Chỉ chạy khi trang hiện tại là index.html hoặc trang chủ
        const isHomePage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');

        if (sections.length > 0 && isHomePage) {
            let current = "";
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                    current = section.getAttribute('id');
                }
            });

            navItems.forEach(item => {
                item.classList.remove('active');
                if (current && item.getAttribute('href').includes(current)) {
                    item.classList.add('active');
                }
                if (pageYOffset < 200 && (item.getAttribute('href') === '#' || item.getAttribute('href') === '/index.html')) {
                    item.classList.add('active');
                }
            });
        }

        // 2. Logic thay đổi Style của Header (Cái này nên chạy ở mọi trang)
        if (header) {
            if (window.scrollY > 50) {
                header.style.boxShadow = '0 15px 40px rgba(0,51,102,0.15)';
                header.style.background = 'rgba(253, 251, 247, 0.85)';
            } else {
                header.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.1)';
                header.style.background = 'rgba(253, 251, 247, 0.7)';
            }
        }
    });

    // ===== RENDER CARDS TỪ JSON =====
    function formatPrice(price) {
        return price.toLocaleString('vi-VN') + 'đ';
    }

    function createCard(product) {
        const hasSale = product.sale !== '' && product.sale !== null && product.sale !== undefined && product.sale !== false && product.sale !== 0;
        const isHot = product.hot === true;

        const discountedPrice = hasSale
            ? Math.round(product.price * (1 - product.sale / 100))
            : null;

        let badgeHTML = '';
        if (hasSale) {
            badgeHTML = `<div class="badge sale">SALE ${product.sale}%</div>`;
        } else if (isHot) {
            badgeHTML = `<div class="badge hot">HOT</div>`;
        }

        const priceHTML = hasSale
            ? `<p class="card-price">
                <span class="old-price">${formatPrice(product.price)}</span>
                <span class="new-price">${formatPrice(discountedPrice)}</span>
               </p>`
            : `<p class="card-price">${formatPrice(product.price)}</p>`;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            ${badgeHTML}
            <div class="img-placeholder">
                <img src="${product.image}" alt="${product.name}" loading="lazy"
                     onerror="this.src='https://placehold.co/500x500/e0e8f4/0056b3?text=No+Image'">
            </div>
            <div class="card-content">
                <h3 class="card-title">${product.name}</h3>
                ${priceHTML}
                <button class="btn-add">Thêm vào giỏ</button>
            </div>
        `;

        card.querySelector('.btn-add').addEventListener('click', function (e) {
            e.preventDefault();

            // Kiểm tra đăng nhập
            const session = JSON.parse(localStorage.getItem('eb_session') || 'null');
            if (!session) {
                showNotification('⚠️ Vui lòng đăng nhập để thêm vào giỏ hàng!', '#e67e22');
                setTimeout(() => {
                    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
                    window.location.href = `pages/auth/login.html?returnUrl=${returnUrl}`;
                }, 1500);
                return;
            }

            const price = hasSale ? formatPrice(discountedPrice) : formatPrice(product.price);
            const existingProduct = cart.find(p => p.title === product.name);
            if (existingProduct) {
                existingProduct.quantity++;
            } else {
                cart.push({ id: Date.now(), title: product.name, price, quantity: 1 });
            }
            localStorage.setItem(_cartKey, JSON.stringify(cart));
            updateCartCount();
            showNotification(`${product.name} đã thêm vào giỏ hàng!`);

            const btn = this;
            const originalText = btn.textContent;
            btn.textContent = '✓ Đã thêm';
            btn.style.background = 'linear-gradient(135deg, #4CAF50, #81C784)';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        });

        return card;
    }

    function renderProducts(products) {
        const hotGrid = document.getElementById('hot-grid');
        const saleGrid = document.getElementById('sale-grid');

        products.forEach(product => {
            const hasSale = product.sale !== '' && product.sale !== null && product.sale !== undefined && product.sale !== false && product.sale !== 0;
            const card = createCard(product);
            if (hasSale) {
                saleGrid.appendChild(card);
            } else {
                hotGrid.appendChild(card);
            }
        });

        initDrag();
    }

    // Load products.json
    fetch('/assets/products.json')
        .then(res => res.json())
        .then(products => renderProducts(products))
        .catch(err => console.error('Không thể tải products.json:', err));

    // ===== CAROUSEL DRAG =====
    function initDrag() {
        const grids = document.querySelectorAll('.grid[data-scrollable="true"]');
        grids.forEach(grid => {
            let isDown = false;
            let startX, scrollLeft;

            grid.addEventListener('mousedown', (e) => {
                isDown = true;
                grid.classList.add('dragging');
                startX = e.pageX - grid.offsetLeft;
                scrollLeft = grid.scrollLeft;
            });
            grid.addEventListener('mouseleave', () => { isDown = false; grid.classList.remove('dragging'); });
            grid.addEventListener('mouseup', () => { isDown = false; grid.classList.remove('dragging'); });
            grid.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - grid.offsetLeft;
                grid.scrollLeft = scrollLeft - (x - startX) * 2;
            });

            grid.addEventListener('touchstart', (e) => {
                isDown = true;
                startX = e.touches[0].pageX - grid.offsetLeft;
                scrollLeft = grid.scrollLeft;
            });
            grid.addEventListener('touchend', () => { isDown = false; });
            grid.addEventListener('touchmove', (e) => {
                if (!isDown) return;
                const x = e.touches[0].pageX - grid.offsetLeft;
                grid.scrollLeft = scrollLeft - (x - startX) * 2;
            });
        });
    }

    function updateCartCount() {
        const loggedIn = !!JSON.parse(localStorage.getItem('eb_session') || 'null');
        const total = loggedIn ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
        // Cập nhật tất cả span giỏ hàng (tránh bug duplicate ID)
        document.querySelectorAll('#cart-count, #cart-count-mobile').forEach(el => {
            el.textContent = `(${total})`;
        });
    }

    function showNotification(message, color = '#4CAF50') {
        document.querySelectorAll('[data-notification]').forEach(n => n.remove());
        const notification = document.createElement('div');
        notification.setAttribute('data-notification', 'true');
        notification.style.cssText = `
            position: fixed; top: 90px; right: 20px;
            background: ${color}; color: white;
            padding: 16px 24px; border-radius: 10px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            z-index: 9999; font-weight: 600;
            animation: slideInRight 0.5s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    const loginBtn = document.querySelector('.nav-actions .btn-login');
    const session = JSON.parse(localStorage.getItem('eb_session') || 'null');

    if (loginBtn) {
        if (session) {
            const firstName = session.fullname
                ? session.fullname.trim().split(/\s+/).pop()
                : session.email.split('@')[0];

            // Bọc btn trong wrapper để định vị dropdown
            const wrapper = document.createElement('div');
            wrapper.className = 'user-menu-wrapper';
            loginBtn.parentNode.insertBefore(wrapper, loginBtn);
            wrapper.appendChild(loginBtn);

            loginBtn.innerHTML = `<i class="far fa-user"></i> ${firstName} <i class="fas fa-chevron-down user-chevron"></i>`;
            loginBtn.title = '';

            // Tạo dropdown
            const dropdown = document.createElement('div');
            dropdown.className = 'user-dropdown';
            dropdown.innerHTML = `
                <a href="pages/orders/orders.html" class="user-dropdown-item">
                    <i class="fas fa-box-open"></i> Đơn hàng
                </a>
                <div class="user-dropdown-divider"></div>
                <button class="user-dropdown-item user-dropdown-logout">
                    <i class="fas fa-sign-out-alt"></i> Đăng xuất
                </button>
            `;
            wrapper.appendChild(dropdown);

            // Toggle dropdown khi click
            loginBtn.addEventListener('click', (e) => {
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
                wrapper.classList.remove('open'); // Đóng dropdown khi mở modal
            });

            // Nút xác nhận đăng xuất
            confirmBtn.onclick = () => {
                localStorage.removeItem('eb_session');
                location.reload();
            };

            // Nút hủy hoặc click ra ngoài để đóng
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

        } else {
            // Chưa đăng nhập — giữ link sang trang login
        }
    }

    const cartBtn = document.querySelector('.btn-cart');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            showNotification(`Giỏ hàng có ${cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm`);
        });
    }
});