# Tích hợp mô hình NLU bằng thư viện NLP.js

Dùng mô hình học máy (Machine Learning) thực thụ chạy trực tiếp trên Node.js để phân loại ý định người dùng (Intent Classification).

## Mục tiêu

- Áp dụng thư viện `node-nlp` để huấn luyện một mô hình NLU (Natural Language Understanding) cục bộ.
- Kết hợp mô hình NLU (để nhận diện Intent) và Rule-based (thuật toán lọc Stopwords hiện có để nhận diện Từ vựng / Entity). Đây là **Kiến trúc Lai (Hybrid Architecture)**.

## Ideas

---

### Cài đặt thư viện

- Chạy lệnh `npm install node-nlp` tại `backend`.

### Mã nguồn Backend (`backend/src/modules/ai/`)

#### [NEW] [ai.nlu.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/MinLish/backend/src/modules/ai/ai.nlu.js)

Tạo file mới chuyên quản lý việc thiết lập, huấn luyện (training) và dự đoán của mô hình NLP.

- Khởi tạo `NlpManager` với ngôn ngữ `vi` (Tiếng Việt).
- Cung cấp các câu mẫu (utterances) cho các Intent:
  - `intent.meaning`: hỏi nghĩa (VD: "nghĩa là gì", "dịch từ này")
  - `intent.example`: hỏi ví dụ (VD: "cho xin ví dụ", "đặt câu với")
  - `intent.pronunciation`: hỏi phát âm (VD: "đọc sao", "phát âm từ này")
  - `intent.related`: hỏi từ liên quan (VD: "từ cùng chủ đề", "từ liên quan")
  - `intent.lesson`: hỏi bài học (VD: "học từ này ở đâu", "bài học nào có")
- Viết hàm `trainNlpModel()` để train khi khởi động server.
- Viết hàm `predictIntent(text)` để trả về intent dựa trên câu hỏi của user.

#### [MODIFY] [ai.service.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/MinLish/backend/src/modules/ai/ai.service.js)

Sửa đổi logic trong `responseQuestionMinLishService`:

- Gọi hàm `predictIntent(question)` từ file `ai.nlu.js`.
- Dựa vào `intent` trả về (VD: `intent.example`), sẽ format câu trả lời (answer) tương ứng.
- (Vẫn giữ nguyên hàm `extractKeywordsService` hiện tại vì nó đang làm rất tốt nhiệm vụ Keyword/Entity Extraction sau khi đã cấu hình Stopwords).

#### [MODIFY] [server.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/MinLish/backend/server.js) (hoặc file khởi động)

- Gọi hàm `trainNlpModel()` khi server Node.js vừa start lên để mô hình sẵn sàng trước khi nhận request từ người dùng.

## Verification Plan

### Automated Tests

- Gửi các câu hỏi có biến thể ngữ pháp (VD: "tớ muốn biết cách đọc chữ television", "tivi đọc tiếng anh là gì") để xem mô hình NLP có nhận diện đúng `intent.pronunciation` hay không, dù câu hỏi không có chữ "phát âm".

### Manual Verification

- Chat thử trên giao diện Minlish để xác nhận phản hồi trả về đúng context (Ví dụ, Phát âm, Bài học, v.v.)
- Đảm bảo terminal backend in ra thông báo train model thành công lúc startup.
