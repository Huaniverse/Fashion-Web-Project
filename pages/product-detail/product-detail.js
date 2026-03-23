document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));

    // Fetch dữ liệu thật
    fetch('/assets/products.json')
        .then(res => res.json())
        .then(products => {
            const product = products.find(p => p.id === id);

            if (!product) {
                document.querySelector('.product-layout').innerHTML = "<h2>Sản phẩm không tồn tại</h2>";
                return;
            }

            // Render dữ liệu cơ bản
            document.getElementById("productName").textContent = product.name;
            
            const hasSale = product.sale && Number(product.sale) > 0;
            const priceEl = document.getElementById("productPrice");
            
            if (hasSale) {
                const salePrice = Math.round(product.price * (1 - Number(product.sale) / 100));
                priceEl.innerHTML = `
                    <span class="old-price">${product.price.toLocaleString("vi-VN")}đ</span>
                    <span class="badge sale">-${product.sale}%</span>
                    <span class="new-price">${salePrice.toLocaleString("vi-VN")}đ</span>
                `;
            } else {
                priceEl.innerHTML = `<span class="new-price">${product.price.toLocaleString("vi-VN")}đ</span>`;
            }

            document.getElementById("productImage").src = product.images[0];
            document.getElementById("productDescription").textContent = product.description;

            // Logic Slider (Hiển thị tất cả ảnh)
            let currentImageIndex = 0;
            const prevBtn = document.getElementById("prevImageBtn");
            const nextBtn = document.getElementById("nextImageBtn");
            const productImgEl = document.getElementById("productImage");
            const thumbnailGallery = document.getElementById("thumbnailGallery");

            function updateMainImage(index) {
                currentImageIndex = index;
                productImgEl.style.opacity = '0.5';
                setTimeout(() => {
                    productImgEl.src = product.images[currentImageIndex];
                    productImgEl.style.opacity = '1';
                }, 150);

                // Update thumbnail active state
                document.querySelectorAll('.thumbnail-item').forEach((item, idx) => {
                    item.classList.toggle('active', idx === currentImageIndex);
                });
            }

            if (product.images && product.images.length > 1) {
                // Hiển thị nút nếu có nhiều hơn 1 ảnh
                prevBtn.classList.remove("hidden");
                nextBtn.classList.remove("hidden");

                // Render thumbnails
                thumbnailGallery.innerHTML = product.images.map((img, idx) => `
                    <div class="thumbnail-item ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                        <img src="${img}" alt="${product.name} ${idx + 1}">
                    </div>
                `).join("");

                // Thumbnail clicks
                document.querySelectorAll('.thumbnail-item').forEach(item => {
                    item.onclick = () => {
                        const idx = parseInt(item.getAttribute('data-index'));
                        updateMainImage(idx);
                    };
                });

                prevBtn.onclick = () => {
                    const newIndex = (currentImageIndex - 1 + product.images.length) % product.images.length;
                    updateMainImage(newIndex);
                };

                nextBtn.onclick = () => {
                    const newIndex = (currentImageIndex + 1) % product.images.length;
                    updateMainImage(newIndex);
                };
            }

            // Logic số lượng
            let qty = 1;
            const qtyVal = document.getElementById("quantity-val");
            document.getElementById("btn-plus").onclick = () => { qty++; qtyVal.innerText = qty; };
            document.getElementById("btn-minus").onclick = () => { if(qty > 1) qty--; qtyVal.innerText = qty; };

            // Logic chọn size
            const sizePicker = document.querySelector(".size-picker");
            if (product.sizes && product.sizes.length > 0) {
                sizePicker.innerHTML = product.sizes.map((s, i) => 
                    `<button class="size-btn ${i === 0 ? 'active' : ''}">${s}</button>`
                ).join("");
            } else {
                sizePicker.innerHTML = `<button class="size-btn active">Free Size</button>`;
            }

            const sizeBtns = document.querySelectorAll(".size-btn");
            sizeBtns.forEach(btn => {
                btn.onclick = () => {
                    sizeBtns.forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                }
            });

            // Thêm vào giỏ hàng (Đồng bộ với localStorage của main.js)
            document.getElementById("addToCart").onclick = () => {
                // Kiểm tra đăng nhập
                const session = JSON.parse(localStorage.getItem('eb_session') || 'null');
                if (!session) {
                    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
                    alert('Vui lòng đăng nhập để thêm vào giỏ hàng!');
                    window.location.href = `/pages/auth/auth.html?mode=login&returnUrl=${returnUrl}`;
                    return;
                }

                let cart = JSON.parse(localStorage.getItem(`cart:${session.email}`)) || []; // Sửa key giỏ hàng để đồng bộ
                const sizeBtn = document.querySelector(".size-btn.active");
                if (!sizeBtn) { alert('Vui lòng chọn size!'); return; }
                const size = sizeBtn.innerText;

                const hasSale = product.sale && Number(product.sale) > 0;
                const finalPrice = hasSale 
                    ? Math.round(product.price * (1 - Number(product.sale) / 100)) 
                    : product.price;

                const cartItem = {
                    id: product.id,
                    title: product.name,
                    price: finalPrice.toLocaleString("vi-VN") + "đ", // Định dạng tiền giống main.js
                    size: size,
                    quantity: qty,
                    image: product.images[0],
                    availableSizes: product.sizes
                };

                const existing = cart.find(item => item.id === product.id && item.size === size);
                if (existing) {
                    existing.quantity += qty;
                } else {
                    cart.push(cartItem);
                }

                localStorage.setItem(`cart:${session.email}`, JSON.stringify(cart));
                
                // Cập nhật số lượng trên Header ngay lập tức không cần reload
                const cartCount = document.getElementById('cart-count');
                if (cartCount) {
                    cartCount.textContent = `(${cart.reduce((sum, item) => sum + item.quantity, 0)})`;
                }

                // Copy Notification function từ main.js để hiển thị
                if (typeof showNotification === 'function') {
                    showNotification(`Đã thêm ${product.name} vào giỏ hàng!`);
                } else {
                    const n = document.createElement('div');
                    n.style.cssText = `
                        position: fixed; top: 90px; right: 20px;
                        background: #4CAF50; color: white; padding: 14px 22px; border-radius: 10px;
                        box-shadow: 0 8px 25px rgba(0,0,0,0.2); z-index: 9999; font-weight: 600;
                        transition: all 0.4s ease; transform: translateX(300px); opacity: 0;
                    `;
                    n.textContent = `Đã thêm ${product.name} vào giỏ hàng!`;
                    document.body.appendChild(n);
                    
                    setTimeout(() => { n.style.transform = 'translateX(0)'; n.style.opacity = '1'; }, 10);
                    setTimeout(() => { n.style.transform = 'translateX(300px)'; n.style.opacity = '0'; }, 2000);
                    setTimeout(() => n.remove(), 2400);
                }
            };
        })
        .catch(err => {
            console.error('Lỗi khi tải dữ liệu sản phẩm:', err);
            document.querySelector('.product-layout').innerHTML = "<h2>Đã có lỗi xảy ra. Vui lòng thử lại sau.</h2>";
        });

    // Cập nhật số lượng giỏ hàng trên Header (từ main.js)
    const cartCount = document.getElementById('cart-count');
    const sessionStore = JSON.parse(localStorage.getItem('eb_session') || 'null');
    const cartKey = sessionStore ? `cart:${sessionStore.email}` : 'cart:guest';
    let currentCart = JSON.parse(localStorage.getItem(cartKey)) || [];
    if(cartCount) {
        cartCount.textContent = `(${currentCart.reduce((sum, item) => sum + item.quantity, 0)})`;
    }
});