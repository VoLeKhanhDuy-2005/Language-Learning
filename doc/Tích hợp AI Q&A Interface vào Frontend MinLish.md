# Tích hợp AI Q&A Interface vào Frontend MinLish

## Mô tả

Tích hợp giao diện chat AI vào dự án frontend React (`frontend/`) của MinLish, kết nối với API backend tại endpoint `POST /api/v1/ai/response`.

## Tổng quan kiến trúc

```
Frontend (Vite + React JSX)          Backend (Express)
  /ai  →  AIChatPage.jsx  →  aiApi.js  →  POST /api/v1/ai/response
                                              ↓
                                         ai.controller.js
                                              ↓
                                         ai.service.js (Gemini AI)
```

**Backend API đã có:**

- `POST /api/v1/ai/response` — body: `{ question, mode, language }`
  - `mode`: `"minlish"` (dùng dữ liệu MinLish DB) hoặc `"network"` (AI tự do)
  - `language`: `"vi"` hoặc `"en"`
  - Response: `{ isValidQuestion: boolean, answer: string }`
- Yêu cầu xác thực (Bearer token) — chỉ user đã đăng nhập mới dùng được

## Thay đổi đề xuất

---

### 1. AI API Service

#### [NEW] [aiApi.js](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/MinLish/frontend/src/features/ai/aiApi.js)

- Hàm `askAIQuestion(question, mode, language)` gọi `POST /api/v1/ai/response` qua `apiClient`

---

### 2. AI Chat Page Component

#### [NEW] [AIChatPage.jsx](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/MinLish/frontend/src/features/ai/pages/AIChatPage.jsx)

Chuyển đổi `App.tsx` từ folder AI Q&A Interface thành component React JSX thuần, tích hợp:

- Thay mock data bằng gọi API thật qua `aiApi.js`
- Map mode: `"minlish"` → `"minlish"`, `"search"` → `"network"` (theo backend)
- Lấy `language` từ `i18n.language` (đa ngôn ngữ)
- Hiển thị lỗi khi câu hỏi không hợp lệ hoặc API lỗi
- Dùng `useAuth()` để lấy thông tin user (tên, avatar)
- Giữ toàn bộ UI/UX đẹp từ bản gốc (sidebar, mode toggle, typing indicator, ...)

#### [NEW] [AIChatPage.css](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/MinLish/frontend/src/features/ai/pages/AIChatPage.css)

- CSS hỗ trợ cho component (nếu cần bổ sung ngoài Tailwind/class hiện tại)

> [!NOTE]
> AI Q&A Interface dùng Tailwind CSS và Shadcn. Frontend chính dùng Vanilla CSS. Sẽ tích hợp bằng cách chuyển các class Tailwind sang inline style hoặc CSS module tương đương, đảm bảo không xung đột style.

---

### 3. Routing trong App.jsx

#### [MODIFY] [App.jsx](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/MinLish/frontend/src/App.jsx)

- Import `AIChatPage`
- Thêm route `/ai` vào `renderContent()` — protected (yêu cầu đăng nhập)
- Thêm `/ai` vào danh sách `privateUserPaths`

---

### 4. Navigation — Header

#### [MODIFY] [Header.jsx](file:///d:/VO%20LE%20KHANH%20DUY/New%20Technologies%20In%20Software/MinLish/frontend/src/components/Header/Header.jsx)

- Thêm link "AI Chat" (hoặc icon ✨) vào nav, trỏ đến `/ai`
- Active state khi `currentPath.startsWith("/ai")`

---

## Open Questions

> [!IMPORTANT]
> **1. Tên menu trong Header:** Muốn link AI Chat hiển thị trong nav với tên/icon như thế nào?
>
> - Ví dụ: "MinLish AI", "Trợ lý AI", hoặc chỉ icon ✨

> [!IMPORTANT]
> **2. Lịch sử hội thoại (Conversation History):** Backend hiện **không** lưu lịch sử chat. Sidebar "Gần đây" hiện tại dùng mock data.
>
> - Giữ mock data sidebar (chỉ là UI demo)?
> - Hay bỏ sidebar lịch sử, chỉ giữ session trong memory?
> - Hay cần thêm API lưu lịch sử?

> [!IMPORTANT]
> **3. Multi-turn context:** Mỗi câu hỏi gửi độc lập. Có cần gửi kèm lịch sử hội thoại để AI có context không?

## Verification Plan

### Automated Tests

- Không thay đổi test files

### Manual Verification

1. Chạy `npm run dev` trong `frontend/`
2. Đăng nhập với tài khoản user
3. Click vào "AI Chat" trên Header → điều hướng tới `/ai`
4. Nhập câu hỏi tiếng Việt, chọn mode "MinLish" → nhận trả lời từ backend
5. Chuyển sang mode "Tìm kiếm mạng" → gọi API với `mode: "network"`
6. Thử câu hỏi không hợp lệ → hiển thị thông báo lỗi phù hợp
7. Khi chưa đăng nhập, truy cập `/ai` → redirect về `/login`
