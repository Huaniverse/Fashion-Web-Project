document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const mobileActions = document.querySelector('.nav-mobile-actions');
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-item');
    const header = document.querySelector('header');

    // Khởi tạo giỏ hàng từ localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
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

    // Tự động đóng menu & xử lý Active khi Click
    navItems.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            if (mobileActions) mobileActions.style.display = 'none';
            navItems.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Scroll Spy
    window.addEventListener('scroll', () => {
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
            if (item.getAttribute('href').includes(current)) {
                item.classList.add('active');
            }
            if (pageYOffset < 200 && item.getAttribute('href') === "#") {
                item.classList.add('active');
            }
        });

        if (window.scrollY > 50) {
            header.style.boxShadow = '0 15px 40px rgba(0,51,102,0.15)';
            header.style.background = 'rgba(253, 251, 247, 0.85)';
        } else {
            header.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.1)';
            header.style.background = 'rgba(253, 251, 247, 0.7)';
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

        // Badge: ưu tiên hiển thị SALE hơn HOT nếu có cả hai
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
            <div class="img-placeholder" style="background-image: url('${product.image}')"></div>
            <div class="card-content">
                <h3 class="card-title">${product.name}</h3>
                ${priceHTML}
                <button class="btn-add">Thêm vào giỏ</button>
            </div>
        `;

        // Gắn sự kiện thêm giỏ hàng
        card.querySelector('.btn-add').addEventListener('click', function (e) {
            e.preventDefault();
            const price = hasSale ? formatPrice(discountedPrice) : formatPrice(product.price);
            const existingProduct = cart.find(p => p.title === product.name);
            if (existingProduct) {
                existingProduct.quantity++;
            } else {
                cart.push({ id: Date.now(), title: product.name, price, quantity: 1 });
            }
            localStorage.setItem('cart', JSON.stringify(cart));
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

        // Khởi tạo drag sau khi render xong
        initDrag();
    }

    // Load products.json
    fetch('assets/products.json')
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
        const cartCount = document.getElementById('cart-count');
        const cartCountMobile = document.getElementById('cart-count-mobile');
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCount) cartCount.textContent = `(${total})`;
        if (cartCountMobile) cartCountMobile.textContent = `(${total})`;
    }

    function showNotification(message) {
        document.querySelectorAll('[data-notification]').forEach(n => n.remove());
        const notification = document.createElement('div');
        notification.setAttribute('data-notification', 'true');
        notification.style.cssText = `
            position: fixed; top: 90px; right: 20px;
            background: #4CAF50; color: white;
            padding: 16px 24px; border-radius: 10px;
            box-shadow: 0 8px 25px rgba(76,175,80,0.3);
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

    const loginBtn = document.querySelector('.btn-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            showNotification('Chức năng đăng nhập đang được phát triển!');
        });
    }

    const cartBtn = document.querySelector('.btn-cart');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            showNotification(`Giỏ hàng có ${cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm`);
        });
    }
});