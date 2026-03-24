/* ===================================================
   MAIN.JS — DEUX | Trang Chủ
   Chức năng:
     - Điều hướng mobile menu (hamburger)
     - Scroll spy: highlight nav item theo section đang xem
     - Thay đổi style header khi scroll
     - Tải và render sản phẩm từ products.json (HOT / SALE)
     - Kéo-thả carousel (mouse + touch)
     - Thêm vào giỏ hàng
     - Hiển thị thông báo toast
   =================================================== */

document.addEventListener('DOMContentLoaded', function() {

    // ── Lấy các phần tử DOM cần thiết ──────────────────────────────────
    const mobileToggle  = document.getElementById('mobile-toggle');   // Nút hamburger menu
    const navMenu       = document.getElementById('nav-menu');         // Danh sách nav links
    const mobileActions = document.querySelector('.nav-mobile-actions'); // Khu vực nút đăng nhập/giỏ hàng mobile
    const sections      = document.querySelectorAll('section');        // Tất cả section để scroll spy
    const navItems      = document.querySelectorAll('.nav-item');      // Các link điều hướng
    const header        = document.querySelector('header');            // Phần tử header
    const shopBtn       = document.querySelector('.btn-shop');         // Nút "Khám phá ngay"

    // ── Nút "Khám phá ngay" → chuyển sang trang danh sách sản phẩm
    if (shopBtn) {
        shopBtn.addEventListener('click', function() {
            window.location.href = 'pages/product-list/product-list.html';
        });
    }

    // ── Khởi tạo giỏ hàng từ localStorage (theo từng user đăng nhập) ──
    const _initSession = JSON.parse(localStorage.getItem('eb_session') || 'null');
    // Key giỏ hàng riêng theo email: "cart:user@email.com" hoặc "cart:guest"
    const _cartKey = _initSession ? `cart:${_initSession.email}` : 'cart:guest';
    let cart = JSON.parse(localStorage.getItem(_cartKey)) || [];

    // Hiển thị số lượng giỏ hàng lên Header ngay khi tải trang
    updateCartCount();

    // ── MOBILE MENU (HAMBURGER) ─────────────────────────────────────────
    if (mobileToggle) {
        // Click nút hamburger → toggle class "active" để show/hide menu
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            // Hiện/ẩn khu vực nút Login/Cart theo trạng thái menu
            if (mobileActions) {
                if (navMenu.classList.contains('active')) {
                    mobileActions.style.display = 'flex';
                } else {
                    mobileActions.style.display = 'none';
                }
            }
        });
    }

    // ── Đóng mobile menu khi resize lên màn hình desktop (> 1130px) ────
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1130) {
            if (navMenu) {
                navMenu.classList.remove('active');
            }
            if (mobileActions) {
                mobileActions.style.display = 'none';
            }
        }
    });

    // ── Đóng menu và cập nhật Active khi click vào nav item ────────────
    navItems.forEach(function(link) {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            if (mobileActions) {
                mobileActions.style.display = 'none';
            }
            // Xóa active khỏi tất cả, thêm active vào link vừa click
            navItems.forEach(function(item) {
                item.classList.remove('active');
            });
            link.classList.add('active');
        });
    });

    // ── XỬ LÝ SỰ KIỆN SCROLL ───────────────────────────────────────────
    window.addEventListener('scroll', function() {

        // 1. SCROLL SPY: Chỉ chạy nếu có các <section> (thường là trang chủ index.html)
        const isHomePage = window.location.pathname === '/' ||
                           window.location.pathname.endsWith('index.html');

        if (sections.length > 0 && isHomePage) {
            let current = ""; // ID section hiện tại đang trong viewport

            // Xác định section nào đang được xem dựa trên vị trí scroll
            sections.forEach(function(section) {
                const sectionTop    = section.offsetTop;
                const sectionHeight = section.clientHeight;
                // Coi là "đang xem" khi đã scroll qua 1/3 chiều cao section
                if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                    current = section.getAttribute('id');
                }
            });

            // Highlight nav item tương ứng với section đang xem
            navItems.forEach(function(item) {
                item.classList.remove('active');
                if (current && item.getAttribute('href').includes(current)) {
                    item.classList.add('active');
                }
                // Nếu scroll gần đầu trang → active link Home
                if (pageYOffset < 200 &&
                    (item.getAttribute('href') === '#' ||
                     item.getAttribute('href') === '/index.html')) {
                    item.classList.add('active');
                }
            });
        }

        // 2. HEADER STYLE: Thay đổi độ mờ và shadow khi scroll (áp dụng mọi trang)
        if (header) {
            if (window.scrollY > 50) {
                // Đã scroll xuống → header đậm hơn, shadow rõ hơn
                header.style.boxShadow = '0 15px 40px rgba(0,51,102,0.15)';
                header.style.background = 'rgba(253, 251, 247, 0.85)';
            } else {
                // Ở đầu trang → header trong suốt hơn
                header.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.1)';
                header.style.background = 'rgba(253, 251, 247, 0.7)';
            }
        }
    });

    // ── RENDER CARDS SẢN PHẨM TỪ JSON ─────────────────────────────────

    /**
     * Định dạng giá tiền theo chuẩn Việt Nam
     * @param {number} price - Giá gốc (VNĐ)
     * @returns {string} Chuỗi giá đã định dạng, ví dụ "1.200.000đ"
     */
    function formatPrice(price) {
        return price.toLocaleString('vi-VN') + 'đ';
    }

    /**
     * Tạo phần tử card sản phẩm
     * @param {Object} product - Đối tượng sản phẩm từ products.json
     * @returns {HTMLElement} Phần tử <div class="card"> đã được render đầy đủ
     */
    function createCard(product) {
        // Kiểm tra sản phẩm có giảm giá không (sale khác rỗng, null, undefined, false, 0)
        const hasSale = product.sale !== '' && product.sale !== null &&
                        product.sale !== undefined && product.sale !== false &&
                        product.sale !== 0;
        const isHot = product.hot === true; // Có phải sản phẩm trending không

        // Tính giá sau giảm nếu có sale
        let discountedPrice = null;
        if (hasSale) {
            discountedPrice = Math.round(product.price * (1 - product.sale / 100));
        }

        // Tạo HTML badge (SALE xx% hoặc HOT)
        let badgeHTML = '';
        if (hasSale) {
            badgeHTML = `<div class="badge badge-sale">SALE ${product.sale}%</div>`;
        } else if (isHot) {
            badgeHTML = `<div class="badge badge-hot">HOT</div>`;
        }

        // Tạo HTML hiển thị giá: nếu có sale thì hiện giá gốc + giá mới
        let priceHTML = '';
        if (hasSale) {
            priceHTML = `<p class="card-price">
                <span class="old-price">${formatPrice(product.price)}</span>
                <span class="new-price">${formatPrice(discountedPrice)}</span>
               </p>`;
        } else {
            priceHTML = `<p class="card-price">${formatPrice(product.price)}</p>`;
        }

        // Tạo phần tử card và gán nội dung HTML
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            ${badgeHTML}
            <div class="img-placeholder">
                <img src="${product.images[0]}" alt="${product.name}" loading="lazy"
                     onerror="this.src='https://placehold.co/500x500/e0e8f4/0056b3?text=No+Image'">
            </div>
            <div class="card-content">
                <h3 class="card-title">${product.name}</h3>
                ${priceHTML}
                <button class="btn btn-primary btn-add">Thêm vào giỏ</button>
            </div>
        `;

        // ── Xử lý sự kiện "Thêm vào giỏ" ─────────────────────────────
        card.querySelector('.btn-add').addEventListener('click', function (e) {
            e.preventDefault();

            // Kiểm tra đăng nhập trước khi cho phép thêm vào giỏ
            const session = JSON.parse(localStorage.getItem('eb_session') || 'null');
            if (!session) {
                showNotification('⚠️ Vui lòng đăng nhập để thêm vào giỏ hàng!', '#e67e22');
                setTimeout(function() {
                    // Lưu URL hiện tại để redirect về sau khi đăng nhập
                    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
                    window.location.href = `/pages/auth/auth.html?mode=login&returnUrl=${returnUrl}`;
                }, 1500);
                return;
            }

            // Lấy giá thực tế (sau giảm hoặc giá gốc)
            let price = '';
            if (hasSale) {
                price = formatPrice(discountedPrice);
            } else {
                price = formatPrice(product.price);
            }

            // Mặc định chọn size đầu tiên trong danh sách sizes của sản phẩm
            let size = 'S';
            if (product.sizes && product.sizes.length > 0) {
                size = product.sizes[0];
            }

            // Tìm xem sản phẩm (cùng id + size) đã có trong giỏ chưa
            const existingProduct = cart.find(function(p) {
                return p.id === product.id && p.size === size;
            });
            if (existingProduct) {
                // Đã có → chỉ tăng số lượng
                existingProduct.quantity++;
            } else {
                // Chưa có → thêm mới vào mảng giỏ hàng
                cart.push({
                    id: product.id,
                    title: product.name,
                    price,
                    quantity: 1,
                    image: product.images[0],
                    size: size,
                    availableSizes: product.sizes
                });
            }

            // Lưu giỏ hàng cập nhật vào localStorage
            localStorage.setItem(_cartKey, JSON.stringify(cart));

            // Cập nhật số đếm trên icon giỏ hàng ở header
            updateCartCount();

            // Hiển thị thông báo xác nhận
            showNotification(`Đã thêm ${product.name} vào giỏ hàng!`);

            // Phản hồi trực quan trên nút: đổi text + màu trong 2 giây
            const btn = this;
            const originalText = btn.textContent;
            btn.textContent = '✓ Đã thêm';
            btn.style.background = 'linear-gradient(135deg, #4CAF50, #81C784)';
            setTimeout(function() {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        });

        return card;
    }

    /**
     * Render danh sách sản phẩm vào 2 grid: HOT và SALE
     * @param {Array} products - Mảng sản phẩm từ products.json
     */
    function renderProducts(products) {
        const hotGrid  = document.getElementById('hot-grid');   // Khu vực sản phẩm xu hướng
        const saleGrid = document.getElementById('sale-grid');  // Khu vực sản phẩm giảm giá

        // Nếu không tìm thấy grid → đang không ở trang chủ, dừng lại
        if (!hotGrid || !saleGrid) {
            return;
        }

        products.forEach(function(product) {
            const hasSale = product.sale !== '' && product.sale !== null &&
                            product.sale !== undefined && product.sale !== false &&
                            product.sale !== 0;
            const isHot = product.hot === true;
            const card = createCard(product);

            // Phân loại và đưa card vào grid tương ứng
            if (hasSale) {
                saleGrid.appendChild(card);      // Sản phẩm giảm giá → khu Sale
            } else if (isHot) {
                hotGrid.appendChild(card);       // Sản phẩm hot → khu Xu Hướng
            }
        });

        // Sau khi render xong → khởi động tính năng kéo carousel
        initDrag();
    }

    // ── Tải dữ liệu sản phẩm từ file JSON và render ────────────────────
    fetch('/assets/products.json')
        .then(function(res) {
            return res.json();
        })
        .then(function(products) {
            return renderProducts(products);
        })
        .catch(function(err) {
            return console.error('Không thể tải products.json:', err);
        });

    // ── CAROUSEL DRAG (kéo ngang bằng chuột và cảm ứng) ───────────────
    function initDrag() {
        // Lấy tất cả grid có thuộc tính data-scrollable="true"
        const grids = document.querySelectorAll('.grid[data-scrollable="true"]');

        grids.forEach(function(grid) {
            let isDown = false;       // Đang giữ chuột/chạm không
            let startX, scrollLeft;  // Vị trí bắt đầu và scrollLeft ban đầu

            // ── Mouse Events (máy tính) ────────────────────────────────
            grid.addEventListener('mousedown', function(e) {
                isDown = true;
                grid.classList.add('dragging');
                startX = e.pageX - grid.offsetLeft;
                scrollLeft = grid.scrollLeft;
            });

            // Nhả chuột hoặc rời khỏi vùng → dừng kéo
            grid.addEventListener('mouseleave', function() { isDown = false; grid.classList.remove('dragging'); });
            grid.addEventListener('mouseup',    function() { isDown = false; grid.classList.remove('dragging'); });

            grid.addEventListener('mousemove', function(e) {
                if (!isDown) {
                    return;
                }
                e.preventDefault(); // Ngăn chọn text khi kéo
                const x = e.pageX - grid.offsetLeft;
                // Nhân 2 để kéo nhanh hơn (cảm giác mượt mà)
                grid.scrollLeft = scrollLeft - (x - startX) * 2;
            });

            // ── Touch Events (điện thoại/máy tính bảng) ───────────────
            grid.addEventListener('touchstart', function(e) {
                isDown = true;
                startX = e.touches[0].pageX - grid.offsetLeft;
                scrollLeft = grid.scrollLeft;
            });
            grid.addEventListener('touchend', function() { isDown = false; });
            grid.addEventListener('touchmove', function(e) {
                if (!isDown) {
                    return;
                }
                const x = e.touches[0].pageX - grid.offsetLeft;
                grid.scrollLeft = scrollLeft - (x - startX) * 2;
            });
        });
    }

    /**
     * Cập nhật số lượng sản phẩm hiển thị trên icon giỏ hàng ở Header
     * Chỉ hiển thị số lượng khi đã đăng nhập
     */
    function updateCartCount() {
        const loggedIn = !!JSON.parse(localStorage.getItem('eb_session') || 'null');
        // Tính tổng số lượng tất cả sản phẩm trong giỏ
        let total = 0;
        if (loggedIn) {
            total = cart.reduce(function(sum, item) {
                return sum + item.quantity;
            }, 0);
        }

        // Cập nhật cả 2 span (desktop + mobile) để tránh bug duplicate ID
        document.querySelectorAll('#cart-count, #cart-count-mobile').forEach(function(el) {
            el.textContent = `(${total})`;
        });
    }

    /**
     * Hiển thị thông báo toast (popup nhỏ góc phải màn hình)
     * @param {string} message - Nội dung thông báo
     * @param {string} color   - Màu nền (mặc định xanh lá thành công)
     */
    function showNotification(message, color = '#4CAF50') {
        // Xóa mọi notification đang hiển thị để tránh chồng chất
        document.querySelectorAll('[data-notification]').forEach(function(n) {
            n.remove();
        });

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

        // Sau 2 giây: chạy animation trượt ra và xóa khỏi DOM
        setTimeout(function() {
            notification.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(function() {
                notification.remove();
            }, 500);
        }, 2000);
    }

    // ── Định nghĩa keyframes animation trượt phải cho notification toast
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

    // Ghi chú: Logic User Menu (avatar + dropdown) đã được chuyển
    // sang components.js để chạy global trên tất cả các trang

    // ── Nút giỏ hàng trong nav → hiện thông báo số lượng ──────────────
    const cartBtn = document.querySelector('.btn-cart');
    if (cartBtn) {
        cartBtn.addEventListener('click', function() {
            const total = cart.reduce(function(sum, item) {
                return sum + item.quantity;
            }, 0);
            showNotification(`Giỏ hàng có ${total} sản phẩm`);
        });
    }
});
