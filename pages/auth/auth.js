/* ===== AUTH.JS — Ethereal Blue =====
   Xử lý đăng ký, đăng nhập, quên mật khẩu
   Lưu trữ qua localStorage:
     - "eb_users"       : mảng tài khoản
     - "eb_session"     : tài khoản đang đăng nhập
   ===================================== */

'use strict';

/* ---------- UTILS ---------- */

/** Lấy danh sách users */
function getUsers() {
    return JSON.parse(localStorage.getItem('eb_users') || '[]');
}

/** Lưu danh sách users */
function saveUsers(users) {
    localStorage.setItem('eb_users', JSON.stringify(users));
}

/** Lấy session hiện tại (null nếu chưa đăng nhập) */
function getSession() {
    return JSON.parse(localStorage.getItem('eb_session') || 'null');
}

/** Lưu session */
function setSession(user) {
    // Không lưu mật khẩu vào session
    const { password, ...safeUser } = user;
    localStorage.setItem('eb_session', JSON.stringify(safeUser));
}

/** Đăng xuất */
function logout() {
    localStorage.removeItem('eb_session');
    window.location.href = '/index.html';
}

/** Hiển thị thông báo lỗi / thành công trong form */
function showMessage(containerId, message, type = 'error') {
    let box = document.getElementById(containerId);
    if (!box) {
        box = document.createElement('div');
        box.id = containerId;
        // Chèn trước nút submit
        const btn = document.querySelector('.btn-auth-submit, .btn-reset-password');
        if (btn) btn.parentNode.insertBefore(box, btn);
    }
    box.textContent = message;
    box.className = 'auth-msg auth-msg--' + type;

    // Tự ẩn sau 4s nếu là success
    if (type === 'success') {
        setTimeout(() => { box.textContent = ''; box.className = ''; }, 4000);
    }
}

/** Validate email cơ bản */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validate số điện thoại VN */
function isValidPhone(phone) {
    return /^(0|\+84)[0-9]{9}$/.test(phone.replace(/\s/g, ''));
}

/* ---------- INJECT CSS CHO MESSAGE BOX ---------- */
(function injectAuthMsgStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .auth-msg {
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 12px;
            text-align: center;
            animation: fadeIn .3s ease;
        }
        .auth-msg--error {
            background: #fff0f0;
            color: #c0392b;
            border: 1px solid #f5c6c6;
        }
        .auth-msg--success {
            background: #f0fff4;
            color: #27ae60;
            border: 1px solid #b2dfdb;
        }
        .auth-msg--info {
            background: #e8f4fd;
            color: #1a6ea8;
            border: 1px solid #bee3f8;
        }
        .input-group input.invalid {
            border-color: #c0392b !important;
            box-shadow: 0 0 0 3px rgba(192,57,43,0.1) !important;
        }
    `;
    document.head.appendChild(style);
})();

/* ---------- CẬP NHẬT NAV THEO SESSION ---------- */
function updateNavBySession() {
    const session = getSession();
    const loginBtns = document.querySelectorAll('.btn-login');

    loginBtns.forEach(btn => {
        if (session) {
            // Lấy tên ngắn (từ đầu tiên)
            const firstName = session.fullname
                ? session.fullname.trim().split(/\s+/).pop()
                : session.email.split('@')[0];

            btn.innerHTML = `<i class="far fa-user"></i> ${firstName}`;
            btn.title = 'Nhấn để đăng xuất';
            btn.style.cursor = 'pointer';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm(`Đăng xuất tài khoản "${session.email}"?`)) logout();
            });
        }
    });
}

/* ========================================================
   TRANG ĐĂNG KÝ — register.html
   ======================================================== */
function initRegister() {
    const form = document.querySelector('.register-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirm-password').value;
        const address = document.getElementById('address').value.trim();

        // --- Validation ---
        const inputs = form.querySelectorAll('input');
        inputs.forEach(i => i.classList.remove('invalid'));

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

        // --- Kiểm tra email đã tồn tại ---
        const users = getUsers();
        if (users.find(u => u.email === email)) {
            document.getElementById('email').classList.add('invalid');
            return showMessage('register-msg', 'Email này đã được đăng ký.');
        }

        // --- Lấy phương thức liên hệ ---
        const contact = [...form.querySelectorAll('input[name="contact"]:checked')]
            .map(cb => cb.value);

        // --- Lưu user mới ---
        const newUser = {
            id: Date.now(),
            fullname,
            email,
            phone,
            password, // thực tế nên hash; đây là demo localStorage
            address,
            contact,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        saveUsers(users);

        showMessage('register-msg', '🎉 Đăng ký thành công! Đang chuyển đến trang đăng nhập...', 'success');
        setTimeout(() => {
            window.location.href = 'login.html?registered=1';
        }, 1500);
    });
}

/* ========================================================
   TRANG ĐĂNG NHẬP — login.html
   ======================================================== */
function initLogin() {
    const form = document.querySelector('.login-form');
    if (!form) return;

    // Hiển thị thông báo sau khi đăng ký thành công
    if (new URLSearchParams(location.search).get('registered')) {
        showMessage('login-msg', '✅ Đăng ký thành công! Hãy đăng nhập.', 'success');
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;
        const remember = form.querySelector('input[type="checkbox"]')?.checked;

        // --- Validation ---
        form.querySelectorAll('input').forEach(i => i.classList.remove('invalid'));

        if (!isValidEmail(email)) {
            document.getElementById('email').classList.add('invalid');
            return showMessage('login-msg', 'Email không hợp lệ.');
        }
        if (!password) {
            document.getElementById('password').classList.add('invalid');
            return showMessage('login-msg', 'Vui lòng nhập mật khẩu.');
        }

        // --- Kiểm tra tài khoản ---
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            document.getElementById('email').classList.add('invalid');
            document.getElementById('password').classList.add('invalid');
            return showMessage('login-msg', 'Email hoặc mật khẩu không đúng.');
        }

        // --- Lưu session ---
        setSession(user);

        // Ghi nhớ email nếu chọn
        if (remember) {
            localStorage.setItem('eb_remembered_email', email);
        } else {
            localStorage.removeItem('eb_remembered_email');
        }

        showMessage('login-msg', `✅ Chào mừng trở lại, ${user.fullname || user.email}!`, 'success');
        setTimeout(() => {
            const params = new URLSearchParams(location.search);
            const returnUrl = params.get('returnUrl');
            window.location.href = returnUrl ? decodeURIComponent(returnUrl) : '/index.html';
        }, 1200);
    });

    // Điền sẵn email nếu có ghi nhớ
    const remembered = localStorage.getItem('eb_remembered_email');
    if (remembered) {
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = remembered;
            const cb = form.querySelector('input[type="checkbox"]');
            if (cb) cb.checked = true;
        }
    }
}

/* ========================================================
   TRANG QUÊN MẬT KHẨU — forgot.html
   ======================================================== */
function initForgot() {
    const form = document.querySelector('.simple-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('reset-email').value.trim().toLowerCase();
        const input = document.getElementById('reset-email');

        input.classList.remove('invalid');

        if (!isValidEmail(email)) {
            input.classList.add('invalid');
            return showMessage('forgot-msg', 'Email không hợp lệ.');
        }

        const users = getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            input.classList.add('invalid');
            return showMessage('forgot-msg', 'Email này chưa được đăng ký trong hệ thống.');
        }

        // --- Giả lập gửi email reset (demo) ---
        // Tạo token reset tạm thời lưu vào localStorage
        const resetToken = Math.random().toString(36).slice(2, 10).toUpperCase();
        localStorage.setItem('eb_reset', JSON.stringify({
            email,
            token: resetToken,
            expiry: Date.now() + 15 * 60 * 1000 // 15 phút
        }));

        showMessage(
            'forgot-msg',
            `📧 Đã ghi nhận! (Demo) Token đặt lại: ${resetToken} — Trong thực tế sẽ gửi qua email.`,
            'info'
        );

        // Ẩn form, hiện nút quay lại
        form.style.opacity = '0.4';
        form.style.pointerEvents = 'none';
    });
}

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
    updateNavBySession();
    initRegister();
    initLogin();
    initForgot();
});