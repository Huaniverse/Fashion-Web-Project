# Wireframe Chi Tiết Sản Phẩm (Product Detail) - DEUX | Luxury Style (Chi tiết CSS & Cấu trúc)

Tài liệu này mô tả cấu trúc phân cấp, **class**, **kiểu `display`**, và khi có **CSS Grid** thì ghi **cấp độ grid container (G1, G2, …)** cùng **cấp độ grid item (I1, I2, …)**.

---

## 1. Sơ đồ Phân cấp & Kiểu hiển thị (Hierarchy & Display)

Dưới đây là cấu trúc phân cấp các thành phần chính cùng với kiểu `display` tương ứng:

- **Body** (`display: block`)
  - **Header** (`display: flex`) - Fixed top
  - **Main.product-detail-section** (`display: block`) - Layout chính
    - **.container** (`display: block`) - Khung giới hạn độ rộng
      - **.product-layout** (`display: flex` hoặc `grid`) — **Grid container G1** (khi dùng `grid`)
        - **.product-gallery** (`display: flex; flex-direction: column`) — **Grid item I1** (cột trái)
          - `.main-image-container` (`display: flex; position: relative`) - Khu vực ảnh chính
            - `.slider-btn.prev-btn.hidden` (`display: none` → `flex`)
            - `img#productImage` (`display: block`)
            - `.slider-btn.next-btn.hidden` (`display: none` → `flex`)
          - `.thumbnail-gallery#thumbnailGallery` (`display: flex`) - Các ảnh nhỏ bên dưới
        - **.product-info** (`display: flex; flex-direction: column`) — **Grid item I1** (cột phải)
          - `h1#productName.section-title` (`display: block`)
          - `p#productPrice.detail-price` (`display: block`)
          - `.divider` (`display: block`)
          - `p#productDescription.detail-description` (`display: block`) - Text mô tả
          - `.selection-group` (`display: flex; flex-direction: column`) - Nhóm tùy chọn Size
            - `h4` (`display: block`)
            - `.size-picker` (`display: flex`) - Chứa các nút kích cỡ
              - `.size-btn` (`display: inline-flex`) - `.active` mặc định
          - `.selection-group` (`display: flex; flex-direction: column`) - Nhóm Số Lượng
            - `h4` (`display: block`)
            - `.qty-control` (`display: flex`)
              - `#btn-minus` (`display: inline-flex`)
              - `span#quantity-val` (`display: inline-block`)
              - `#btn-plus` (`display: inline-flex`)
          - `#addToCart.btn.btn-primary.btn-add` (`display: inline-flex`)
  - **Footer** (`display: block`)

---

## 2. Chi tiết các Class CSS chính

### A. Layout Tự Sinh
| Cấp độ | Thành phần | Class / ID | Display Type | Cấp độ Grid container | Cấp độ Grid item | Ghi chú |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | Vùng chứa chính | `.product-detail-section` | `block` | — | — | Giữ nội dung sát với Footer |
| 2 | Bố cục 2 cột | `.product-layout` | `grid` / `flex` | **G1** (khi `grid`) | — | Hai cột gallery / info |

### B. Gallery Ảnh
| Cấp độ | Thành phần | Class / ID | Display Type | Cấp độ Grid container | Cấp độ Grid item | Ghi chú |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | Cột Trái | `.product-gallery` | `flex (column)` | — | **I1** | Con của `.product-layout` khi layout là grid |
| 2 | Ảnh Chính | `.main-image-container` | `flex` | — | — | Center & Relative để chứa nút |
| 3 | Nút Slider | `.slider-btn` | `flex` / `none` | — | — | Absolute position |
| 2 | Hàng thumbnail | `.thumbnail-gallery` | `flex` | — | — | Ngang, gap 10px (không phải CSS Grid) |

### C. Thông tin SP & Tương Tác
| Cấp độ | Thành phần | Class / ID | Display Type | Cấp độ Grid container | Cấp độ Grid item | Ghi chú |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | Cột Phải | `.product-info` | `flex (column)` | — | **I1** | Con của `.product-layout` khi layout là grid |
| 2 | Tên | `h1.section-title` | `block` | — | — | Margin-bottom |
| 2 | Giá | `.detail-price` | `block` | — | — | Chữ to, màu chính |
| 2 | Khối Size / Số lượng | `.selection-group` | `flex (column)` | — | — | Margin cho cách biệt |
| 3 | Nhãn nhóm | `h4` | `block` | — | — | Text Weight |
| 3 | Khu bấm Size | `.size-picker` | `flex` | — | — | Wrap, button ngang |
| 3 | Module (+) (-) | `.qty-control` | `flex` | — | — | Border & Space-between |

---

## 3. Quy ước thiết kế chung (Common Utilities)
- **Nút bấm mua hàng:** `#addToCart.btn.btn-primary.btn-add` (`display: inline-flex`, to và kéo dài full width).
- **Phân cách giá / Text:** `.divider` (`display: block; width: 100%; height: 1px`).
- **Nút Size bấm:** `.size-btn` (`display: inline-flex; border`).

---

*Cập nhật lần cuối: 28/03/2026*
