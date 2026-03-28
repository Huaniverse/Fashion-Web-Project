# Wireframe Trang Giỏ Hàng (Cart) - DEUX | Luxury Style (Chi tiết CSS & Cấu trúc)

Tài liệu này mô tả cấu trúc phân cấp, **class**, **kiểu `display`**, và khi có **CSS Grid** thì ghi **cấp độ grid container (G1, G2, …)** cùng **cấp độ grid item (I1, I2, …)**.

---

## 1. Sơ đồ Phân cấp & Kiểu hiển thị (Hierarchy & Display)

Dưới đây là cấu trúc phân cấp các thành phần chính cùng với kiểu `display` tương ứng:

- **Body** (`display: block`)
  - **Header** (`display: flex`) - Fixed top
  - **Main.cart-main** (`display: block`)
    - **.cart-wrapper** (`display: block`)
      - **.step-bar** (`display: flex`) - Hiển thị 4 bước (Giỏ hàng, Giao hàng, Thanh toán, Xác nhận)
        - `.step` (`display: flex; flex-direction: column`)
          - `.step-circle` (`display: flex`)
          - `span` (`display: inline-block`)
        - `.step-line` (`display: block`)

      - **.cart-step#step-1** (`display: block`) - Bước 1: Giỏ hàng
        - **.cart-layout** (`display: grid` hoặc `flex`) — **Grid container G1** (khi dùng `grid`)
          - **.cart-items-panel** (`display: flex; flex-direction: column`) — **Grid item I1**
            - `.panel-header` (`display: flex; justify-content: space-between`)
            - `#cart-empty` (`display: none` hoặc `flex` theo trạng thái data)
            - `#cart-items-list` (`display: block`) - Danh sách sản phẩm (được map vào bởi JS)
          - **.cart-summary-panel** (`display: block`) — **Grid item I1**
            - `.summary-card` (`display: flex; flex-direction: column`)
              - `.summary-row` (`display: flex; justify-content: space-between`)
              - `.coupon-box` (`display: flex`)
              - `.btn-checkout` (`display: inline-flex`)

      - **.cart-step#step-2** (`display: none`) - Bước 2: Giao hàng
        - **.cart-layout** (`display: grid` hoặc `flex`) — **G1** (khi `grid`)
          - **.form-panel** (`display: block`) — **Grid item I1** (cột form)
            - `.form-grid` (`display: grid`) — **Grid container G2** (lưới lồng trong form)
            - `.shipping-methods` (`display: flex; flex-direction: column`)
            - `.form-actions` (`display: flex; justify-content: space-between`)
          - **.cart-summary-panel** (`display: block`) — **Grid item I1** (cột tóm tắt)

      - **.cart-step#step-3** (`display: none`) - Bước 3: Thanh toán
        - **.cart-layout** (`display: grid` hoặc `flex`) — **G1**
          - **.form-panel** (`display: block`) — **Grid item I1**
            - `.payment-methods` (`display: flex`) - Ngang
            - `.card-form` (`display: none` hoặc `block` tùy user chọn)
              - `.credit-card-visual` (`display: block`)
              - `.form-grid` (`display: grid`) — **G2** (ô thẻ trong form thanh toán)
            - `#momo-form` (`display: none`)
            - `#cod-form` (`display: flex`)
            - `.form-actions` (`display: flex; justify-content: space-between`)
          - **.cart-summary-panel** (`display: block`) — **Grid item I1**

      - **.cart-step#step-4** (`display: none`) - Bước 4: Xác nhận
        - **.confirm-wrapper** (`display: flex; justify-content: center`)
          - **.confirm-card** (`display: flex; flex-direction: column; align-items: center`)
            - `.order-info-box` (`display: flex; flex-direction: column`)
            - `.confirm-actions` (`display: flex`)

  - **Footer** (`display: block`)

---

## 2. Chi tiết các Class CSS chính

### A. Step Bar
| Cấp độ | Thành phần | Class / ID | Display Type | Cấp độ Grid container | Cấp độ Grid item | Ghi chú |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | Thanh chỉ báo | `.step-bar` | `flex` | — | — | Canh ngang các bước |
| 2 | Bước đang chọn | `.step.active` | `flex (column)` | — | — | `.active`: Màu khác biệt |

### B. Giỏ hàng & Cột Tóm tắt
| Cấp độ | Thành phần | Class / ID | Display Type | Cấp độ Grid container | Cấp độ Grid item | Ghi chú |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | Bố cục 2 cột | `.cart-layout` | `grid` / `flex` | **G1** (khi `grid`) | — | Tỷ lệ 2/1 hoặc 3/1; bước 1–3 |
| 2 | Box chứa SP | `.cart-items-panel` | `flex (column)` | — | **I1** | Con của `.cart-layout` (bước 1) |
| 2 | Cột Tính tiền | `.cart-summary-panel` | `block` | — | **I1** | Con của `.cart-layout`; sticky |
| 2 | Khối form giao hàng / TT | `.form-panel` | `block` | — | **I1** | Con của `.cart-layout` (bước 2–3) |

### C. Form Giao Hàng & Thanh Toán
| Cấp độ | Thành phần | Class / ID | Display Type | Cấp độ Grid container | Cấp độ Grid item | Ghi chú |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | Bảng điền thông tin | `.form-grid` | `grid` | **G2** | — | Lưới lồng trong `.form-panel`; chia 2 cột |
| 2 | Ô input trong `.form-grid` | `.input-group`, ô grid | *theo HTML* | — | **I2** | Con trực tiếp của `.form-grid` |
| 2 | Nhóm phương thức | `.shipping-methods`, `.payment-methods` | `flex` | — | — | `column` hoặc `row` |
| 3 | Thẻ Debit giả lập | `.credit-card-visual` | `block` | — | — | Tương tác thị giác |

---

## 3. Quy ước thiết kế chung (Common Utilities)
- **Nút bấm:** `.btn`, `.btn-primary`, `.btn-checkout` (Tất cả dùng `display: inline-flex`).
- **Nút lùi:** `.btn-back` (`display: inline-flex` với icon left).
- **Phân cách giá:** `.summary-row` (`display: flex; justify-content: space-between`).
- **Input:** `.input-field`, `.form-input` (Dùng `display: block` với `width: 100%`).
- **Ẩn/Hiện Bước:** `.hidden` (`display: none`).

---

*Cập nhật lần cuối: 28/03/2026*
