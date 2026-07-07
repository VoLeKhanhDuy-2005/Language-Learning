### 1. Thông tin chung về API
- **Endpoint:** `POST /ai/response`
- **Middleware:** `protect` (Yêu cầu người dùng phải đăng nhập hợp lệ để sử dụng).
- **Controller:** `responseQuestion` (nằm trong `ai.controller.js`).
- **Service:** `responseQuestionService` (nằm trong `ai.service.js`).
- **Mô hình AI sử dụng:** `gemini-2.5-flash` của Google Generative AI.

---

### 2. Luồng hoạt động chi tiết

#### Bước 1: Tiếp nhận và Kiểm tra Dữ liệu Đầu vào (Controller)
1. Hệ thống nhận request body gồm hai trường:
   - `question` (String): Nội dung câu hỏi của người dùng (bắt buộc).
   - `mode` (String): Chế độ xử lý của AI (tùy chọn, mặc định là `'minlish'`).
2. Kiểm tra tính hợp lệ:
   - Nếu không có `question`, API trả về lỗi `400 Bad Request` với thông báo: *"Bắt buộc nhập câu hỏi"*.
   - Nếu hợp lệ, Controller sẽ gọi xuống tầng Service: `aiService.responseQuestionService(question, mode)`.

#### Bước 2: Xử lý Logic tại tầng Service
Service sẽ chia nhánh xử lý dựa vào tham số `mode`:

**Nhánh A: Nếu `mode === 'network'` (Chế độ tra cứu mở trên mạng)**
1. Hàm `responseQuestionNetworkService` được gọi.
2. Hệ thống gửi prompt trực tiếp đến mô hình Gemini với nội dung câu hỏi của người dùng.
3. Yêu cầu AI trả về định dạng JSON gồm `isValidQuestion` (boolean) và `answer` (câu trả lời). Nếu câu hỏi không liên quan đến học tiếng Anh, AI sẽ đánh dấu `isValidQuestion: false`.
4. Trả kết quả về cho Controller.

**Nhánh B: Nếu `mode !== 'network'` (Chế độ mặc định 'minlish' - Tra cứu trong Database nội bộ)**
Đây là quy trình RAG (Retrieval-Augmented Generation) để lấy dữ liệu ngữ cảnh từ hệ thống:

1. **Trích xuất từ khóa (Keyword Extraction):**
   - Gọi `extractKeywordsService`.
   - AI được yêu cầu phân tích `question` và trích xuất ra các từ vựng tiếng Anh hoặc nghĩa tiếng Việt, loại bỏ các từ để hỏi thông thường. Kết quả trả về là một mảng `keywords`.
   - Nếu `keywords` rỗng: Trả về lỗi tự định nghĩa: *"Không tìm thấy từ khóa hợp lệ trong câu hỏi để tra cứu hệ thống."* (`isValidQuestion: false`).

2. **Truy vấn Dữ liệu Hệ thống (Query MinLish Data):**
   - Gọi `queryMinLishDataForAI(keywords)`.
   - Lặp qua từng từ khóa để tìm kiếm thẻ từ vựng (`Card`) trong Database (khớp regex với từ tiếng Anh hoặc nghĩa tiếng Việt).
   - Nếu tìm thấy từ vựng chính, hệ thống sẽ tiếp tục lấy thêm dữ liệu liên quan để làm giàu ngữ cảnh:
     - *10 thẻ từ vựng liên quan cùng Topic*.
     - *10 thẻ từ vựng liên quan cùng Deck*.
     - *10 bài học (Lesson)* có chứa từ khóa này trong tiêu đề hoặc mô tả.
   - Gộp tất cả thông tin này lại thành một văn bản ngữ cảnh (`contextData`).

3. **Sinh Câu Trả Lời (Generate Response):**
   - Kiểm tra `contextData`:
     - Nếu **không tìm thấy** dữ liệu nào khớp trong Database: Trả về thông báo: *"Hệ thống MinLish hiện tại chưa có dữ liệu nào khớp với câu hỏi của bạn. Hãy thử chuyển sang chế độ tìm kiếm trên mạng!"* (`isValidQuestion: true`).
     - Nếu **có dữ liệu**: Gọi `responseQuestionMinLishService(question, contextData)`.
   - Hệ thống nối `contextData` vào prompt và gửi cho AI Gemini, yêu cầu trả lời câu hỏi dựa trên ngữ cảnh được cung cấp.

#### Bước 3: Trả về Kết Quả (Response)
Kết quả định dạng JSON từ AI được Controller tiếp nhận và trả về cho người dùng (Client) dưới dạng:
```json
{
  "success": true,
  "data": {
    "isValidQuestion": true/false,
    "answer": "Nội dung câu trả lời của AI..."
  }
}

Luồng hoạt động này đảm bảo rằng AI sẽ ưu tiên trả lời dựa trên những dữ liệu (từ vựng, bài học) mà người dùng đang học trực tiếp trên hệ thống MinLish, giúp việc học mang tính cá nhân hóa và sát với ngữ cảnh ứng dụng.