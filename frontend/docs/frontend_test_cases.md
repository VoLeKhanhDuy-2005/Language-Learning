# Báo cáo Phân tích Độ phủ Kiểm thử Frontend MinLish

Tài liệu này cung cấp cái nhìn toàn diện về cấu trúc Frontend của dự án MinLish (bao gồm các component dùng chung, các context và các module tính năng), liệt kê danh sách tối thiểu các kịch bản kiểm thử (testcases) cần có và đối chiếu với số lượng kịch bản kiểm thử đã được viết thực tế.

---

## 1. Thống kê tổng quan

- **Tổng số component/feature chính**: 26
- **Tổng số kịch bản kiểm thử tối thiểu đề xuất**: 78
- **Tổng số kịch bản kiểm thử đã viết**: 52 (Đạt ~66.7% độ phủ các kịch bản tối thiểu)
  - **Unit & Component Integration Tests**: 38
  - **E2E Tests**: 14

---

## 2. Bảng chi tiết độ phủ kiểm thử theo Component & Feature

### A. Các Component & Context dùng chung (Shared Components & Contexts)

| STT | Component / Context | Mô tả chức năng | Danh sách testcases tối thiểu cần có | Số testcase đã viết | Trạng thái / File test |
| :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | **ConfirmModal** | Hộp thoại xác nhận hành động | 1. Không hiển thị khi `isOpen` là `false`. <br>2. Hiển thị đúng title, message, nút khi mở. <br>3. Gọi `onCancel` khi click nút đóng/Hủy. <br>4. Gọi `onConfirm` khi click xác nhận và disable các nút khi submit. <br>5. Áp dụng đúng class nguy hiểm khi `isDanger` là `true`. | **5** / 5 | Hoàn thành <br>[ConfirmModal.test.jsx](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/unit/ConfirmModal.test.jsx) |
| 2 | **Pagination** | Bộ điều khiển phân trang dùng chung | 1. Không render khi chỉ có 1 trang. <br>2. Hiển thị đúng số trang và class `active` ở trang hiện tại. <br>3. Gọi `onPageChange` khi click số trang. <br>4. Gọi đúng trang trước/sau khi click Next/Prev. <br>5. Disable nút Prev ở trang đầu, Next ở trang cuối. <br>6. Hiển thị dấu ba chấm (`...`) khi có quá nhiều trang. <br>7. Cho phép click dấu ba chấm để nhập số trang nhảy nhanh. | **7** / 7 | Hoàn thành <br>[Pagination.test.jsx](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/unit/Pagination.test.jsx) |
| 3 | **Header** | Thanh điều hướng trên cùng | 1. Hiển thị thông tin user & avatar khi đã đăng nhập. <br>2. Hiển thị nút Đăng nhập khi chưa đăng nhập. <br>3. Nút chuyển đổi ngôn ngữ (VI/EN) hoạt động và lưu vào localStorage. <br>4. Nút chuyển đổi giao diện (Sáng/Tối) hoạt động đúng. <br>5. Menu dropdown hiển thị khi click avatar và hoạt động đúng các nút liên kết. | **6** / 5 | Hoàn thành <br>[Header.test.jsx](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/unit/Header.test.jsx) |
| 4 | **Footer** | Chân trang thông tin | 1. Hiển thị đúng thông tin bản quyền và các liên kết giới thiệu. | **0** / 1 | Chưa viết |
| 5 | **Filters** | Bộ lọc tìm kiếm và sắp xếp | 1. Thay đổi giá trị bộ lọc kích hoạt callback tìm kiếm. <br>2. Reset bộ lọc về trạng thái mặc định. | **6** / 2 | Hoàn thành <br>[Filters.test.jsx](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/unit/Filters.test.jsx) |
| 6 | **Input** | Ô nhập liệu chuẩn hóa | 1. Render đúng loại input (text, password, email). <br>2. Hiển thị thông điệp validation error khi truyền prop error. | **6** / 2 | Hoàn thành <br>[Input.test.jsx](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/unit/Input.test.jsx) |
| 7 | **AuthContext** | Quản lý trạng thái xác thực toàn cục | 1. Khởi tạo `loading` bằng `true` và khôi phục phiên từ refresh token thành công. <br>2. Đăng nhập thành công, lưu token/user vào localStorage và cập nhật state. <br>3. Đăng xuất xóa sạch localStorage và reset state. | **3** / 3 | Hoàn thành <br>[AuthContext.test.jsx](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/unit/AuthContext.test.jsx) |
| 8 | **ThemeContext** | Quản lý giao diện Sáng/Tối | 1. Khởi tạo theme mặc định từ localStorage hoặc system preference. <br>2. Hàm `toggleTheme` chuyển đổi qua lại giữa `light` và `dark`. | **5** / 2 | Hoàn thành <br>[ThemeContext.test.jsx](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/unit/ThemeContext.test.jsx) |

---

### B. Feature: Authentication (Xác thực)

| STT | Trang / File | Mô tả chức năng | Danh sách testcases tối thiểu cần có | Số testcase đã viết | Trạng thái / File test |
| :--- | :--- | :--- | :--- | :---: | :--- |
| 9 | **LoginPage** | Trang Đăng nhập | 1. Hiển thị thông báo lỗi khi thông tin đăng nhập sai. <br>2. Đăng nhập thành công bằng tài khoản test và lưu phiên. <br>3. Click "Đăng ký ngay" chuyển hướng sang trang ký. | **3** / 3 | Hoàn thành (E2E) <br>[auth.e2e.test.js](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/e2e/auth.e2e.test.js) |
| 10 | **SignupPage** | Trang Đăng ký | 1. Validate dữ liệu nhập trống hoặc sai định dạng email/mật khẩu yếu. <br>2. Hiển thị lỗi từ backend khi trùng email. <br>3. Đăng ký thành công và chuyển hướng sang trang xác thực email. | **1** / 3 | Hoàn thành (E2E) <br>[signup.e2e.test.js](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/e2e/signup.e2e.test.js) |
| 11 | **ForgotPasswordPage** | Trang Quên mật khẩu | 1. Gửi yêu cầu khôi phục mật khẩu thành công bằng email hợp lệ. <br>2. Hiển thị thông báo lỗi khi email không tồn tại trong hệ thống. | **0** / 2 | Chưa viết |
| 12 | **ResetPasswordPage** | Trang Đặt lại mật khẩu | 1. Validate mật khẩu mới và xác nhận mật khẩu khớp nhau. <br>2. Reset mật khẩu thành công và chuyển hướng về trang đăng nhập. | **0** / 2 | Chưa viết |
| 13 | **VerifyEmailPage** | Trang Xác thực Email | 1. Xác thực thành công khi token hợp lệ và hiển thị thông báo. <br>2. Hiển thị nút gửi lại email xác thực khi token hết hạn. | **1** / 2 | Hoàn thành (E2E) <br>[signup.e2e.test.js](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/e2e/signup.e2e.test.js) |

---

### C. Feature: Flashcards (Học từ vựng)

| STT | Trang / Component | Mô tả chức năng | Danh sách testcases tối thiểu cần có | Số testcase đã viết | Trạng thái / File test |
| :--- | :--- | :--- | :--- | :---: | :--- |
| 14 | **DeckListPage** | Trang danh sách bộ từ vựng | 1. Hiển thị danh sách các bộ từ vựng hệ thống. <br>2. Chuyển đổi tab xem bộ từ vựng cá nhân. <br>3. Tạo bộ từ vựng cá nhân mới thông qua modal form. | **1** / 3 | Đã viết kịch bản chuyển hướng E2E <br>[flashcards.e2e.test.js](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/e2e/flashcards.e2e.test.js) |
| 15 | **DeckDetailPage** <br>& **UserDeckDetailPage** | Trang chi tiết bộ từ vựng | 1. Hiển thị danh sách từ vựng trong bộ kèm phát âm. <br>2. Thêm từ mới thành công vào bộ từ vựng cá nhân. <br>3. Sửa/Xóa từ vựng khỏi bộ từ vựng cá nhân. <br>4. Click nút "Học thẻ" và "Làm Quiz" chuyển hướng đúng. | **0** / 4 | Chưa viết |
| 16 | **ReviewPage** <br>& **FlashCard** / **FlashCardQuiz** | Giao diện học và kiểm tra SRS | 1. Tính năng lật thẻ xem nghĩa, ví dụ, phiên âm. <br>2. Chọn mức độ ghi nhớ (Easy, Good, Hard) và gọi API SRS. <br>3. Đánh dấu sao (Starred) từ vựng và đồng bộ hóa trạng thái starred tức thời khi chuyển qua lại giữa tab Flashcard và tab Quiz. <br>4. Hoàn thành bài học hiển thị bảng kết quả tổng hợp. | **1** / 4 | Hoàn thành (E2E) <br>[study.e2e.test.js](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/e2e/study.e2e.test.js) |
| 17 | **SavedCardsPage** | Trang từ vựng đã lưu | 1. Hiển thị danh sách từ vựng người dùng đã đánh dấu sao. <br>2. Bỏ đánh dấu sao trực tiếp trên trang làm biến mất từ đó khỏi danh sách. | **0** / 2 | Chưa viết |

---

### D. Feature: Lessons (Học tiếng Anh qua video)

| STT | Trang / Component | Mô tả chức năng | Danh sách testcases tối thiểu cần có | Số testcase đã viết | Trạng thái / File test |
| :--- | :--- | :--- | :--- | :---: | :--- |
| 18 | **LessonListPage** | Danh sách bài học video | 1. Hiển thị danh sách bài học video kèm cấp độ (Easy, Medium, Hard). <br>2. Tìm kiếm bài học theo tiêu đề và lọc theo danh mục chủ đề. | **1** / 2 | Hoàn thành (E2E) <br>[dictation.e2e.test.js](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/e2e/dictation.e2e.test.js) |
| 19 | **DictationStudyPage** | Giao diện học chính tả | 1. Trình phát video YouTube tự động dừng ở cuối mỗi phân đoạn (segment). <br>2. Nhập nội dung nghe được, so khớp chính tả và hiển thị kết quả Đúng/Sai. <br>3. Tính năng xem gợi ý (Hint) hiển thị các ký tự gợi ý của phân đoạn. <br>4. Xem bản dịch phân đoạn khi hoàn tất. | **1** / 4 | Hoàn thành (E2E) <br>[dictation.e2e.test.js](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/e2e/dictation.e2e.test.js) |
| 20 | **ShadowingStudyPage** | Giao diện luyện đọc Shadowing | 1. Tải phân đoạn video và phát lại giọng mẫu chuẩn. <br>2. Giả lập ghi âm giọng người học, chấm điểm độ khớp phát âm và hiển thị kết quả. | **0** / 2 | Chưa viết |

---

### E. Feature: Gamification (Bảng xếp hạng)

| STT | Trang / Component | Mô tả chức năng | Danh sách testcases tối thiểu cần có | Số testcase đã viết | Trạng thái / File test |
| :--- | :--- | :--- | :--- | :---: | :--- |
| 21 | **LeaderboardPage** | Trang bảng xếp hạng | 1. Hiển thị nổi bật TOP 3 người dẫn đầu trên giao diện Podium. <br>2. Hiển thị danh sách bảng xếp hạng người dùng kèm phân trang. <br>3. Hiển thị card thông tin thứ hạng và điểm XP hiện tại của người dùng đang đăng nhập. | **1** / 3 | Hoàn thành (E2E) <br>[leaderboard.e2e.test.js](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/e2e/leaderboard.e2e.test.js) |

---

### F. Feature: Profile (Thông tin cá nhân)

| STT | Trang / Component | Mô tả chức năng | Danh sách testcases tối thiểu cần có | Số testcase đã viết | Trạng thái / File test |
| :--- | :--- | :--- | :--- | :---: | :--- |
| 22 | **ProfilePage** | Trang hồ sơ người dùng | 1. Hiển thị thông tin cá nhân và số liệu thống kê học tập (XP, cấp độ, số từ đã học). <br>2. Cập nhật thành công tên hiển thị và ảnh đại diện. <br>3. Thay đổi mật khẩu tài khoản trực tiếp trong trang cấu hình. | **0** / 3 | Chưa viết |

---

### G. Feature: Battle (Đối kháng từ vựng Socket.io)

| STT | Trang / Component | Mô tả chức năng | Danh sách testcases tối thiểu cần có | Số testcase đã viết | Trạng thái / File test |
| :--- | :--- | :--- | :--- | :---: | :--- |
| 23 | **BattleLobbyPage** | Phòng chờ tìm đối thủ | 1. Tạo phòng đấu và hiển thị mã phòng (Room ID) để mời bạn bè. <br>2. Nhập mã phòng và tham gia phòng đấu của bạn bè thành công. <br>3. Nhấp chọn "Tìm trận" đưa người dùng vào hàng đợi (Queue) ghép trận ngẫu nhiên. | **1** / 3 | Hoàn thành (E2E) <br>[battle.e2e.test.js](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/e2e/battle.e2e.test.js) |
| 24 | **BattlePlayPage** | Giao diện phòng đấu | 1. Hiển thị đồng bộ câu hỏi trắc nghiệm từ vựng và đếm ngược thời gian. <br>2. Bấm chọn đáp án gửi lên server, cập nhật điểm số tức thời trên Scoreboard. <br>3. Trận đấu kết thúc hiển thị bảng kết quả thắng/thua cùng điểm XP nhận được. <br>4. Hiển thị thông báo đối thủ ngắt kết nối giữa chừng và xử lý tự động xử thắng. | **1** / 4 | Hoàn thành (E2E) <br>[battle.e2e.test.js](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/e2e/battle.e2e.test.js) |

---

### H. Feature: Admin (Bảng quản trị)

| STT | Trang / Component | Mô tả chức năng | Danh sách testcases tối thiểu cần có | Số testcase đã viết | Trạng thái / File test |
| :--- | :--- | :--- | :--- | :---: | :--- |
| 25 | **AdminDashboard** | Trang tổng quan quản trị | 1. Hiển thị biểu đồ thống kê tăng trưởng người dùng, tổng số bài học, từ vựng. | **0** / 1 | Chưa viết |
| 26 | **Admin Management** <br>(Users, Decks, Cards, Lessons, Topics) | Các trang quản lý danh mục | 1. Quản lý danh sách, tìm kiếm, lọc dữ liệu. <br>2. Thêm mới bản ghi (ví dụ: tạo bài học mới, upload video YouTube). <br>3. Cập nhật thông tin chi tiết bản ghi. <br>4. Xóa bản ghi và xử lý cảnh báo trước khi xóa. | **2** / 10 | Hoàn thành (E2E) <br>[admin.e2e.test.js](file:///d:/Dai_Hoc/Nam_3/Ki_2_Dot_2/CNPMM/project/MinLish/frontend/tests/e2e/admin.e2e.test.js) |

---

