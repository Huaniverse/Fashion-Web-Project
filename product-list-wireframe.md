# Wireframe Danh Sách Sản Phẩm (Product List) - DEUX | Luxury Style (Chi tiết CSS & Cấu trúc)

Tài liệu này mô tả cấu trúc phân cấp, **class**, **kiểu `display`**, và khi có **CSS Grid** thì ghi **cấp độ grid container (G1, G2, …)** cùng **cấp độ grid item (I1, I2, …)**.

---

## 1. Sơ đồ Phân cấp & Kiểu hiển thị (Hierarchy & Display)

Dưới đây là cấu trúc phân cấp các thành phần chính cùng với kiểu `display` tương ứng:

- **Body** (`display: block`)
  - **Header** (`display: flex`) - Fixed top
  - **Section.pl-filter-bar** (`display: block`) - Thanh phụ điều hướng / Tìm kiếm
    - **.container.pl-filter-bar-inner** (`display: flex`) - Chứa 2 cụm Breadcrumb & Tương tác
      - `#plBreadcrumb` (`display: flex`) - VD: Home > Category
        - `#plBreadcrumbHome` (`display: inline-flex`)
      - **.pl-controls** (`display: flex`)
        - `.pl-search` (`display: flex; position: relative`)
          - `.pl-search-icon` (`display: block; position: absolute`)
          - `#plSearch` (`display: block`) - 100% width
        - `#plSort` (`display: block`) - Dropdown

  - **Div#plCatBar.pl-cat-bar** (`display: flex` / Component tự sinh) - Thanh lọc danh mục ngang
    - Bọc trong `container` ngầm (`display: block`)
      - Chứa Grid nút danh mục ngang (`display: flex`, Scroll ngang)

  - **Main.product** (`display: block`) - Container bọc grid card
    - **.container** (`display: block`)
      - `p#plResultCount.pl-result-count` (`display: block`) - Text số lượng SP
      - **Div#productGrid.pl-grid** (`display: grid` hoặc `flex` wrap) — **Grid container G1** (khi `grid`)
        - `.pl-skeleton` (`display: block; animation: pulse`) — **Grid item I1** (placeholder)
        - `.card` (khi có data) (`display: flex; flex-direction: column`) — **Grid item I1**

  - **Footer** (`display: block`)

---

## 2. Chi tiết các Class CSS chính

### A. Filter & Header Bar
| Cấp độ | Thành phần | Class / ID | Display Type | Cấp độ Grid container | Cấp độ Grid item | Ghi chú |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | Bar Tổng | `.pl-filter-bar` | `block` | — | — | Margin bù Header |
| 2 | Hộp Bố Cục | `.pl-filter-bar-inner` | `flex` | — | — | Space-between 2 cụm điều khiển |
| 3 | Đường dẫn | `#plBreadcrumb` | `flex` | — | — | Gap nhỏ, màu chữ xám |
| 3 | Bộ Công Cụ | `.pl-controls` | `flex` | — | — | Gap 15–20px |
| 4 | Thanh Tìm kiếm | `.pl-search` | `flex` | — | — | Ô input + icon |
| 4 | Sắp xếp | `#plSort` | `block` | — | — | Dropdown Select |

### B. Category Bar
| Cấp độ | Thành phần | Class / ID | Display Type | Cấp độ Grid container | Cấp độ Grid item | Ghi chú |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | Dải lọc | `.pl-cat-bar` | `flex` | — | — | JS render danh mục; cuộn ngang |
| 2 | Nút danh mục (tự sinh) | *theo template JS* | `inline-flex` | — | — | Viền cong, nền xám nhạt |

### C. Grid Sản Phẩm (Main section)
| Cấp độ | Thành phần | Class / ID | Display Type | Cấp độ Grid container | Cấp độ Grid item | Ghi chú |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | Vùng chứa | `.product` | `block` | — | — | Background nhạt |
| 2 | Lưới sản phẩm | `#productGrid.pl-grid` | `grid` / `flex` + wrap | **G1** (khi `grid`) | — | `repeat(auto-fill, minmax(...))` hoặc flex wrap |
| 3 | Thẻ sản phẩm | `.card` | `flex (column)` | — | **I1** | Cùng pattern trang chủ |
| 3 | Skeleton loading | `.pl-skeleton` | `block` | — | **I1** | Trong lúc đợi data |

---

## 3. Quy ước thiết kế chung (Common Utilities)
- **Select / Input:** `.input-field`, `.pl-search-input` (Dùng `display: block`).
- **Nút chung:** Giống Home (ví dụ `btn`, `btn-primary`), `.active` (đổi màu nổi bật cho Category / Sort).
- **Lưới hiển thị:** `.pl-grid` (Responsive bằng auto-fill grid).

---

*Cập nhật lần cuối: 28/03/2026*
