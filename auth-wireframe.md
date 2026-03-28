# Wireframe Trang Tài Khoản (Auth) - DEUX | Luxury Style (Chi tiết CSS & Cấu trúc)

Tài liệu này mô tả cấu trúc phân cấp, **class**, **kiểu `display`**, và khi có **CSS Grid** thì ghi **cấp độ grid container (G1, G2, …)** cùng **cấp độ grid item (I1, I2, …)**.

---

## 1. Sơ đồ Phân cấp & Kiểu hiển thị (Hierarchy & Display)

Dưới đây là cấu trúc phân cấp các thành phần chính cùng với kiểu `display` tương ứng:

- **Body** (`display: block`)
  - **Header** (`display: flex`) - Fixed top
  - **Main.auth-wrapper** (`display: flex`) - Chứa các section
    - **Section#login-section.auth-container** (`display: flex` khi active, `none` khi tắt)
      - `.auth-header` (`display: block`)
      - `form.login-form` (`display: flex; flex-direction: column`)
        - `.input-group` (`display: flex; flex-direction: column`)
        - `.form-options` (`display: flex; justify-content: space-between`)
        - `#login-msg` (`display: block`)
        - `.btn-auth-submit` (`display: inline-flex`)
      - `.auth-card-footer` (`display: flex`)
    - **Section#register-section.auth-container** (`display: none` mặc định)
      - `.auth-header` (`display: block`)
      - `form.register-form` (`display: flex; flex-direction: column`)
        - `.form-grid` (`display: grid`) — **Grid container G1**
          - `.input-group` (`display: flex; flex-direction: column`) — **Grid item I1**
        - `.contact-to-you` (`display: block`)
          - `.checkbox-group` (`display: flex`)
        - `#register-msg` (`display: block`)
        - `.btn-auth-submit` (`display: inline-flex`)
      - `.auth-card-footer` (`display: flex`)
    - **Section#forgot-section.auth-container** (`display: none` mặc định)
      - `form.simple-form` (`display: flex; flex-direction: column`)
  - **Footer** (`display: block`)

---

## 2. Chi tiết các Class CSS chính

### A. Container Tổng
| Cấp độ | Thành phần | Class / ID | Display Type | Cấp độ Grid container | Cấp độ Grid item | Ghi chú |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | Main Box | `.auth-wrapper` | `flex` | — | — | Center nội dung |
| 2 | Khung từng form | `.auth-container` | `flex (column)` | — | — | Có `.active` để hiện |

### B. Form Đăng nhập
| Cấp độ | Thành phần | Class / ID | Display Type | Cấp độ Grid container | Cấp độ Grid item | Ghi chú |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | Form Đăng nhập | `.login-form` | `flex` | — | — | Canh dọc các input |
| 2 | Nhóm Input | `.input-group` | `flex` | — | — | Label và input (cột đơn) |
| 2 | Tùy chọn (Ghi nhớ...) | `.form-options` | `flex` | — | — | Layout ngang (Space between) |

### C. Form Đăng ký
| Cấp độ | Thành phần | Class / ID | Display Type | Cấp độ Grid container | Cấp độ Grid item | Ghi chú |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | Form Đăng ký | `.register-form` | `flex` | — | — | Canh dọc tổng thể |
| 2 | Lưới Form | `.form-grid` | `grid` | **G1** | — | Chia 2 cột; container lưới duy nhất trang auth |
| 3 | Ô trong lưới | `.input-group` (trong `.form-grid`) | `flex (column)` | — | **I1** | Mỗi ô là một grid item |
| 2 | Nhóm Checkbox | `.checkbox-group` | `flex` | — | — | Canh ngang các lựa chọn (không nằm trong grid) |

---

## 3. Quy ước thiết kế chung (Common Utilities)
- **Nút bấm:** `.btn`, `.btn-primary`, `.btn-round` (Tất cả dùng `display: inline-flex`).
- **Nút Submit Form:** `.btn-auth-submit` (`display: inline-flex`, `width: 100%`).
- **Input:** `.input-field` (Dùng `display: block` với `width: 100%`).
- **Nhãn lỗi/Thành công:** `#login-msg`, `#register-msg`.

---

*Cập nhật lần cuối: 28/03/2026*
