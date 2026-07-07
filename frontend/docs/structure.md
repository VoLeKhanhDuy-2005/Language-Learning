# Cấu trúc thư mục Frontend MinLish

Tài liệu này mô tả cấu trúc thư mục của dự án frontend (React + Vite) được tổ chức theo mô hình **Feature-based** (dựa trên tính năng) kết hợp với các thư mục dùng chung (Shared layers).

## Sơ đồ cấu trúc thư mục

```text
frontend/
├── docs/                   # Thư mục chứa tài liệu hướng dẫn và đặc tả
│   └── structure.md        # Tài liệu cấu trúc thư mục này
├── public/                 # Các tài nguyên tĩnh công khai (ảnh, icon)
│   ├── favicon.svg
│   ├── hero.jpg
│   └── why-choose.jpg
├── src/
│   ├── assets/             # Các tài nguyên tĩnh được xử lý bởi Vite (ảnh, font)
│   ├── components/         # Các thành phần giao diện (UI Components) dùng chung trong toàn ứng dụng
│   │   ├── Header/
│   │   │   ├── Header.jsx
│   │   │   └── Header.css
│   │   ├── Footer/
│   │   │   ├── Footer.jsx
│   │   │   └── Footer.css
│   │   └── Input/
│   │       ├── Input.jsx
│   │       └── Input.css
│   ├── features/           # Các mô-đun chức năng độc lập (Feature-based)
│   │   ├── auth/           # Chức năng Xác thực (Đăng nhập, Đăng ký, OTP, Quên mật khẩu)
│   │   │   ├── components/ # Các component con nội bộ của auth (ví dụ: LoginForm, SignupForm)
│   │   │   ├── pages/      # Các trang chính của auth (LoginPage, RegisterPage)
│   │   │   ├── hooks/      # Custom hooks riêng của auth
│   │   │   └── authApi.js  # Các hàm gọi API đăng nhập, đăng ký, OTP
│   │   ├── lessons/        # Mô-đun Học qua Dictation & Shadowing
│   │   ├── flashcards/     # Mô-đun Học từ vựng (Decks, Topics, Cards)
│   │   ├── profile/        # Mô-đun Hồ sơ cá nhân
│   │   └── admin/          # Mô-đun Quản lý dành cho Quản trị viên
│   ├── hooks/              # Các Custom React Hooks dùng chung trong toàn bộ dự án
│   ├── services/           # Cấu hình gọi API dùng chung (apiClient setup với Axios/Fetch)
│   ├── context/            # Quản lý State toàn cục bằng React Context (AuthContext, ThemeContext)
│   ├── utils/              # Các hàm tiện ích dùng chung (helpers, formatters)
│   ├── App.jsx             # Component chính định tuyến và bố cục
│   ├── App.css             # CSS chính cho cấu trúc khung App
│   ├── index.css           # Reset CSS và biến CSS variables toàn cục
│   └── main.jsx            # Entry point của React
```

## Chi tiết các thư mục chính

### 1. `src/components` (Thư mục dùng chung)
Chứa các thành phần UI nguyên tử (Atomic UI components) có tính tái sử dụng cao trong toàn dự án. Mỗi component nên được đặt trong một thư mục con riêng biệt chứa mã nguồn JSX và file CSS đi kèm của nó (ví dụ: `src/components/Input/`).

### 2. `src/features` (Thư mục chức năng)
Chứa các mô-đun nghiệp vụ chính của ứng dụng. Mỗi thư mục con đại diện cho một tính năng lớn (như `auth`, `lessons`, `flashcards`). Cách thiết lập này giúp mã nguồn của mỗi tính năng có tính cô lập cao, dễ tìm kiếm và bảo trì:
- `pages/`: Chứa các view lớn hiển thị cho người dùng (ví dụ: `LoginPage`).
- `components/`: Các component nhỏ hơn chỉ dùng trong tính năng cụ thể đó.
- `hooks/`: Xử lý logic nghiệp vụ đặc thù cho tính năng.
- API file (ví dụ: `authApi.js`): Tập trung các API endpoints của tính năng để gọi từ backend.

### 3. `src/services` (Dịch vụ dùng chung)
Nơi khởi tạo và cấu hình client gọi API (ví dụ: Axios instance). Tại đây sẽ xử lý các logic chung cho toàn bộ ứng dụng như: đính kèm Bearer token vào Headers, xử lý lỗi tự động khi token hết hạn (interceptors) và refresh token.

### 4. `src/hooks` và `src/utils`
- `hooks/` chứa các custom hooks phi nghiệp vụ (như `useDebounce`, `useLocalStorage`).
- `utils/` chứa các hàm helper độc lập (như định dạng tiền tệ, ngày tháng, validate chuỗi).

## Quy tắc import
- Khi import một component dùng chung từ thư mục `features`, hãy sử dụng đường dẫn tương đối trỏ về thư mục `components` ở ngoài. Ví dụ trong `LoginPage.jsx`:
  ```javascript
  import Input from '../../../components/Input/Input'
  ```
- Tránh import chéo (cross-import) trực tiếp giữa các feature khác nhau để giữ cho các mô-đun được cô lập tốt nhất. Nếu hai feature cần chia sẻ một component, hãy di chuyển component đó ra thư mục `src/components/` dùng chung.
