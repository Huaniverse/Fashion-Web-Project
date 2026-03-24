/* ===================================================
   PRODUCT-DETAIL.JS — DEUX | Chi Tiết Sản Phẩm
   Chức năng:
     - Lấy ID sản phẩm từ URL và tải dữ liệu từ products.json
     - Hiển thị thông tin, giá (có / không khuyến mãi)
     - Slider ảnh + thumbnail
     - Chọn size, chọn số lượng
     - Thêm vào giỏ hàng (đồng bộ localStorage theo email)
   =================================================== */

document.addEventListener('DOMContentLoaded', function() {

    // ── Lấy ID sản phẩm từ query string (?id=...)
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));

    // ── Tải danh sách sản phẩm từ file JSON
    fetch('/assets/products.json')
        .then(function(res) {
            return res.json();
        })
        .then(function(products) {
            // Tìm sản phẩm khớp với ID nhận được từ URL
            const product = products.find(function(p) {
                return p.id === id;
            });

            // Nếu không tìm thấy sản phẩm → hiển thị thông báo lỗi
            if (!product) {
                document.querySelector('.product-layout').innerHTML = "<h2>Sản phẩm không tồn tại</h2>";
                return;
            }

            // ── Hiển thị tên sản phẩm
            document.getElementById("productName").textContent = product.name;

            // ── Kiểm tra sản phẩm có đang giảm giá không
            const hasSale = product.sale && Number(product.sale) > 0;
            const priceEl = document.getElementById("productPrice");

            if (hasSale) {
                // Tính giá sau khi giảm (làm tròn)
                const salePrice = Math.round(product.price * (1 - Number(product.sale) / 100));
                // Hiển thị: giá gốc bị gạch + badge % giảm + giá mới
                priceEl.innerHTML = `
                    <span class="old-price">${product.price.toLocaleString("vi-VN")}đ</span>
                    <span class="badge badge-sale">-${product.sale}%</span>
                    <span class="new-price">${salePrice.toLocaleString("vi-VN")}đ</span>
                `;
            } else {
                // Không giảm giá → chỉ hiển thị giá bình thường
                priceEl.innerHTML = `<span class="new-price">${product.price.toLocaleString("vi-VN")}đ</span>`;
            }

            // ── Hiển thị ảnh đầu tiên và mô tả sản phẩm
            document.getElementById("productImage").src = product.images[0];
            document.getElementById("productDescription").textContent = product.description;

            // ── SLIDER ẢNH ──────────────────────────────────────────────
            let currentImageIndex = 0; // Chỉ số ảnh đang được hiển thị

            // Lấy các phần tử điều hướng slider
            const prevBtn = document.getElementById("prevImageBtn");
            const nextBtn = document.getElementById("nextImageBtn");
            const productImgEl = document.getElementById("productImage");
            const thumbnailGallery = document.getElementById("thumbnailGallery");

            /**
             * Cập nhật ảnh chính khi người dùng chuyển slide
             * @param {number} index - Chỉ số ảnh muốn hiển thị
             */
            function updateMainImage(index) {
                currentImageIndex = index;

                // Hiệu ứng mờ dần khi chuyển ảnh
                productImgEl.style.opacity = '0.5';
                setTimeout(function() {
                    productImgEl.src = product.images[currentImageIndex];
                    productImgEl.style.opacity = '1';
                }, 150);

                // Cập nhật trạng thái active cho thumbnail tương ứng
                document.querySelectorAll('.thumbnail-item').forEach(function(item, idx) {
                    item.classList.toggle('active', idx === currentImageIndex);
                });
            }

            // Chỉ khởi tạo slider nếu sản phẩm có nhiều hơn 1 ảnh
            if (product.images && product.images.length > 1) {

                // Hiện nút Prev/Next (mặc định bị ẩn với class "hidden")
                prevBtn.classList.remove("hidden");
                nextBtn.classList.remove("hidden");

                // ── Render danh sách thumbnail bên dưới ảnh chính
                thumbnailGallery.innerHTML = product.images.map(function(img, idx) {
                    let activeClass = '';
                    if (idx === 0) {
                        activeClass = 'active';
                    }
                    return `
                    <div class="thumbnail-item ${activeClass}" data-index="${idx}">
                        <img src="${img}" alt="${product.name} ${idx + 1}">
                    </div>
                `;
                }).join("");

                // Xử lý sự kiện click vào từng thumbnail → chuyển đến ảnh đó
                document.querySelectorAll('.thumbnail-item').forEach(function(item) {
                    item.onclick = function() {
                        const idx = parseInt(item.getAttribute('data-index'));
                        updateMainImage(idx);
                    };
                });

                // Nút Previous: quay lại ảnh trước (vòng tròn về cuối nếu đang ở đầu)
                prevBtn.onclick = function() {
                    const newIndex = (currentImageIndex - 1 + product.images.length) % product.images.length;
                    updateMainImage(newIndex);
                };

                // Nút Next: chuyển sang ảnh tiếp theo (vòng tròn về đầu nếu đang ở cuối)
                nextBtn.onclick = function() {
                    const newIndex = (currentImageIndex + 1) % product.images.length;
                    updateMainImage(newIndex);
                };
            }

            // ── CHỌN SỐ LƯỢNG ───────────────────────────────────────────
            let qty = 1; // Số lượng mặc định khi vào trang
            const qtyVal = document.getElementById("quantity-val");

            // Tăng số lượng khi nhấn nút "+"
            document.getElementById("btn-plus").onclick = function() {
                qty++;
                qtyVal.innerText = qty;
            };

            // Giảm số lượng (không cho xuống dưới 1) khi nhấn nút "-"
            document.getElementById("btn-minus").onclick = function() {
                if (qty > 1) {
                    qty--;
                }
                qtyVal.innerText = qty;
            };

            // ── CHỌN SIZE ────────────────────────────────────────────────
            const sizePicker = document.querySelector(".size-picker");

            if (product.sizes && product.sizes.length > 0) {
                // Render các nút size từ dữ liệu sản phẩm; size đầu tiên mặc định được chọn
                sizePicker.innerHTML = product.sizes.map(function(s, i) {
                    let activeClass = '';
                    if (i === 0) {
                        activeClass = 'active';
                    }
                    return `<button class="size-btn ${activeClass}">${s}</button>`;
                }).join("");
            } else {
                // Không có dữ liệu size → hiển thị Free Size
                sizePicker.innerHTML = `<button class="size-btn active">Free Size</button>`;
            }

            // Xử lý sự kiện chọn size: bỏ active khỏi tất cả, thêm active vào size vừa chọn
            const sizeBtns = document.querySelectorAll(".size-btn");
            sizeBtns.forEach(function(btn) {
                btn.onclick = function() {
                    sizeBtns.forEach(function(b) {
                        b.classList.remove("active");
                    });
                    btn.classList.add("active");
                };
            });

            // ── THÊM VÀO GIỎ HÀNG ───────────────────────────────────────
            document.getElementById("addToCart").onclick = function() {

                // Kiểm tra người dùng đã đăng nhập chưa
                const session = JSON.parse(localStorage.getItem('eb_session') || 'null');
                if (!session) {
                    // Lưu URL hiện tại để quay lại sau khi đăng nhập
                    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
                    alert('Vui lòng đăng nhập để thêm vào giỏ hàng!');
                    window.location.href = `/pages/auth/auth.html?mode=login&returnUrl=${returnUrl}`;
                    return;
                }

                // Lấy giỏ hàng của user hiện tại từ localStorage (key riêng theo email)
                let cart = JSON.parse(localStorage.getItem(`cart:${session.email}`)) || [];

                // Lấy size đang được chọn
                const sizeBtn = document.querySelector(".size-btn.active");
                if (!sizeBtn) { alert('Vui lòng chọn size!'); return; }
                const size = sizeBtn.innerText;

                // Tính giá cuối cùng (áp dụng giảm giá nếu có)
                const hasSaleCheck = product.sale && Number(product.sale) > 0;
                let finalPrice = product.price;
                if (hasSaleCheck) {
                    finalPrice = Math.round(product.price * (1 - Number(product.sale) / 100));
                }

                // Tạo đối tượng sản phẩm cho giỏ hàng
                const cartItem = {
                    id: product.id,
                    title: product.name,
                    price: finalPrice.toLocaleString("vi-VN") + "đ", // Định dạng tiền giống main.js
                    size: size,
                    quantity: qty,
                    image: product.images[0],
                    availableSizes: product.sizes
                };

                // Nếu sản phẩm (cùng id + size) đã tồn tại trong giỏ → tăng số lượng
                const existing = cart.find(function(item) {
                    return item.id === product.id && item.size === size;
                });
                if (existing) {
                    existing.quantity += qty;
                } else {
                    // Chưa có → thêm mới vào giỏ
                    cart.push(cartItem);
                }

                // Lưu lại giỏ hàng vào localStorage
                localStorage.setItem(`cart:${session.email}`, JSON.stringify(cart));

                // Cập nhật số lượng trên Header ngay lập tức (không cần reload trang)
                const cartCount = document.getElementById('cart-count');
                if (cartCount) {
                    const total = cart.reduce(function(sum, item) {
                        return sum + item.quantity;
                    }, 0);
                    cartCount.textContent = `(${total})`;
                }

                // Hiển thị thông báo xác nhận đã thêm
                // Ưu tiên dùng showNotification từ main.js nếu có, không thì tự tạo
                if (typeof showNotification === 'function') {
                    showNotification(`Đã thêm ${product.name} vào giỏ hàng!`);
                } else {
                    // Tự tạo notification toast đơn giản
                    const n = document.createElement('div');
                    n.style.cssText = `
                        position: fixed; top: 90px; right: 20px;
                        background: #4CAF50; color: white; padding: 14px 22px; border-radius: 10px;
                        box-shadow: 0 8px 25px rgba(0,0,0,0.2); z-index: 9999; font-weight: 600;
                        transition: all 0.4s ease; transform: translateX(300px); opacity: 0;
                    `;
                    n.textContent = `Đã thêm ${product.name} vào giỏ hàng!`;
                    document.body.appendChild(n);

                    // Hiệu ứng trượt vào từ phải
                    setTimeout(function() {
                        n.style.transform = 'translateX(0)';
                        n.style.opacity = '1';
                    }, 10);
                    // Hiệu ứng trượt ra sau 2 giây
                    setTimeout(function() {
                        n.style.transform = 'translateX(300px)';
                        n.style.opacity = '0';
                    }, 2000);
                    // Xóa khỏi DOM sau khi animation kết thúc
                    setTimeout(function() {
                        n.remove();
                    }, 2400);
                }
            };
        })
        .catch(function(err) {
            // Xử lý lỗi khi không tải được dữ liệu sản phẩm
            console.error('Lỗi khi tải dữ liệu sản phẩm:', err);
            document.querySelector('.product-layout').innerHTML = "<h2>Đã có lỗi xảy ra. Vui lòng thử lại sau.</h2>";
        });

    // ── Cập nhật số lượng giỏ hàng trên Header khi vào trang ──────────
    const cartCount = document.getElementById('cart-count');
    const sessionStore = JSON.parse(localStorage.getItem('eb_session') || 'null');
    const cartKey = sessionStore ? `cart:${sessionStore.email}` : 'cart:guest';
    let currentCart = JSON.parse(localStorage.getItem(cartKey)) || [];
    if (cartCount) {
        const total = currentCart.reduce(function(sum, item) {
            return sum + item.quantity;
        }, 0);
        cartCount.textContent = `(${total})`;
    }
});
