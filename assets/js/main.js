document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const sections = document.querySelectorAll('.section, .hero');
    const navItems = document.querySelectorAll('.nav-item');
    const navbar = document.querySelector('.navbar');
    
    // Khởi tạo giỏ hàng từ localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartCount();

    // Toggle Mobile Menu
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // 1. Tự động đóng menu & 2. Xử lý Active khi Click
    navItems.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navItems.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // 3. Scroll Spy
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
            navbar.style.boxShadow = '0 15px 40px rgba(0,51,102,0.15)';
            navbar.style.background = 'rgba(253, 251, 247, 0.85)';
        } else {
            navbar.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.1)';
            navbar.style.background = 'rgba(253, 251, 247, 0.7)';
        }
    });

    // ===== CAROUSEL DRAG FUNCTIONALITY =====
    const grids = document.querySelectorAll('.grid[data-scrollable="true"]');
    
    grids.forEach(grid => {
        let isDown = false;
        let startX;
        let scrollLeft;

        grid.addEventListener('mousedown', (e) => {
            isDown = true;
            grid.classList.add('dragging');
            startX = e.pageX - grid.offsetLeft;
            scrollLeft = grid.scrollLeft;
        });

        grid.addEventListener('mouseleave', () => {
            isDown = false;
            grid.classList.remove('dragging');
        });

        grid.addEventListener('mouseup', () => {
            isDown = false;
            grid.classList.remove('dragging');
        });

        grid.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - grid.offsetLeft;
            const walk = (x - startX) * 2;
            grid.scrollLeft = scrollLeft - walk;
        });

        // Touch support
        grid.addEventListener('touchstart', (e) => {
            isDown = true;
            startX = e.touches[0].pageX - grid.offsetLeft;
            scrollLeft = grid.scrollLeft;
        });

        grid.addEventListener('touchend', () => {
            isDown = false;
        });

        grid.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            const x = e.touches[0].pageX - grid.offsetLeft;
            const walk = (x - startX) * 2;
            grid.scrollLeft = scrollLeft - walk;
        });
    });

    // Chức năng thêm vào giỏ hàng
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.card');
            const title = card.querySelector('.card-title').textContent;
            const priceElement = card.querySelector('.card-price');
            let price = '';

            // Lấy giá mới (nếu có sale) hoặc giá bình thường
            const newPrice = priceElement.querySelector('.new-price');
            if (newPrice) {
                price = newPrice.textContent;
            } else {
                price = priceElement.textContent;
            }
            
            const product = {
                id: Date.now(),
                title: title,
                price: price,
                quantity: 1
            };
            
            const existingProduct = cart.find(p => p.title === product.title);
            if (existingProduct) {
                existingProduct.quantity++;
            } else {
                cart.push(product);
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            
            showNotification(`${title} đã thêm vào giỏ hàng!`);
            
            // Hiệu ứng button
            const originalText = btn.textContent;
            btn.textContent = '✓ Đã thêm';
            btn.style.background = 'linear-gradient(135deg, #4CAF50, #81C784)';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        });
    });

    function updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = `(${total})`;
    }

    function showNotification(message) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('[data-notification]');
        existingNotifications.forEach(notif => notif.remove());
        
        const notification = document.createElement('div');
        notification.setAttribute('data-notification', 'true');
        notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 16px 24px;
            border-radius: 10px;
            box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
            z-index: 9999;
            animation: slideInRight 0.5s ease-out;
            font-weight: 600;
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