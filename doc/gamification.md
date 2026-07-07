# Gamification Module

---

## 1. Tổng quan

Gamification gồm 3 phần chính:

| Phần | Mô tả |
| :--- | :---- |
| **Streak** | Chuỗi ngày học liên tiếp. Tăng khi user có hành động học thật mỗi ngày. |
| **XP & Level** | Điểm kinh nghiệm tích lũy theo hoạt động. XP đủ ngưỡng thì lên cấp. |
| **Leaderboard & Rank** | Bảng xếp hạng toàn server theo tổng XP all-time. |

---

## 2. Cấu trúc file

```
backend/src/
├── config/
│   └── gamification.config.js       # Hằng số XP, công thức level, helper getDayKey
├── models/
│   ├── userGamification.model.js    # Profile gamification của mỗi user
│   └── xpEvent.model.js             # Lưu XP event (audit log + idempotency)
└── modules/gamification/
    ├── gamification.router.js
    ├── gamification.controller.js
    ├── gamification.service.js
    └── gamification.schema.js      
```

---

## 3. Lượng XP theo hành động

Định nghĩa trong `src/config/gamification.config.js`:

| Hành động | Source key | XP |
| :--- | :--- | :--- |
| Hoàn thành 1 segment dictation (đạt pass) | `segment_complete` | 10 |
| Hoàn thành 1 segment shadowing (đạt pass) | `segment_complete` | 12 |
| Review 1 thẻ qua SRS grade | `card_review` | 3 |
| Tham gia 1 trận battle | `battle_play` | 15 |
| Thắng trận battle | `battle_win` | 35 |
| **Bonus streak** (lần đầu hoạt động trong ngày) | `daily_streak` | 20 |

> Bonus streak chỉ tặng **một lần mỗi ngày**, dù user làm bao nhiêu hoạt động đi nữa.
> Học 1 card dù là hình thức review, flashcard hay MCQ đều chỉ tặng **một lần mỗi ngày** (hôm sau học lại thẻ đó vẫn tặng).
> Hoàn thành 1 segment chỉ tặng **một lần duy nhất suốt đời cho mỗi mode** — `dictation` và `shadowing` của cùng segment là 2 lần thưởng độc lập; làm lại cùng (segment, mode) không tặng thêm.

### XP segment — tính theo ngưỡng pass, riêng từng mode

Định nghĩa trong `SEGMENT_XP` (`gamification.config.js`). Chỉ tặng khi điểm chất lượng `score` đạt `pass`:

| Mode | Nguồn `score` | `pass` | XP khi đạt |
| :--- | :--- | :---: | :---: |
| `dictation` | % từ tự gõ đúng (không tính từ đã reveal) | 60 | 10 |
| `shadowing` | điểm phát âm Azure (PronScore) | 55 | 12 |

> `score < pass` → **0 XP**: gõ/nói bậy, hoặc reveal hết gợi ý (dictation score về 0) đều không được thưởng. Chống cào điểm.
> `recordActivity` nhận tham số `amountOverride` để truyền lượng XP segment.
---

## 4. Idempotency — không bao giờ tặng XP 2 lần

Mỗi sự kiện XP được lưu vào collection `xp_events` với unique index `{ userId, source, refId }`.

| Hành động | refId được dùng |
| :--- | :--- |
| Segment complete | `${segmentId}:${mode}` — 1 lần/segment/mode (`dictation`/`shadowing`) |
| Card review | `${cardId}:${dayKey}` — 1 lần/thẻ/ngày |
| Battle play | `matchId` |
| Battle win | `matchId` |
| Daily streak bonus | `dayKey` (YYYY-MM-DD) |

Nếu gọi `recordActivity` 2 lần với cùng `(userId, source, refId)` → lần 2 bị chặn bởi E11000 duplicate key → trả về sớm, không tặng XP thêm.

---

## 5. Công thức Level

```
requiredXpForLevel(L) = 50 × L × (L + 1)
```

| Level | XP tối thiểu cần đạt |
| :---: | :---: |
| 1 | 0 |
| 2 | 100 |
| 3 | 300 |
| 4 | 600 |
| 5 | 1000 |
| L | 50 × (L-1) × L |

`computeLevel(totalXp)` trả về level cao nhất mà `totalXp >= requiredXpForLevel(level - 1)`. Tối thiểu level 1 (kể cả khi XP âm).

---

## 6. Streak — quy tắc

- Streak **chỉ tăng** khi có hành động học thật: hoàn thành segment, grade thẻ SRS, chơi battle.
- Mở app / xem trang / gọi GET endpoint **không** tăng streak.
- **Cùng ngày** làm nhiều hành động → streak chỉ tính 1.
- **Ngày liên tiếp** → `currentStreak + 1`.
- **Bỏ 1 ngày** → reset về 1.
- `longestStreak` chỉ tăng, không bao giờ giảm.
- Ranh giới ngày tính theo múi giờ `Asia/Ho_Chi_Minh` (UTC+7), cấu hình qua env `GAMIFY_TZ`.

---

## 7. Entry point duy nhất: `recordActivity`

Mọi tính năng muốn tặng XP/streak đều gọi hàm này trong `gamification.service.js`:

```js
await gamificationService.recordActivity(userId, source, refId);
```

**Luôn wrap trong try/catch ở phía caller.** Lỗi gamification không được làm hỏng flow học chính:

```js
try {
  await gamificationService.recordActivity(
    userId,
    'segment_complete',
    `${segmentId}:${mode}`, // refId per-mode: <segmentId>:dictation | <segmentId>:shadowing
    xp // amountOverride: lượng XP động theo chất lượng (>0 mới award)
  );
} catch (e) {
  logger.warn('gamification recordActivity failed', e);
}
```

> Tham số 4 `amountOverride` tùy chọn — bỏ trống thì dùng XP cố định theo `source` (vd `card_review` = 3).

---

## 8. Models

### collection: `user_gamification`

| Field | Kiểu | Ý nghĩa |
| :--- | :--- | :--- |
| `userId` | ObjectId (ref User) | Liên kết user, unique |
| `totalXp` | Number (default 0) | Tổng XP tích lũy all-time |
| `level` | Number (default 1) | Cấp độ hiện tại |
| `currentStreak` | Number (default 0) | Chuỗi ngày học liên tiếp hiện tại |
| `longestStreak` | Number (default 0) | Kỷ lục streak cao nhất |
| `lastActiveDayKey` | String \| null | Ngày cuối cùng học (YYYY-MM-DD UTC+7) |
| `lastXpAt` | Date | Lần cuối nhận XP |
| `createdAt` | Date | Tự động (timestamps) |
| `updatedAt` | Date | Tự động (timestamps) |

Index: `{ totalXp: -1, _id: 1 }` để leaderboard sort ổn định.

### collection: `xp_events`

| Field | Kiểu | Ý nghĩa |
| :--- | :--- | :--- |
| `userId` | ObjectId | User nhận XP |
| `source` | String (enum) | Loại hành động (xem bảng mục 3) |
| `refId` | String | ID định danh hành động cụ thể |
| `amount` | Number | Lượng XP được tặng |
| `createdAt` | Date | Tự động (timestamps) |

Unique index: `{ userId: 1, source: 1, refId: 1 }` — đây là cơ chế idempotency.

---

## 9. API Endpoints

Tất cả yêu cầu **Bearer token** (`Authorization: Bearer <access_token>`).

### GET `/api/v1/gamification/streak`

Trả về trạng thái streak hiện tại.

```json
{
  "success": true,
  "code": "STREAK_FETCHED",
  "data": {
    "currentStreak": 5,
    "longestStreak": 12,
    "lastActiveDayKey": "2026-06-20",
    "activeToday": true
  }
}
```

---

### GET `/api/v1/gamification/me`

Trả về hồ sơ gamification đầy đủ.

```json
{
  "success": true,
  "code": "PROFILE_FETCHED",
  "data": {
    "totalXp": 340,
    "level": 2,
    "currentStreak": 5,
    "longestStreak": 12,
    "xpIntoLevel": 40,
    "xpForNextLevel": 200,
    "progressPct": 20
  }
}
```

| Field | Ý nghĩa |
| :--- | :--- |
| `xpIntoLevel` | XP đã tích lũy trong level hiện tại (tính từ sàn level) |
| `xpForNextLevel` | Tổng XP cần để hoàn thành level này và lên cấp |
| `progressPct` | `xpIntoLevel / xpForNextLevel × 100`, clamp 0–100 |

---

### GET `/api/v1/gamification/me/rank`

Thứ hạng của user hiện tại.

```json
{
  "success": true,
  "code": "RANK_FETCHED",
  "data": {
    "rank": 5,
    "totalXp": 340,
    "totalPlayers": 120
  }
}
```

`rank = (số người có totalXp lớn hơn mình) + 1`. User chưa có hoạt động có rank = cuối bảng.

---

### GET `/api/v1/gamification/leaderboard?page=1&limit=20`

Bảng xếp hạng toàn server.

**Query params:**

| Param | Kiểu | Mặc định | Giới hạn |
| :--- | :--- | :--- | :--- |
| `page` | integer | 1 | ≥ 1 |
| `limit` | integer | 20 | 1–100 |

Vi phạm → HTTP 400.

```json
{
  "success": true,
  "code": "LEADERBOARD_FETCHED",
  "data": {
    "items": [
      {
        "rank": 1,
        "userId": "664f...",
        "name": "Nguyen Van A",
        "avatarUrl": null,
        "totalXp": 520,
        "level": 3
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 120
  }
}
```

Hòa điểm (`totalXp` bằng nhau) → phân định bằng `_id` tăng dần để thứ tự ổn định khi phân trang.

---

## 10. Cách tích hợp tính năng mới

Muốn một hành động mới tặng XP, thêm vào `SOURCE_XP_MAP` trong `gamification.service.js` và `XP` object trong `gamification.config.js`, sau đó gọi `recordActivity` ở đúng vị trí trong service của tính năng đó.

Không cần sửa controller hay router gamification.
