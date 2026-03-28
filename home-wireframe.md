# Wireframe Trang Chủ - DEUX | Luxury Style (Chi tiết CSS & Cấu trúc)

Tài liệu này mô tả cấu trúc phân cấp, các class CSS và kiểu hiển thị (`display`) của các thành phần trên trang chủ.

---

## 1. Sơ đồ Phân cấp & Kiểu hiển thị (Hierarchy & Display)

Dưới đây là cấu trúc phân cấp các thành phần chính cùng với kiểu `display` tương ứng:

- **Body** (`display: block`)
  - **Header** (`display: flex`) - Fixed top
    - `.logo` (`display: inline-block`)
    - `nav#nav-menu` (`display: flex`)
      - `ul` (`display: flex`)
        - `li` (`display: block`)
          - `.nav-item` (`display: inline-block`)
    - `.nav-actions` (`display: flex`)
      - `.btn-login` (`display: inline-flex`)
      - `.btn-cart` (`display: inline-flex`)
    - `#mobile-toggle` (`display: none` trên desktop, `flex` trên mobile)
  - **Section.hero** (`display: flex`)
    - `.hero-content` (`display: block`)
      - `h1` (`display: block`)
      - `.btn-shop` (`display: inline-flex`)
  - **Section.collection** (`display: flex`) - Áp dụng cho "Xu hướng" & "Khuyến mãi"
    - `.container` (`display: block`)
      - `.section-title` (`display: block`)
      - `.grid` (`display: flex`) - Cuộn ngang (`overflow-x: auto`)
        - `.card` (`display: flex; flex-direction: column`)
          - `.badge` (`display: block; position: absolute`)
          - `.img-placeholder` (`display: block`)
            - `img` (`display: block`)
          - `.card-content` (`display: flex; flex-direction: column`)
            - `.card-title` (`display: -webkit-box`)
            - `.card-price` (`display: block`)
            - `.btn-add` (`display: inline-flex`)
  - **Footer** (`display: block`)
    - `.container.footer-grid` (`display: grid`)
      - `.footer-info` (`display: block`)
      - `.footer-contact` (`display: block`)
    - `.footer-bottom` (`display: block`)

---

## 2. Chi tiết các Class CSS chính

### A. Thành phần Header
| Cấp độ | Thành phần | Class / ID | Display Type | Ghi chú |
|:---:|:---|:---|:---|:---|
| 1 | Header toàn cục | `header` | `flex` | Fixed, blur background |
| 2 | Logo | `.logo` | `inline-block` | Font-weight: 700 |
| 2 | Menu điều hướng | `nav#nav-menu` | `flex` | Căn giữa menu |
| 3 | Danh sách menu | `nav ul` | `flex` | Gap: 35px |
| 2 | Nhóm nút hành động | `.nav-actions` | `flex` | Gap: 15px |

### B. Thành phần Hero (Banner)
| Cấp độ | Thành phần | Class / ID | Display Type | Ghi chú |
|:---:|:---|:---|:---|:---|
| 1 | Toàn bộ Banner | `.hero` | `flex` | Height: 100vh, center content |
| 2 | Khối nội dung | `.hero-content` | `block` | Animation: fadeInUp |
| 3 | Nút kêu gọi (CTA) | `.btn-shop` | `inline-flex` | Nút tròn, lớn |

### C. Thành phần Collection (Sản phẩm)
| Cấp độ | Thành phần | Class / ID | Display Type | Ghi chú |
|:---:|:---|:---|:---|:---|
| 1 | Khung section | `.collection` | `flex` | Phân cách bằng border-top |
| 2 | Vùng chứa nội dung | `.container` | `block` | Max-width: 1200px |
| 3 | Lưới sản phẩm | `.grid` | `flex` | Hỗ trợ kéo thả & cuộn ngang |
| 4 | Thẻ sản phẩm | `.card` | `flex (column)` | Hover shadow effect |

### D. Thành phần Footer
| Cấp độ | Thành phần | Class / ID | Display Type | Ghi chú |
|:---:|:---|:---|:---|:---|
| 1 | Chân trang | `footer` | `block` | Gradient background |
| 2 | Bố cục lưới | `.footer-grid` | `grid` | 2 cột (1fr 1fr) |
| 2 | Dòng bản quyền | `.footer-bottom` | `block` | Text-align: center |

---

## 3. Quy ước thiết kế chung (Common Utilities)
- **Nút bấm:** `.btn`, `.btn-primary`, `.btn-round`, `.btn-full` (Tất cả dùng `display: inline-flex`).
- **Input:** `.input-field` (Dùng `display: block` với `width: 100%`).
- **Tiêu đề section:** `.section-title` (Căn giữa, font-size 42px).

---

*Cập nhật lần cuối: 27/03/2026*
