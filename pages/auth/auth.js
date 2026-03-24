/* ===== AUTH.JS — DEUX =====
   Xử lý đăng ký, đăng nhập, quên mật khẩu
   Lưu trữ qua localStorage:
     - "eb_users"       : mảng tài khoản đã đăng ký
     - "eb_session"     : tài khoản đang đăng nhập (không có mật khẩu)
     - "eb_remembered_email" : email được ghi nhớ khi tick "Ghi nhớ đăng nhập"
     - "eb_reset"       : token reset mật khẩu tạm thời (demo)
   ===================================== */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════
   UTILS — Các hàm tiện ích dùng chung
   ═══════════════════════════════════════════════════════════════════════ */

/** Lấy danh sách tất cả users từ localStorage */
function getUsers() {
    return JSON.parse(localStorage.getItem('eb_users') || '[]');
}

/** Lưu danh sách users vào localStorage */
function saveUsers(users) {
    localStorage.setItem('eb_users', JSON.stringify(users));
}

/** Lấy session đang đăng nhập (trả về null nếu chưa đăng nhập) */
function getSession() {
    return JSON.parse(localStorage.getItem('eb_session') || 'null');
}

/**
 * Lưu session (KHÔNG lưu mật khẩu vào session để bảo mật)
 * @param {Object} user - Đối tượng user đã đăng nhập
 */
function setSession(user) {
    // Dùng destructuring để loại bỏ trường password trước khi lưu
    const { password, ...safeUser } = user;
    localStorage.setItem('eb_session', JSON.stringify(safeUser));
}

/**
 * Khởi tạo tài khoản demo mẫu nếu chưa tồn tại
 * Giúp người dùng mới dùng thử ngay mà không cần đăng ký
 */
function initDemoAccount() {
    const demoEmail = 'test@gmail.com';
    const users = getUsers();
    // Kiểm tra xem tài khoản demo đã có chưa
    if (!users.find(function(u) {
        return u.email === demoEmail;
    })) {
        users.push({
            id:        'demo',
            fullname:  'Demo User',
            email:     demoEmail,
            password:  'test1234',
            phone:     '0987654321',
            address:   'CTU, Can Tho',
            contact:   ['email'],
            createdAt: new Date().toISOString()
        });
        saveUsers(users);
    }
}

/** Đăng xuất: xóa session và quay về trang chủ */
function logout() {
    localStorage.removeItem('eb_session');
    window.location.href = '/index.html';
}

/**
 * Hiển thị thông báo lỗi hoặc thành công trong form
 * @param {string} containerId - ID của phần tử chứa thông báo
 * @param {string} message     - Nội dung thông báo
 * @param {'error'|'success'|'info'} type - Loại thông báo (ảnh hưởng màu sắc)
 */
function showMessage(containerId, message, type = 'error') {
    let box = document.getElementById(containerId);
    if (!box) {
        // Tạo phần tử mới nếu chưa có trong DOM
        box = document.createElement('div');
        box.id = containerId;
        // Chèn vào trước nút submit của form đang active
        const btn = document.querySelector('.active .btn-auth-submit, .active .btn-reset-password');
        if (btn) {
            btn.parentNode.insertBefore(box, btn);
        }
    }
    box.textContent = message;
    box.className   = 'auth-msg auth-msg--' + type;

    // Tự động ẩn thông báo thành công sau 4 giây
    if (type === 'success') {
        setTimeout(function() {
            box.textContent = '';
            box.className = '';
        }, 4000);
    }
}

/**
 * Kiểm tra định dạng email hợp lệ (basic regex)
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Kiểm tra số điện thoại Việt Nam hợp lệ
 * Chấp nhận: 0xxxxxxxxx hoặc +84xxxxxxxxx (10 chữ số sau 0/+84)
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
    return /^(0|\+84)[0-9]{9}$/.test(phone.replace(/\s/g, ''));
}

/* ═══════════════════════════════════════════════════════════════════════
   INJECT CSS CHO MESSAGE BOX (chạy ngay khi load file)
   ═══════════════════════════════════════════════════════════════════════ */
(function injectAuthMsgStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Kiểu chung cho tất cả thông báo trong form auth */
        .auth-msg {
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 12px;
            text-align: center;
            animation: fadeIn .3s ease;
        }
        /* Thông báo lỗi: nền đỏ nhạt */
        .auth-msg--error {
            background: #fff0f0;
            color: #c0392b;
            border: 1px solid #f5c6c6;
        }
        /* Thông báo thành công: nền xanh lá nhạt */
        .auth-msg--success {
            background: #f0fff4;
            color: #27ae60;
            border: 1px solid #b2dfdb;
        }
        /* Thông báo thông tin: nền xanh dương nhạt */
        .auth-msg--info {
            background: #e8f4fd;
            color: #1a6ea8;
            border: 1px solid #bee3f8;
        }
        /* Input bị lỗi validation: viền đỏ */
        .input-group input.invalid {
            border-color: #c0392b !important;
            box-shadow: 0 0 0 3px rgba(192,57,43,0.1) !important;
        }
    `;
    document.head.appendChild(style);
})();

/* ═══════════════════════════════════════════════════════════════════════
   CẬP NHẬT THANH NAVIGATION THEO TRẠNG THÁI ĐĂNG NHẬP
   ═══════════════════════════════════════════════════════════════════════ */
function updateNavBySession() {
    const session  = getSession();
    const loginBtns = document.querySelectorAll('.btn-login');

    loginBtns.forEach(function(btn) {
        if (session) {
            // Đã đăng nhập → hiển thị tên ngắn (từ cuối cùng của fullname) thay cho "Đăng nhập"
            const firstName = session.fullname
                ? session.fullname.trim().split(/\s+/).pop()  // Lấy từ cuối (thường là tên)
                : session.email.split('@')[0];                // Fallback: phần trước @

            btn.innerHTML = `<i class="far fa-user"></i> ${firstName}`;
            btn.title     = 'Nhấn để đăng xuất';
            btn.style.cursor = 'pointer';

            // Click vào tên → hiện hộp thoại xác nhận đăng xuất
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm(`Đăng xuất tài khoản "${session.email}"?`)) {
                    logout();
                }
            });
        }
        // Nếu chưa đăng nhập → giữ nguyên button "Đăng nhập" mặc định
    });
}

/* ═══════════════════════════════════════════════════════════════════════
   FORM ĐĂNG KÝ
   ═══════════════════════════════════════════════════════════════════════ */
function initRegister() {
    const form = document.querySelector('.register-form');
    if (!form) {
        return; // Không có form đăng ký trên trang này → bỏ qua
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault(); // Ngăn form submit mặc định (reload trang)

        // ── Lấy giá trị từ các input ────────────────────────────────
        const fullname = document.getElementById('fullname').value.trim();
        const email    = document.getElementById('email').value.trim().toLowerCase();
        const phone    = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirm  = document.getElementById('confirm-password').value;
        const address  = document.getElementById('address').value.trim();

        // ── Xóa trạng thái lỗi cũ trước khi validate ───────────────
        const inputs = form.querySelectorAll('input');
        inputs.forEach(function(i) {
            i.classList.remove('invalid');
        });

        // ── VALIDATION từng field ────────────────────────────────────
        if (!fullname) {
            document.getElementById('fullname').classList.add('invalid');
            return showMessage('register-msg', 'Vui lòng nhập họ tên.');
        }
        if (!isValidEmail(email)) {
            document.getElementById('email').classList.add('invalid');
            return showMessage('register-msg', 'Email không hợp lệ.');
        }
        if (!isValidPhone(phone)) {
            document.getElementById('phone').classList.add('invalid');
            return showMessage('register-msg', 'Số điện thoại không hợp lệ (VD: 0912345678).');
        }
        if (password.length < 6) {
            document.getElementById('password').classList.add('invalid');
            return showMessage('register-msg', 'Mật khẩu tối thiểu 6 ký tự.');
        }
        if (password !== confirm) {
            document.getElementById('confirm-password').classList.add('invalid');
            return showMessage('register-msg', 'Mật khẩu xác nhận không khớp.');
        }
        if (!address) {
            document.getElementById('address').classList.add('invalid');
            return showMessage('register-msg', 'Vui lòng nhập địa chỉ.');
        }

        // ── Kiểm tra email đã được đăng ký chưa ─────────────────────
        const users = getUsers();
        if (users.find(function(u) {
            return u.email === email;
        })) {
            document.getElementById('email').classList.add('invalid');
            return showMessage('register-msg', 'Email này đã được đăng ký.');
        }

        // ── Lấy phương thức liên hệ được chọn (checkbox) ────────────
        const contact = [...form.querySelectorAll('input[name="contact"]:checked')]
            .map(function(cb) {
                return cb.value;
            });

        // ── Tạo đối tượng user mới và lưu vào localStorage ──────────
        const newUser = {
            id:        Date.now(),      // ID duy nhất dựa trên timestamp
            fullname,
            email,
            phone,
            password, // Lưu thẳng (demo) — thực tế nên hash bằng bcrypt hoặc tương tự
            address,
            contact,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        saveUsers(users);

        // ── Thông báo thành công và chuyển sang form đăng nhập ───────
        showMessage('register-msg', '🎉 Đăng ký thành công! Đang chuyển đến trang đăng nhập...', 'success');
        setTimeout(function() {
            if (typeof showSection === 'function') {
                // Nếu có hàm showSection (single-page auth) → chuyển tab
                showSection('login');
                showMessage('login-msg', '✅ Đăng ký thành công! Hãy đăng nhập.', 'success');
            } else {
                // Fallback: reload sang trang login
                window.location.href = 'auth.html?mode=login&registered=1';
            }
        }, 1500);
    });
}

/* ═══════════════════════════════════════════════════════════════════════
   FORM ĐĂNG NHẬP
   ═══════════════════════════════════════════════════════════════════════ */
function initLogin() {
    const form = document.querySelector('.login-form');
    if (!form) {
        return; // Không có form login trên trang này → bỏ qua
    }

    // Hiển thị thông báo chào mừng nếu vừa đăng ký xong
    if (new URLSearchParams(location.search).get('registered')) {
        showMessage('login-msg', '✅ Đăng ký thành công! Hãy đăng nhập.', 'success');
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // ── Lấy giá trị nhập vào ────────────────────────────────────
        const email    = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;
        const remember = form.querySelector('input[type="checkbox"]')?.checked;

        // ── Xóa lỗi cũ ──────────────────────────────────────────────
        form.querySelectorAll('input').forEach(function(i) {
            i.classList.remove('invalid');
        });

        // ── VALIDATION ───────────────────────────────────────────────
        if (!isValidEmail(email)) {
            document.getElementById('email').classList.add('invalid');
            return showMessage('login-msg', 'Email không hợp lệ.');
        }
        if (!password) {
            document.getElementById('password').classList.add('invalid');
            return showMessage('login-msg', 'Vui lòng nhập mật khẩu.');
        }

        // ── Kiểm tra thông tin tài khoản ─────────────────────────────
        const users = getUsers();
        const user  = users.find(function(u) {
            return u.email === email && u.password === password;
        });

        if (!user) {
            // Sai email hoặc mật khẩu → highlight cả 2 field
            document.getElementById('email').classList.add('invalid');
            document.getElementById('password').classList.add('invalid');
            return showMessage('login-msg', 'Email hoặc mật khẩu không đúng.');
        }

        // ── Đăng nhập thành công: lưu session ───────────────────────
        setSession(user);

        // Lưu hoặc xóa email ghi nhớ theo tùy chọn người dùng
        if (remember) {
            localStorage.setItem('eb_remembered_email', email);
        } else {
            localStorage.removeItem('eb_remembered_email');
        }

        showMessage('login-msg', `✅ Chào mừng trở lại, ${user.fullname || user.email}!`, 'success');

        // Chuyển hướng: về URL trước khi bị redirect đến login, hoặc về trang chủ
        setTimeout(function() {
            const params    = new URLSearchParams(location.search);
            const returnUrl = params.get('returnUrl');
            let finalUrl = '/index.html';
            if (returnUrl) {
                finalUrl = decodeURIComponent(returnUrl);
            }
            window.location.href = finalUrl;
        }, 1200);
    });

    // ── Tự động điền email đã ghi nhớ vào input ─────────────────────
    const remembered = localStorage.getItem('eb_remembered_email');
    if (remembered) {
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = remembered;
            // Tick vào checkbox "Ghi nhớ đăng nhập"
            const cb = form.querySelector('input[type="checkbox"]');
            if (cb) cb.checked = true;
        }
    }
}

/* ═══════════════════════════════════════════════════════════════════════
   FORM QUÊN MẬT KHẨU
   ═══════════════════════════════════════════════════════════════════════ */
function initForgot() {
    const form = document.querySelector('.simple-form');
    if (!form) {
        return;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('reset-email').value.trim().toLowerCase();
        const input = document.getElementById('reset-email');

        input.classList.remove('invalid');

        // ── Validate email ───────────────────────────────────────────
        if (!isValidEmail(email)) {
            input.classList.add('invalid');
            return showMessage('forgot-msg', 'Email không hợp lệ.');
        }

        // ── Kiểm tra email có tồn tại trong hệ thống không ──────────
        const users = getUsers();
        const user  = users.find(function(u) {
            return u.email === email;
        });

        if (!user) {
            input.classList.add('invalid');
            return showMessage('forgot-msg', 'Email này chưa được đăng ký trong hệ thống.');
        }

        // ── Tạo token reset mật khẩu (DEMO) ─────────────────────────
        // Trong thực tế: gửi link reset qua email với token có thời hạn
        // Ở đây: lưu token vào localStorage và hiển thị cho người dùng
        const resetToken = Math.random().toString(36).slice(2, 10).toUpperCase();
        localStorage.setItem('eb_reset', JSON.stringify({
            email,
            token:  resetToken,
            expiry: Date.now() + 15 * 60 * 1000 // Token hết hạn sau 15 phút
        }));

        // Thông báo dạng "info" với token demo
        showMessage(
            'forgot-msg',
            `📧 Đã ghi nhận! (Demo) Token đặt lại: ${resetToken} — Trong thực tế sẽ gửi qua email.`,
            'info'
        );

        // Vô hiệu hóa form sau khi đã gửi yêu cầu (tránh gửi lại nhiều lần)
        form.style.opacity       = '0.4';
        form.style.pointerEvents = 'none';
    });
}

/* ═══════════════════════════════════════════════════════════════════════
   KHỞI ĐỘNG — Gọi khi DOM đã sẵn sàng
   ═══════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
    updateNavBySession(); // Cập nhật nav theo trạng thái đăng nhập hiện tại
    initDemoAccount();    // Đảm bảo tài khoản demo luôn tồn tại
    initRegister();       // Khởi tạo form đăng ký
    initLogin();          // Khởi tạo form đăng nhập
    initForgot();         // Khởi tạo form quên mật khẩu
});
