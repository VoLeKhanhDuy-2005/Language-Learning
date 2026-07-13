# Kế hoạch Tích hợp Autofill Audio và Ảnh (Zero Cost & Uy tín)

Để tích hợp tính năng tự động điền **Audio** và **Ảnh minh họa** mà không tốn chi phí (quota API trả phí như OpenAI hay Google Cloud Vision) nhưng vẫn đảm bảo chất lượng, uy tín và chính xác, đề xuất kiến trúc xử lý kết hợp các API miễn phí tốt nhất hiện nay.

## 1. Giải pháp cho Audio (Phát âm)

Đối với phát âm, chúng ta cần cả chuẩn phiên âm quốc tế (IPA) và file âm thanh thực tế (ưu tiên giọng người thật hoặc TTS chất lượng cao).

**Đề xuất kết hợp 2 lớp (Fallback Mechanism):**

1. **Lớp 1 (Ưu tiên): Free Dictionary API (`https://api.dictionaryapi.dev/api/v2/entries/en/`)**
   - **Ưu điểm:** Hoàn toàn miễn phí, không cần API Key. Trả về chính xác phiên âm IPA và file MP3 phát âm (US/UK) được lấy nguồn từ Wiktionary (rất uy tín).
   - **Nhược điểm:** Chỉ tra được từ đơn hoặc cụm từ phổ biến. Không tra được cả câu.
2. **Lớp 2 (Dự phòng): Google Translate TTS Endpoint**
   - **Cách hoạt động:** Khi từ/cụm từ không có trong từ điển ở Lớp 1 (ví dụ: một cụm thành ngữ hoặc một câu dài), ta fallback sử dụng API TTS ẩn của Google (`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-US&q=<word>`).
   - **Ưu điểm:** Cover 100% mọi từ/cụm từ/câu. Zero cost.

## 2. Giải pháp cho Ảnh minh họa (Images)

Để lấy ảnh uy tín, đẹp, bản quyền mở và không tốn quota, các thư viện ảnh Stock miễn phí là lựa chọn số 1.

**Đề xuất:** Sử dụng **Pexels API** hoặc **Pixabay API**

- **Ưu điểm:**
  - Cung cấp ảnh chất lượng cực cao (stock photos, illustrations).
  - Quota miễn phí cực lớn: Ví dụ Pexels cho phép **20.000 requests/tháng** (hoàn toàn đủ dùng cho ứng dụng thực tế). Pixabay cũng tương tự.
  - Rất uy tín và an toàn (không có ảnh rác/lỗi).
- **Cách hoạt động:** Khi người dùng nhấn Autofill, backend sẽ gọi Pexels/Pixabay API với từ khóa là `term` (hoặc bản dịch tiếng Anh của từ đó) để lấy top 1 ảnh đẹp nhất làm `imageUrl`.

## 3. Luồng xử lý (Workflow) đề xuất

Khi người dùng nhấn "Tự điền bằng AI" cho từ (ví dụ: _"apple"_):

1. **Backend nhận Request (`/api/v1/ai/autofill`)**:
2. **Chạy song song (Promise.all) 3 luồng để tối ưu tốc độ**:
   - _Luồng 1 (AI Text):_ Gọi Gemini/OpenAI (như hiện tại) để lấy Nghĩa, Từ loại, Giải thích, Ví dụ. (Prompt có thể bỏ yêu cầu tạo phonetics để AI chạy nhanh hơn và đỡ tốn token).
   - _Luồng 2 (Audio):_ Gọi Free Dictionary API để lấy audio URL + IPA. Nếu lỗi -> Tạo URL Google TTS.
   - _Luồng 3 (Image):_ Gọi Pexels/Pixabay API để tìm 1 ảnh cho từ _"apple"_.
3. **Tổng hợp:** Gom Text + Audio + Image lại và trả về cho Frontend hiển thị lên Form.

---

## 💡 Open Questions (Cần bạn phản hồi để tiến hành)

1. **Về Image API:** Bạn thích sử dụng **Pexels** (nhiều ảnh chụp đẹp, nghệ thuật) hay **Pixabay** (nhiều vector, hình vẽ minh họa học từ vựng tốt hơn)? (Lưu ý: Bạn sẽ cần đăng ký 1 tài khoản miễn phí trên web của họ để lấy API Key bỏ vào file `.env`).
2. **Về Google TTS:** Bạn có đồng ý dùng thủ thuật link Google TTS làm phương án dự phòng (fallback) cho audio không?
3. **Phạm vi áp dụng:** Bạn muốn cập nhật API Autofill này cho cả Admin (quản lý kho từ chung) và User (bộ từ cá nhân) đúng không?

Xin hãy cho tôi biết ý kiến của bạn để tôi bắt tay vào viết code!
