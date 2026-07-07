# MinLish - Website học tiếng Anh trực tuyến

Website chính thức: [Link Website](https://main.dechmw5tva6e5.amplifyapp.com/)

---

## Mục lục

- [Giới thiệu về dự án](#giới-thiệu-về-dự-án)
- [Thành viên tham gia dự án](#thành-viên-tham-gia-dự-án)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Hướng dẫn cấu hình và cài đặt chi tiết](#hướng-dẫn-cấu-hình-và-cài-đặt-chi-tiết)
- [Hướng dẫn nạp dữ liệu mẫu (Import Sample Data)](#hướng-dẫn-nạp-dữ-liệu-mẫu-import-sample-data)
- [Hướng dẫn khởi chạy ứng dụng](#hướng-dẫn-khởi-chạy-ứng-dụng)
- [Hướng dẫn cấu hình CI/CD (GitHub Actions)](#hướng-dẫn-cấu-hình-cicd-github-actions)

---

## Giới thiệu về dự án

Nền tảng học tập hiện đại dành cho người trẻ. Cải thiện kỹ năng nghe và nói một cách tự nhiên thông qua các phương pháp đã được kiểm chứng, trong một không gian tối giản và tập trung.

- Học từ vựng qua Flashcard kết hợp thuật toán lặp lại ngắt quãng SM-2.
- Luyện nghe chép chính tả với các đoạn hội thoại thực tế. Cải thiện khả năng nhận diện âm thanh và vốn từ vựng.
- Bắt chước ngữ điệu và phát âm của người bản xứ. Phương pháp hoàn hảo để có một giọng điệu tự nhiên và tự tin.
- Chế độ đấu trí trực tuyến thời gian thực.
- Tích hợp AI để hỗ trợ dịch thuật, phản hồi thông tin và đánh giá phát âm.
- Hệ thống Gamification bao gồm bảng xếp hạng, điểm số, cấp độ và XP kích thích động lực học tập.

---

## Thành viên tham gia dự án

Dưới đây là danh sách các thành viên thực hiện dự án:

| STT | Họ và tên | Mã số sinh viên | Vai trò trong dự án |
|---|---|---|---|
| 1 | [Võ Lê Khánh Duy](https://github.com/VoLeKhanhDuy-2005) | 23110196 | Backend Developer |
| 2 | [Văn Phú Hiền](https://github.com/VanPhuHien) | 23110213 | Frontend Developer |
| 3 | [Nguyễn Văn Kế](https://github.com/nvk3005) | 23110234 | Backend Developer |
| 4 | [Trần Triều Dương](https://github.com/trantrieuduong) | 23110200 | Frontend Developer |

---

## Cấu trúc dự án

Dự án được cấu trúc theo mô hình Client-Server chia làm hai phần chính: backend và frontend.

```text
MinLish/
├── .github/                # Cấu hình GitHub (Issue templates và Workflows CI/CD)
│   ├── ISSUE_TEMPLATE/     # Các mẫu báo cáo lỗi, yêu cầu tính năng
│   └── workflows/          # Các luồng tự động kiểm thử và deploy (GitHub Actions)
│       ├── app_ci.yml      # Luồng CI kiểm thử tự động toàn diện
│       └── backend_deploy_to_ec2.yml # Luồng CD deploy Backend lên AWS EC2
│
├── sample_data/            # Dữ liệu mẫu dạng JSON dùng để import vào MongoDB
│
├── backend/                # Mã nguồn phía máy chủ (Server-side)
│   ├── src/                # Mã nguồn chính của server
│   │   ├── config/         # Cấu hình cơ sở dữ liệu (MongoDB, Redis) và API bên thứ ba
│   │   ├── constants/      # Khai báo các hằng số dùng chung trong hệ thống
│   │   ├── middlewares/    # Các middleware xử lý log, kiểm tra quyền và bắt lỗi
│   │   ├── models/         # Định nghĩa cấu trúc dữ liệu (Mongoose schemas)
│   │   ├── modules/        # Các chức năng nghiệp vụ (auth, ai, battle, lesson, vocabulary...)
│   │   ├── socket/         # Quản lý kết nối Socket.io cho tính năng thời gian thực
│   │   └── utils/          # Các hàm tiện ích hỗ trợ (gửi mail, tạo mã OTP, hash mật khẩu...)
│   ├── server.js           # Điểm khởi chạy của Backend Server
│   ├── .env.example        # Mẫu file cấu hình môi trường của backend
│   └── package.json        # Định nghĩa các thư viện phụ thuộc và script chạy backend
│
├── frontend/               # Mã nguồn phía giao diện người dùng (Client-side)
│   ├── public/             # Thư mục lưu trữ tài nguyên tĩnh (hình ảnh, favicon)
│   ├── src/                # Mã nguồn chính của ứng dụng React
│   │   ├── components/     # Các thành phần giao diện tái sử dụng (button, modal, input...)
│   │   ├── context/        # Quản lý trạng thái toàn cục của ứng dụng (React Context)
│   │   ├── features/       # Các chức năng cụ thể trong ứng dụng
│   │   ├── locales/        # Cấu hình đa ngôn ngữ (i18n) cho giao diện
│   │   ├── services/       # Các hàm gọi API giao tiếp với Backend
│   │   ├── utils/          # Các hàm định dạng, xử lý logic dùng chung ở client
│   │   ├── App.jsx         # Thành phần gốc định tuyến các trang
│   │   └── main.jsx        # Điểm khởi chạy của ứng dụng React (Vite)
│   ├── .env.example        # Mẫu file cấu hình môi trường của frontend
│   ├── vite.config.js      # File cấu hình công cụ xây dựng Vite
│   └── package.json        # Định nghĩa các thư viện phụ thuộc và script chạy frontend
│
└── doc/                    # Tài liệu hướng dẫn và mô tả hệ thống
```

---

## Hướng dẫn cấu hình và cài đặt chi tiết

### Yêu cầu hệ thống trước khi cài đặt
Để khởi chạy dự án, máy tính của bạn cần được cài đặt sẵn:
- Node.js (khuyến nghị phiên bản LTS từ 18 trở lên)
- MongoDB Server (chạy cục bộ hoặc MongoDB Atlas)
- Redis Server (dành cho bộ nhớ đệm và tính năng so tài thời gian thực)
- Công cụ dòng lệnh git

### Bước 1: Clone mã nguồn dự án
Sử dụng terminal để tải dự án về máy:
```bash
git clone https://github.com/trantrieuduong/MinLish.git
cd MinLish
```

### Bước 2: Hướng dẫn cấu hình môi trường (Config) chi tiết

#### 1. Cấu hình Backend
Di chuyển vào thư mục backend:
```bash
cd backend
```
Tạo file cấu hình môi trường `.env` từ file mẫu:
```bash
cp .env.example .env
```
*(Đối với hệ điều hành Windows sử dụng CMD hoặc PowerShell, bạn có thể copy thủ công hoặc sử dụng lệnh `copy .env.example .env`)*

Mở file `.env` vừa tạo và cập nhật chi tiết các tham số sau:

- **Cổng chạy ứng dụng & Môi trường:**
  - `PORT`: Cổng chạy backend server (mặc định là 5000).
  - `NODE_ENV`: Đặt là `development` khi chạy cục bộ, `test` khi chạy thử nghiệm và `production` khi triển khai thực tế.
  - `CLIENT_URL`: Đường dẫn của Frontend để cho phép CORS (mặc định là `http://localhost:5173`).

- **Cơ sở dữ liệu (Database & Cache):**
  - `MONGODB_URI`: Địa chỉ kết nối MongoDB của bạn (ví dụ: `mongodb://localhost:27017/minlish`).
  - `REDIS_URL`: Địa chỉ kết nối tới máy chủ Redis (ví dụ: `redis://localhost:6379`).

- **Bảo mật & Token:**
  - `JWT_SECRET`: Chuỗi khóa bí mật dùng để mã hóa và xác thực chữ ký của các token JWT.
  - `JWT_ACCESS_EXPIRES_IN`: Thời hạn hiệu lực của Access Token (ví dụ: `15m` - 15 phút).
  - `JWT_REFRESH_EXPIRES_IN`: Thời hạn hiệu lực của Refresh Token dùng để cấp lại Access Token mới (ví dụ: `7d` - 7 ngày).

- **Dịch vụ gửi Mail SMTP (Gửi OTP kích hoạt/quên mật khẩu):**
  - `MAIL_HOST`: Máy chủ SMTP của nhà cung cấp email (ví dụ với Gmail: `smtp.gmail.com`).
  - `MAIL_PORT`: Cổng kết nối SMTP (thông thường là `587` cho bảo mật STARTTLS).
  - `MAIL_USER`: Địa chỉ email dùng để gửi tin (ví dụ: `minlish.education@gmail.com`).
  - `MAIL_PASS`: Mật khẩu ứng dụng (App Password) được tạo riêng từ trang quản lý tài khoản Google của email đó (không được dùng mật khẩu chính).

- **Lưu trữ đám mây AWS S3 (Lưu trữ ảnh đại diện, file ghi âm, bài học):**
  - `BUCKET_NAME`: Tên bucket S3 lưu trữ dữ liệu.
  - `BUCKET_REGION`: Vùng địa lý của bucket S3 (ví dụ: `ap-southeast-1`).
  - `AWS_ACCESS_KEY` và `AWS_SECRET_ACCESS_KEY`: Cặp khóa của tài khoản IAM User có quyền thao tác Read/Write trên bucket.
  - `S3_PUBLIC_BASE_URL`: Địa chỉ URL công khai của Bucket hoặc CloudFront CDN tương ứng để client truy xuất file tĩnh.

- **Tích hợp trí tuệ nhân tạo (AI) và các dịch vụ thứ ba:**
  - `GEMINI_API_KEY`: API Key được tạo từ Google AI Studio.
  - `AZURE_SPEECH_KEY` và `AZURE_SPEECH_REGION`: Khóa dịch vụ và khu vực (ví dụ: `eastus`) của Azure Speech Services để phục vụ tính năng phân tích giọng đọc và chấm điểm phát âm.
  - `YOUTUBE_API_KEY`: Khóa API YouTube Data (v3) hỗ trợ tải dữ liệu video phục vụ cho chức năng nghe chép chính tả.

- **Thời gian hệ thống:**
  - `GAMIFY_TZ`: Múi giờ mặc định cho hệ thống Gamification tính điểm nhiệm vụ hàng ngày (ví dụ: `Asia/Ho_Chi_Minh`).

- **Cấu hình giới hạn tần suất yêu cầu (Rate Limiting):**
  - Định cấu hình thời gian (`WINDOW_MS`) và số lượng request tối đa (`MAX`) cho các API nhạy cảm như Đăng nhập, Đăng ký, Quên mật khẩu, Xác thực email nhằm hạn chế Brute-force và Spam API.

#### 2. Cấu hình Frontend
Di chuyển vào thư mục frontend:
```bash
cd ../frontend
```
Tạo file cấu hình môi trường `.env` từ file mẫu:
```bash
cp .env.example .env
```
Mở file `.env` và thiết lập các biến sau:
- `API_URL`: Đường dẫn API của backend. Khi chạy local mặc định là: `http://localhost:5000/api/v1`
- `OTP_RESEND_COOLDOWN`: Thời gian chờ (tính bằng giây) trước khi cho phép người dùng yêu cầu gửi lại mã OTP (ví dụ: `60`).

---

## Hướng dẫn nạp dữ liệu mẫu (Import Sample Data)

Dự án cung cấp sẵn dữ liệu mẫu trong thư mục `sample_data/` dưới định dạng các file JSON. Bạn cần nạp các dữ liệu này vào MongoDB của mình để hiển thị các bài học, từ vựng và cấp độ CEFR khi chạy ứng dụng lần đầu tiên.

Yêu cầu máy tính đã cài đặt bộ công cụ **MongoDB Database Tools** (bao gồm lệnh `mongoimport`).

### Sử dụng PowerShell (trên Windows)
Mở PowerShell tại thư mục gốc của dự án và chạy đoạn lệnh sau để tự động import tất cả dữ liệu mẫu:
```powershell
Get-ChildItem sample_data/*.json | ForEach-Object {
    $filename = $_.BaseName
    $collection = $filename.Replace("minlish.", "")
    mongoimport --db minlish --collection $collection --file $_.FullName --jsonArray
}
```

### Sử dụng Terminal (trên macOS hoặc Linux)
Mở terminal tại thư mục gốc của dự án và chạy đoạn lệnh sau:
```bash
for file in sample_data/*.json; do
    filename=$(basename "$file" .json)
    collection=${filename#minlish.}
    mongoimport --db minlish --collection "$collection" --file "$file" --jsonArray
done
```

---

## Hướng dẫn khởi chạy ứng dụng

### 1. Cài đặt các thư viện phụ thuộc (Dependencies)

Bạn cần thực hiện cài đặt thư viện ở cả thư mục `backend` và `frontend`:

- **Tại thư mục backend:**
  ```bash
  cd backend
  npm install
  ```

- **Tại thư mục frontend:**
  ```bash
  cd ../frontend
  npm install
  ```

### 2. Khởi chạy dự án

#### Chạy Backend Server
1. Mở một terminal mới và di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Khởi động server ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   Server backend sẽ hoạt động tại địa chỉ: `http://localhost:5000`

#### Chạy Frontend Client
1. Mở một terminal song song khác và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Khởi chạy ứng dụng React (Vite):
   ```bash
   npm run dev
   ```
   Ứng dụng frontend sẽ chạy tại địa chỉ mặc định: `http://localhost:5173`

Mở trình duyệt truy cập vào `http://localhost:5173` để bắt đầu sử dụng.

---

## Hướng dẫn cấu hình CI/CD (GitHub Actions)

Dự án tích hợp sẵn hệ thống Tự động kiểm thử (CI) và Tự động triển khai (CD) thông qua GitHub Actions nằm trong thư mục `.github/workflows/`.

### 1. Cấu hình luồng kiểm thử tự động (CI)
Luồng này được quản lý bởi file `app_ci.yml` và tự động kích hoạt khi:
- Có sự kiện `push` trực tiếp vào nhánh `dev`.
- Có pull request được tạo đến các nhánh `dev` hoặc `main` khi mã nguồn thay đổi tại `backend/` hoặc `frontend/`.

**Quy trình chạy của CI:**
1. Khởi chạy môi trường máy ảo Ubuntu, cài đặt môi trường Node.js phiên bản 22.
2. Khởi chạy dịch vụ Redis 7.0 bằng Docker Container.
3. Chạy lệnh cài đặt sạch thư viện phụ thuộc bằng lệnh `npm ci`.
4. Tạo tệp `.env` môi trường thử nghiệm tạm thời tự động từ các Secrets lưu trên GitHub.
5. Chạy tuần tự các bộ kiểm thử:
   - Backend unit & integration tests (`npm run test` của backend).
   - Frontend unit tests (`npm run test:run` của frontend).
   - Frontend End-to-End tests sử dụng thư viện Selenium (`npm run test:e2e` của frontend).

### 2. Cấu hình luồng tự động triển khai (CD)
Luồng này được quản lý bởi file `backend_deploy_to_ec2.yml` và tự động kích hoạt khi:
- Có sự kiện `push` (hoặc merge Pull Request thành công) trực tiếp vào nhánh `main` khi có thay đổi trong thư mục `backend`.

**Quy trình chạy của CD:**
1. Truy cập an toàn vào máy chủ AWS EC2 thông qua giao thức SSH sử dụng khóa riêng tư (SSH Private Key).
2. Chuyển đến thư mục làm việc của dự án trên EC2 (`/var/www/minlish/MinLish`).
3. Kéo mã nguồn mới nhất từ nhánh `main` và đồng bộ cứng (`git reset --hard origin/main`).
4. Tự động biên dịch lại tệp cấu hình `.env` cho backend từ dữ liệu các GitHub Secrets.
5. Thực hiện cài đặt sạch các thư viện phục vụ môi trường chạy thực tế (`npm ci --omit=dev`).
6. Kiểm tra và khởi động lại tiến trình của server backend bằng trình quản lý PM2 (`pm2 restart minlish-backend` hoặc khởi tạo mới).

### 3. Các bước thiết lập biến bí mật (GitHub Secrets)
Để CI/CD chạy thành công, bạn cần truy cập vào repository trên GitHub của mình, chọn **Settings** -> **Secrets and variables** -> **Actions** -> Click **New repository secret** để thêm các biến sau:

#### Secrets phục vụ kiểm thử (Cho luồng CI):
- `MONGODB_URI_TEST`: Chuỗi kết nối đến cơ sở dữ liệu MongoDB thử nghiệm.
- `JWT_SECRET_TEST`: Khóa bí mật JWT dành riêng cho môi trường kiểm thử.
- `MAIL_USER_TEST` / `MAIL_PASS_TEST`: Tài khoản email và mật khẩu ứng dụng để test chức năng gửi OTP.
- `AWS_ACCESS_KEY_TEST` / `AWS_SECRET_ACCESS_KEY_TEST`: Cặp khóa AWS dùng cho lưu trữ file khi test.
- `GEMINI_API_KEY_TEST`: API Key Gemini thử nghiệm.
- `AZURE_SPEECH_KEY_TEST` / `AZURE_SPEECH_REGION_TEST`: Khóa và khu vực kiểm thử của Azure Speech.

#### Secrets phục vụ triển khai EC2 (Cho luồng CD):
- `EC2_HOST`: Địa chỉ IP công cộng (Public IP) của máy chủ AWS EC2.
- `EC2_USER`: Tên tài khoản đăng nhập SSH của máy chủ (ví dụ: `ubuntu`).
- `EC2_PORT`: Cổng kết nối SSH (thường là `22`).
- `EC2_SSH_KEY`: Nội dung đầy đủ của tệp Private Key (.pem) dùng để SSH vào EC2 (bắt đầu bằng `-----BEGIN RSA PRIVATE KEY-----` và kết thúc bằng `-----END RSA PRIVATE KEY-----`).
- **Các cấu hình môi trường production cho Backend:**
  - Bạn cần cấu hình các secrets tương ứng cho các biến trong file `.env` chạy production như: `PORT`, `NODE_ENV`, `CLIENT_URL`, `MONGODB_URI`, `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `BUCKET_NAME`, `BUCKET_REGION`, `AWS_ACCESS_KEY`, `AWS_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`, `REDIS_URL`, `OTP_TTL`, `GEMINI_API_KEY`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `GAMIFY_TZ`, `YOUTUBE_API_KEY` và các cấu hình giới hạn Rate Limit.
