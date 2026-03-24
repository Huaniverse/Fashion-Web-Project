/* ===================================================
   CART.JS — DEUX | Logic Giỏ Hàng
   Chức năng:
     - Kiểm tra đăng nhập khi vào trang
     - Hiển thị, cập nhật, xóa sản phẩm trong giỏ
     - Áp dụng mã giảm giá (coupon)
     - Điều hướng từng bước: Giỏ → Giao hàng → Thanh toán → Xác nhận
     - Tự động điền thông tin giao hàng từ session
     - Validate form giao hàng và thông tin thẻ ngân hàng
     - Hiệu ứng confetti sau khi đặt hàng thành công
   =================================================== */

document.addEventListener('DOMContentLoaded', function() {

    // ── Lấy các phần tử điều hướng navbar ──────────────────────────────
    const mobileToggle  = document.getElementById('mobile-toggle');
    const navMenu       = document.getElementById('nav-menu');
    const mobileActions = document.querySelector('.nav-mobile-actions');

    // Toggle hiển thị menu mobile khi bấm hamburger
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            if (mobileActions) {
                if (navMenu.classList.contains('active')) {
                    mobileActions.style.display = 'flex';
                } else {
                    mobileActions.style.display = 'none';
                }
            }
        });
    }

    // Thay đổi style header khi scroll (tương tự main.js)
    const header = document.querySelector('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            // Đã scroll xuống → header đậm, shadow rõ hơn
            header.style.boxShadow = '0 15px 40px rgba(0,51,102,0.15)';
            header.style.background = 'rgba(253, 251, 247, 0.92)';
        } else {
            // Đầu trang → header trong suốt hơn
            header.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.1)';
            header.style.background = 'rgba(253, 251, 247, 0.7)';
        }
    });

    // ── KIỂM TRA ĐĂNG NHẬP ─────────────────────────────────────────────
    // Nếu chưa đăng nhập → chuyển hướng về trang login, lưu URL để redirect lại
    const session = JSON.parse(localStorage.getItem('eb_session') || 'null');
    if (!session) {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/pages/auth/auth.html?mode=login&returnUrl=${returnUrl}`;
        return; // Dừng thực thi phần còn lại
    }

    // ── BIẾN TRẠNG THÁI TOÀN CỤC ──────────────────────────────────────
    let cartKey = 'cart:guest';
    if (session) {
        cartKey = `cart:${session.email}`;
    }
    let cart        = JSON.parse(localStorage.getItem(cartKey)) || []; // Mảng sản phẩm trong giỏ
    let currentStep = 1;     // Bước hiện tại trong quy trình thanh toán (1-4)
    let discount    = 0;     // Phần trăm giảm giá từ coupon (0-100)
    let shippingFee = 0;     // Phí vận chuyển (0 = miễn phí)
    let appliedCoupon = '';  // Mã coupon đã áp dụng (để tránh áp dụng 2 lần)

    // Danh sách mã giảm giá hợp lệ: { mã: % giảm }
    const COUPONS = {
        'DEUX10': 10,
        'BLUE20': 20,
        'VIP30':  30,
    };

    // ── CẬP NHẬT SỐ LƯỢNG ICON GIỎ HÀNG TRÊN HEADER ──────────────────
    function updateCartCount() {
        const total = cart.reduce(function(sum, item) {
            return sum + item.quantity;
        }, 0);
        // Cập nhật cả 2 phần tử (desktop + mobile) để tránh bug duplicate ID
        document.querySelectorAll('#cart-count, #cart-count-mobile').forEach(function(el) {
            el.textContent = `(${total})`;
        });
    }

    // ── ĐỊNH DẠNG VÀ PARSE GIÁ TIỀN ───────────────────────────────────

    /**
     * Định dạng số thành chuỗi tiền VNĐ
     * @param {number} n - Số tiền
     * @returns {string} VD: 1.200.000đ
     */
    function formatPrice(n) {
        return n.toLocaleString('vi-VN') + 'đ';
    }

    /**
     * Chuyển chuỗi tiền về số nguyên
     * @param {string} str - VD: "1.200.000đ"
     * @returns {number} 1200000
     */
    function parsePrice(str) {
        return parseInt(str.replace(/[^\d]/g, '')) || 0;
    }

    // ── TÍNH TOÁN GIÁ TRỊ ĐƠN HÀNG ────────────────────────────────────

    /** Tính tổng tiền hàng (chưa tính giảm giá và phí ship) */
    function calcSubtotal() {
        return cart.reduce(function(sum, item) {
            return sum + parsePrice(item.price) * item.quantity;
        }, 0);
    }

    /** Tính tổng tiền cuối cùng (sau giảm giá + phí ship) */
    function calcTotal() {
        const sub = calcSubtotal();
        const discountAmount = Math.round(sub * discount / 100);
        return sub - discountAmount + shippingFee;
    }

    /** Tính số tiền được giảm từ coupon */
    function calcDiscountAmount() {
        return Math.round(calcSubtotal() * discount / 100);
    }

    // ── CẬP NHẬT SỐ LƯỢNG SẢN PHẨM TẠI CHỖ (không re-render toàn bộ) ─
    /**
     * Cập nhật số lượng và tổng tiền của 1 item mà không vẽ lại toàn bộ giỏ
     * @param {number} idx - Chỉ số item trong mảng cart
     */
    function updateItemInPlace(idx) {
        const item   = cart[idx];
        const itemEl = document.querySelector(`.cart-item[data-idx="${idx}"]`);
        if (!itemEl) {
            return;
        }

        // Cập nhật hiển thị số lượng và thành tiền của item đó
        itemEl.querySelector('.qty-num').textContent   = item.quantity;
        itemEl.querySelector('.item-total').textContent = formatPrice(parsePrice(item.price) * item.quantity);

        updateCartCount();
        updateSummary(); // Cập nhật bảng tổng tiền bên phải
    }

    // ── RENDER TOÀN BỘ GIỎ HÀNG ────────────────────────────────────────
    function renderCart() {
        const list        = document.getElementById('cart-items-list'); // Vùng chứa danh sách sản phẩm
        const emptyEl     = document.getElementById('cart-empty');       // Thông báo "giỏ hàng trống"
        const btnCheckout = document.getElementById('btn-to-step2');     // Nút "Tiến hành đặt hàng"

        list.innerHTML = ''; // Xóa nội dung cũ trước khi render lại

        // Nếu giỏ rỗng → hiển thị thông báo trống và vô hiệu nút đặt hàng
        if (cart.length === 0) {
            emptyEl.classList.add('show');
            btnCheckout.disabled = true;
            updateSummary();
            return;
        }

        emptyEl.classList.remove('show');
        btnCheckout.disabled = false;

        // Render từng sản phẩm trong giỏ
        cart.forEach(function(item, idx) {
            const itemEl = document.createElement('div');
            itemEl.className   = 'cart-item';
            itemEl.dataset.idx = idx; // Lưu index để xử lý sự kiện sau

            // Dùng ảnh sản phẩm làm background, fallback về màu nền nếu không có ảnh
            let imgStyle = `background: rgba(0,86,179,0.1)`;
            if (item.image) {
                imgStyle = `background-image: url('${item.image}')`;
            }

            // Tạo HTML card sản phẩm (có dropdown chọn size, nút ±, nút xóa)
            itemEl.innerHTML = `
                <div class="item-img" style="${imgStyle}"></div>
                <div class="item-info">
                    <div class="item-name">${item.title}</div>
                    <div class="item-size-selector" style="margin-bottom: 8px;">
                        <span style="font-size: 13px; color: #666; margin-right: 5px;">Size:</span>
                        <select class="size-select" data-idx="${idx}" style="padding: 2px 8px; border-radius: 4px; border: 1px solid #ddd; font-size: 13px; outline: none; cursor: pointer;">
                            ${(item.availableSizes || ['S', 'M', 'L', 'XL']).map(function(s) {
                                let selected = '';
                                if (item.size === s) {
                                    selected = 'selected';
                                }
                                return `<option value="${s}" ${selected}>${s}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div class="item-price-unit">${item.price} / sản phẩm</div>
                    <div class="qty-control">
                        <button class="qty-btn btn-minus" data-idx="${idx}">−</button>
                        <span class="qty-num">${item.quantity}</span>
                        <button class="qty-btn btn-plus" data-idx="${idx}">+</button>
                    </div>
                </div>
                <div class="item-total">${formatPrice(parsePrice(item.price) * item.quantity)}</div>
                <button class="btn-remove-item" data-idx="${idx}" title="Xóa sản phẩm">
                    <i class="fas fa-times"></i>
                </button>
            `;

            list.appendChild(itemEl);
        });

        // ── Sự kiện thay đổi Size trong dropdown ──────────────────────
        list.querySelectorAll('.size-select').forEach(function(select) {
            select.addEventListener('change', function(e) {
                const idx         = Number(e.target.dataset.idx);
                const newSize     = e.target.value;
                const currentItem = cart[idx];

                // Kiểm tra xem đã có sản phẩm cùng id + size mới trong giỏ chưa (ngoại trừ chính item này)
                const existIdx = cart.findIndex(function(p, i) {
                    return i !== idx && p.id === currentItem.id && p.size === newSize;
                });

                if (existIdx !== -1) {
                    // Đã có → gộp số lượng vào item kia rồi xóa item hiện tại
                    cart[existIdx].quantity += currentItem.quantity;
                    cart.splice(idx, 1);
                } else {
                    // Chưa có → cập nhật size trực tiếp
                    currentItem.size = newSize;
                }

                saveCart();
                renderCart(); // Render lại vì index mảng có thể thay đổi
            });
        });

        // ── Nút Giảm số lượng (−) ─────────────────────────────────────
        list.querySelectorAll('.btn-minus').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const idx = Number(btn.dataset.idx);
                if (cart[idx].quantity > 1) {
                    // Còn > 1 → giảm đi 1 và cập nhật tại chỗ
                    cart[idx].quantity--;
                    updateItemInPlace(idx);
                } else {
                    // Số lượng = 1 → xóa luôn sản phẩm với hiệu ứng trượt ra
                    const itemEl = btn.closest('.cart-item');
                    itemEl.style.transition = 'all 0.3s ease';
                    itemEl.style.opacity    = '0';
                    itemEl.style.transform  = 'translateX(30px)';
                    setTimeout(function() {
                        cart.splice(idx, 1);
                        saveCart();
                        renderCart();
                    }, 280);
                    return;
                }
                saveCart();
            });
        });

        // ── Nút Tăng số lượng (+) ─────────────────────────────────────
        list.querySelectorAll('.btn-plus').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const idx = Number(btn.dataset.idx);
                cart[idx].quantity++;
                updateItemInPlace(idx);
                saveCart();
            });
        });

        // ── Nút Xóa sản phẩm (×) ──────────────────────────────────────
        list.querySelectorAll('.btn-remove-item').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const idx    = Number(btn.dataset.idx);
                const itemEl = btn.closest('.cart-item');
                // Hiệu ứng trượt ra trước khi xóa khỏi DOM
                itemEl.style.animation  = 'none';
                itemEl.style.transition = 'all 0.3s ease';
                itemEl.style.opacity    = '0';
                itemEl.style.transform  = 'translateX(30px)';
                setTimeout(function() {
                    cart.splice(idx, 1);
                    saveCart();
                    renderCart();
                }, 280);
            });
        });

        updateSummary();
    }

    // ── CẬP NHẬT BẢNG TỔNG KẾT ĐƠN HÀNG ──────────────────────────────
    function updateSummary() {
        const sub    = calcSubtotal();
        const discAmt = calcDiscountAmount();
        const total  = calcTotal();

        // Cập nhật từng dòng trong bảng summary
        setEl('subtotal',    formatPrice(sub));
        setEl('total-price', formatPrice(total));
        let feeText = formatPrice(shippingFee);
        if (shippingFee === 0) {
            feeText = 'Miễn phí';
        }
        setEl('shipping-fee', feeText);

        // Hiện/ẩn dòng giảm giá tùy thuộc vào có coupon không
        const discRow = document.getElementById('discount-row');
        if (discount > 0) {
            discRow.style.display = 'flex';
            setEl('discount-amount', `-${formatPrice(discAmt)}`);
        } else {
            discRow.style.display = 'none';
        }

        // Đổi màu chữ "Miễn phí" để nổi bật
        const feeEl = document.getElementById('shipping-fee');
        if (feeEl) {
            if (shippingFee === 0) {
                feeEl.className = 'fee-free';
            } else {
                feeEl.className = '';
            }
        }
    }

    /** Helper: Set text cho element theo ID */
    function setEl(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    /** Lưu giỏ hàng vào localStorage và cập nhật badge */
    function saveCart() {
        localStorage.setItem(cartKey, JSON.stringify(cart));
        updateCartCount();
    }

    // ── XÓA TẤT CẢ SẢN PHẨM (có modal xác nhận) ──────────────────────
    const clearCartModal = document.getElementById('clear-cart-modal');
    const confirmClearBtn = document.getElementById('confirm-clear');
    const cancelClearBtn  = document.getElementById('cancel-clear');

    // Nút "Xóa tất cả" → mở modal xác nhận
    document.getElementById('btn-clear').addEventListener('click', function() {
        if (cart.length === 0) {
            return; // Không làm gì nếu giỏ đã rỗng
        }
        clearCartModal.classList.add('show');
    });

    // Xác nhận xóa → xóa toàn bộ giỏ hàng
    confirmClearBtn.addEventListener('click', function() {
        cart = [];
        saveCart();
        renderCart();
        clearCartModal.classList.remove('show');
    });

    // Đóng modal (nút Hủy hoặc click ra ngoài)
    const closeClearModal = function() {
        return clearCartModal.classList.remove('show');
    };
    cancelClearBtn.addEventListener('click', closeClearModal);
    clearCartModal.addEventListener('click', function(e) {
        if (e.target === clearCartModal) {
            closeClearModal(); // Click backdrop → đóng
        }
    });

    // ── MÃ GIẢM GIÁ (COUPON) ───────────────────────────────────────────
    document.getElementById('btn-coupon').addEventListener('click', function() {
        const code = document.getElementById('coupon-input').value.trim().toUpperCase();
        const msg  = document.getElementById('coupon-msg');

        if (!code) {
            msg.textContent = 'Vui lòng nhập mã giảm giá.';
            msg.className = 'coupon-msg error';
            return;
        }

        if (appliedCoupon === code) {
            // Tránh áp dụng cùng mã 2 lần
            msg.textContent = 'Mã này đã được áp dụng.';
            msg.className = 'coupon-msg error';
            return;
        }

        if (COUPONS[code]) {
            // Mã hợp lệ → áp dụng giảm giá
            discount      = COUPONS[code];
            appliedCoupon = code;
            msg.textContent = `✓ Áp dụng thành công! Giảm ${discount}%`;
            msg.className = 'coupon-msg success';
            updateSummary();
        } else {
            msg.textContent = 'Mã giảm giá không hợp lệ.';
            msg.className = 'coupon-msg error';
        }
    });

    // ── MINI SUMMARY (tóm tắt đơn hàng hiển thị ở bước 2 và 3) ────────
    /**
     * Render bảng tóm tắt đơn hàng nhỏ gọn
     * @param {string} containerId - ID của phần tử chứa mini summary
     */
    function renderMiniSummary(containerId) {
        const el = document.getElementById(containerId);
        if (!el) return;

        const total = calcTotal();

        // Render từng sản phẩm dạng mini (ảnh + tên + số lượng + thành tiền)
        const items = cart.map(function(item) {
            let imgStyle = '';
            if (item.image) {
                imgStyle = `background-image: url('${item.image}')`;
            }
            let sizeHTML = '';
            if (item.size) {
                sizeHTML = `<span style="font-size: 11px; color: #888;">Size: ${item.size}</span>`;
            }
            return `
                <div class="mini-item">
                    <div class="mini-item-img" style="${imgStyle}"></div>
                    <div style="display: flex; flex-direction: column; flex: 1; min-width: 0;">
                        <span class="mini-item-name">${item.title} ×${item.quantity}</span>
                        ${sizeHTML}
                    </div>
                    <span class="mini-item-price">${formatPrice(parsePrice(item.price) * item.quantity)}</span>
                </div>
            `;
        }).join('');

        // Lắp ráp toàn bộ HTML mini summary
        el.innerHTML = `
            <div class="mini-summary-title">Đơn Hàng Của Bạn</div>
            ${items}
            <div class="mini-divider"></div>
            ${discount > 0 ? `
                <div class="summary-row" style="margin-bottom:8px;">
                    <span style="font-size:13px;color:#888">Giảm giá (${discount}%)</span>
                    <span style="font-size:13px;color:#4CAF50;font-weight:600">-${formatPrice(calcDiscountAmount())}</span>
                </div>
            ` : ''}
            ${shippingFee > 0 ? `
                <div class="summary-row" style="margin-bottom:8px;">
                    <span style="font-size:13px;color:#888">Phí vận chuyển</span>
                    <span style="font-size:13px;font-weight:600">${formatPrice(shippingFee)}</span>
                </div>
            ` : ''}
            <div class="mini-total-row">
                <span>Tổng cộng</span>
                <span>${formatPrice(total)}</span>
            </div>
        `;
    }

    // ── ĐIỀU HƯỚNG CÁC BƯỚC THANH TOÁN ────────────────────────────────
    /**
     * Chuyển sang bước chỉ định (1→4)
     * Ẩn bước hiện tại, hiện bước mới, cập nhật step indicator
     * @param {number} n - Số bước muốn chuyển đến
     */
    function goToStep(n) {
        // Ẩn nội dung bước hiện tại
        document.getElementById(`step-${currentStep}`).classList.add('hidden');

        // Cập nhật trạng thái step indicator (active/done)
        const prevInd = document.getElementById(`step-ind-${currentStep}`);
        if (n > currentStep) {
            prevInd.classList.remove('active');
            prevInd.classList.add('done'); // Bước đã hoàn thành
        } else {
            prevInd.classList.remove('done', 'active');
            if (currentStep > 1) prevInd.classList.add('active');
        }

        // Cập nhật đường kẻ nối giữa các bước (step-line)
        for (let i = 1; i <= 3; i++) {
            const lines = document.querySelectorAll('.step-line');
            if (lines[i - 1]) {
                lines[i - 1].classList.toggle('done', i < n);
            }
        }

        currentStep = n;

        // Hiện nội dung bước mới
        const nextStep = document.getElementById(`step-${n}`);
        nextStep.classList.remove('hidden');

        // Đồng bộ lại tất cả step indicators
        document.querySelectorAll('.step').forEach(function(s, i) {
            s.classList.remove('active');
            if (i + 1 === n) {
                s.classList.add('active');
            }
            if (i + 1 < n)  {
                s.classList.remove('active');
                s.classList.add('done');
            }
            if (i + 1 > n)  {
                s.classList.remove('active', 'done');
            }
        });

        // Cuộn về đầu trang khi chuyển bước
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Render mini summary khi vào bước 2 và 3
        if (n === 2) renderMiniSummary('mini-summary-2');
        if (n === 3) renderMiniSummary('mini-summary-3');
    }

    // Bước 1 → 2: Chuyển sang nhập thông tin giao hàng
    document.getElementById('btn-to-step2').addEventListener('click', function() {
        if (cart.length === 0) {
            return; // Chặn nếu giỏ rỗng
        }
        goToStep(2);
    });

    // Bước 2 → 3: Validate thông tin giao hàng rồi mới cho qua
    document.getElementById('btn-to-step3').addEventListener('click', function() {
        if (!validateShipping()) {
            return;
        }
        goToStep(3);
    });

    // ── TỰ ĐỘNG ĐIỀN THÔNG TIN GIAO HÀNG TỪ SESSION ───────────────────
    function prefillShipping() {
        if (!session) return;

        const nameEl    = document.getElementById('ship-name');
        const phoneEl   = document.getElementById('ship-phone');
        const emailEl   = document.getElementById('ship-email');
        const addressEl = document.getElementById('ship-address');
        const cityEl    = document.getElementById('ship-city');

        // Điền từng field nếu có dữ liệu trong session
        if (nameEl    && session.fullname) nameEl.value    = session.fullname;
        if (phoneEl   && session.phone)    phoneEl.value   = session.phone;
        if (emailEl   && session.email)    emailEl.value   = session.email;
        if (addressEl && session.address)  addressEl.value = session.address;

        // Khôi phục thành phố đã chọn lần trước (lưu theo email)
        if (cityEl) {
            const savedCity = localStorage.getItem(`city:${session.email}`);
            if (savedCity) {
                cityEl.value = savedCity;
            }

            // Tự động lưu khi người dùng thay đổi thành phố
            cityEl.addEventListener('change', function() {
                localStorage.setItem(`city:${session.email}`, cityEl.value);
            });
        }
    }
    prefillShipping();

    // Nút Quay lại bước 2 từ bước 3
    document.getElementById('btn-back-2').addEventListener('click', function() {
        return goToStep(2);
    });

    // Nút Quay lại bước 1 từ bước 2
    document.getElementById('btn-back-1').addEventListener('click', function() {
        return goToStep(1);
    });

    // ── VALIDATE FORM THÔNG TIN GIAO HÀNG ─────────────────────────────
    function validateShipping() {
        // Danh sách các field bắt buộc
        const fields = [
            { id: 'ship-name',    label: 'Họ và tên' },
            { id: 'ship-phone',   label: 'Số điện thoại' },
            { id: 'ship-email',   label: 'Email' },
            { id: 'ship-address', label: 'Địa chỉ' },
        ];

        let valid = true;
        fields.forEach(function(f) {
            const el = document.getElementById(f.id);
            if (!el.value.trim()) {
                el.classList.add('error'); // Highlight field bị bỏ trống
                el.addEventListener('input', function() {
                    return el.classList.remove('error');
                }, { once: true });
                valid = false;
            }
        });

        // Validate định dạng email
        const email = document.getElementById('ship-email');
        if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
            email.classList.add('error');
            valid = false;
        }

        if (!valid) {
            showNotif('Vui lòng điền đầy đủ thông tin bắt buộc.', 'error');
        }
        return valid;
    }

    // ── PHƯƠNG THỨC VẬN CHUYỂN ────────────────────────────────────────
    // Khi chọn phương thức ship → cập nhật phí và re-render summary
    document.querySelectorAll('input[name="shipping"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            // Xóa class selected khỏi tất cả option, thêm vào option đang chọn
            document.querySelectorAll('.method-option').forEach(function(opt) {
                opt.classList.remove('selected');
            });
            radio.closest('.method-option').classList.add('selected');

            // Giao hàng nhanh: 30.000đ; Giao hàng thường: miễn phí
            if (radio.value === 'express') {
                shippingFee = 30000;
            } else {
                shippingFee = 0;
            }
            updateSummary();
            renderMiniSummary('mini-summary-2');
        });
    });

    // ── PHƯƠNG THỨC THANH TOÁN ─────────────────────────────────────────
    // Khi chọn phương thức thanh toán → hiện/ẩn form tương ứng
    document.querySelectorAll('.pay-option').forEach(function(opt) {
        opt.addEventListener('click', function() {
            document.querySelectorAll('.pay-option').forEach(function(o) {
                o.classList.remove('selected');
            });
            opt.classList.add('selected');
            opt.querySelector('input').checked = true;

            const method = opt.dataset.method;
            // Toggle hiển thị từng form theo method được chọn
            document.getElementById('card-form').classList.toggle('hidden', method !== 'card');
            document.getElementById('momo-form').classList.toggle('hidden', method !== 'momo');
            document.getElementById('cod-form').classList.toggle('hidden', method !== 'cod');
        });
    });

    // ── ĐỊNH DẠNG TỰ ĐỘNG CÁC TRƯỜNG THÔNG TIN THẺ ────────────────────
    const cardNumber = document.getElementById('card-number');
    const cardHolder = document.getElementById('card-holder');
    const cardExpiry = document.getElementById('card-expiry');

    // Số thẻ: tự thêm dấu cách mỗi 4 số, cập nhật preview thẻ
    cardNumber.addEventListener('input', function(e) {
        let val = e.target.value.replace(/\D/g, '').substring(0, 16); // Chỉ lấy tối đa 16 chữ số
        const chunks = val.match(/.{1,4}/g);
        if (chunks) {
            val = chunks.join(' ');
        }
        e.target.value = val;

        // Cập nhật hiển thị số thẻ trên ảnh preview (dùng • cho vị trí chưa nhập)
        const digits = val.replace(/\s/g, '');
        let masked = '';
        for (let i = 0; i < 16; i++) {
            if (i > 0 && i % 4 === 0) {
                masked += ' ';
            }
            masked += digits[i] || '•';
        }
        document.getElementById('card-num-display').textContent = masked;
    });

    // Tên chủ thẻ: tự chuyển thành chữ HOA, cập nhật preview
    cardHolder.addEventListener('input', function(e) {
        let val = e.target.value.toUpperCase();
        if (!val) {
            val = 'TÊN CHỦ THẺ';
        }
        document.getElementById('card-holder-display').textContent = val.substring(0, 22);
    });

    // Ngày hết hạn: tự thêm dấu / giữa tháng và năm (MM/YY)
    cardExpiry.addEventListener('input', function(e) {
        let val = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (val.length >= 3) {
            val = val.substring(0, 2) + '/' + val.substring(2);
        }
        e.target.value = val;
        document.getElementById('card-expiry-display').textContent = val || 'MM/YY';
    });

    // ── VALIDATE THÔNG TIN THẺ TRƯỚC KHI THANH TOÁN ───────────────────
    function validateCard() {
        // Chỉ validate nếu đang chọn phương thức "thẻ ngân hàng"
        const method = document.querySelector('input[name="payment"]:checked')?.value;
        if (method !== 'card') return true;

        let valid = true;
        const num = cardNumber.value.replace(/\s/g, '');

        // Kiểm tra số thẻ phải đúng 16 chữ số
        if (num.length !== 16) { cardNumber.classList.add('error'); valid = false; }

        // Kiểm tra tên chủ thẻ không được để trống
        if (!cardHolder.value.trim()) { cardHolder.classList.add('error'); valid = false; }

        // Kiểm tra ngày hết hạn đúng định dạng MM/YY
        const exp = cardExpiry.value;
        if (!/^\d{2}\/\d{2}$/.test(exp)) { cardExpiry.classList.add('error'); valid = false; }

        // Kiểm tra CVV phải đúng 3 chữ số
        const cvv = document.getElementById('card-cvv');
        if (cvv.value.length !== 3) { cvv.classList.add('error'); valid = false; }

        // Xóa class lỗi khi người dùng bắt đầu nhập lại
        [cardNumber, cardHolder, cardExpiry, cvv].forEach(function(el) {
            el.addEventListener('input', function() {
                return el.classList.remove('error');
            }, { once: true });
        });

        return valid;
    }

    // ── NÚT THANH TOÁN ─────────────────────────────────────────────────
    document.getElementById('btn-pay').addEventListener('click', function() {
        if (!validateCard()) {
            showNotif('Vui lòng kiểm tra thông tin thẻ.', 'error');
            return;
        }

        // Disable nút và hiện trạng thái "Đang xử lý..."
        const btn = document.getElementById('btn-pay');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Đang xử lý...</span>';

        // Giả lập thời gian xử lý thanh toán (2.2 giây)
        setTimeout(function() {
            processOrder();
        }, 2200);
    });

    // ── XỬ LÝ ĐƠN HÀNG SAU KHI THANH TOÁN THÀNH CÔNG ─────────────────
    function processOrder() {
        // Tạo mã đơn hàng ngẫu nhiên
        const orderId = '#ETH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const now     = new Date();
        const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const totalStr = formatPrice(calcTotal());

        // Hiển thị thông tin đơn hàng trên trang xác nhận (bước 4)
        document.getElementById('order-id').textContent            = orderId;
        document.getElementById('order-date').textContent          = dateStr;
        document.getElementById('order-total-confirm').textContent = totalStr;

        // Chuyển sang bước 4 (màn hình xác nhận đặt hàng thành công)
        goToStep(4);

        // Xóa giỏ hàng sau khi đặt thành công
        cart = [];
        saveCart();

        // Bắn confetti ăn mừng
        spawnConfetti();
    }

    // ── HIỆU ỨNG CONFETTI (ĐẶT HÀNG THÀNH CÔNG) ──────────────────────
    function spawnConfetti() {
        const wrap   = document.getElementById('confetti-wrap');
        const colors = ['#003366', '#0056b3', '#FFD700', '#4CAF50', '#FF6B6B', '#fff'];

        // Tạo 60 mảnh confetti rơi xuống với độ trễ xen kẽ
        for (let i = 0; i < 60; i++) {
            (function(index) {
                setTimeout(function() {
                    const piece = document.createElement('div');
                    piece.className = 'confetti-piece';

                    // Vị trí ngẫu nhiên theo chiều ngang
                    piece.style.left = Math.random() * 100 + '%';

                    // Màu ngẫu nhiên từ bảng màu thương hiệu
                    piece.style.background = colors[Math.floor(Math.random() * colors.length)];

                    // Kích thước ngẫu nhiên (4-12px)
                    piece.style.width  = (Math.random() * 8 + 4) + 'px';
                    piece.style.height = (Math.random() * 8 + 4) + 'px';

                    // Hình dạng: tròn hoặc vuông
                    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';

                    // Thời gian rơi ngẫu nhiên (1.5-3.5 giây)
                    piece.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
                    piece.style.animationDelay    = '0s';
                    piece.style.top = '-10px'; // Bắt đầu từ trên cùng

                    wrap.appendChild(piece);
                    setTimeout(function() {
                        piece.remove();
                    }, 4000); // Xóa sau 4 giây
                }, index * 40); // Mỗi mảnh cách nhau 40ms để tạo hiệu ứng liên tục
            })(i);
        }
    }

    // ── HIỂN THỊ THÔNG BÁO TOAST (góc phải màn hình) ──────────────────
    /**
     * @param {string} message - Nội dung thông báo
     * @param {'success'|'error'} type - Loại thông báo (ảnh hưởng màu nền)
     */
    function showNotif(message, type = 'success') {
        document.querySelectorAll('[data-notif]').forEach(function(n) {
            n.remove();
        }); // Xóa thông báo cũ
        const n = document.createElement('div');
        n.setAttribute('data-notif', '1');
        n.style.cssText = `
            position: fixed; top: 90px; right: 20px;
            background: ${type === 'error' ? '#cc3333' : '#4CAF50'};
            color: white; padding: 14px 22px; border-radius: 10px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            z-index: 9999; font-weight: 600; font-size: 14px;
            font-family: 'Poppins', sans-serif;
            animation: notifIn 0.4s ease-out;
        `;
        n.textContent = message;
        document.body.appendChild(n);

        // Inject keyframes animation nếu chưa có
        const style = document.createElement('style');
        style.textContent = `
            @keyframes notifIn  { from { transform: translateX(300px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes notifOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(300px); opacity: 0; } }
        `;
        document.head.appendChild(style);

        // Tự xóa thông báo sau 2.5 giây với animation trượt ra
        setTimeout(function() {
            n.style.animation = 'notifOut 0.4s ease-out forwards';
            setTimeout(function() {
                n.remove();
            }, 400);
        }, 2500);
    }

    // ── KHỞI TẠO VÀ ĐỒNG BỘ DỮ LIỆU GIỎ HÀNG ─────────────────────────
    /**
     * Tải products.json và đồng bộ lại giá/tên/ảnh sản phẩm trong giỏ
     * (phòng trường hợp dữ liệu sản phẩm thay đổi sau khi thêm vào giỏ)
     */
    async function initCart() {
        try {
            const res      = await fetch('/assets/products.json');
            const products = await res.json();

            if (cart.length > 0) {
                // Cập nhật lại thông tin mới nhất cho từng sản phẩm trong giỏ
                cart = cart.map(function(item) {
                    const product = products.find(function(p) {
                        return p.id === item.id;
                    });
                    if (product) {
                        let hasSale = false;
                        if (product.sale && Number(product.sale) > 0) {
                            hasSale = true;
                        }
                        let finalPriceNum = product.price;
                        if (hasSale) {
                            finalPriceNum = Math.round(product.price * (1 - Number(product.sale) / 100));
                        }

                        return {
                            ...item,
                            title:          product.name,
                            price:          formatPrice(finalPriceNum),
                            image:          product.images[0],
                            availableSizes: product.sizes
                        };
                    }
                    return item; // Giữ nguyên nếu không tìm thấy sản phẩm
                });
                saveCart();
            }
        } catch (err) {
            console.error('Lỗi đồng bộ giỏ hàng:', err);
        }

        updateCartCount();
        renderCart(); // Render giỏ hàng sau khi đồng bộ xong
    }

    initCart(); // Khởi động ứng dụng

    // Gợi ý mã coupon demo sau 1.5 giây nếu có sản phẩm trong giỏ
    setTimeout(function() {
        if (cart.length > 0) {
            showNotif('💡 Thử mã: DEUX10, BLUE20, VIP30');
        }
    }, 1500);
});
