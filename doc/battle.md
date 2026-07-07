# Module Battle

## 1. Tổng quan

Module Battle cho phép 2 user đấu từ vựng 1v1 **real-time** qua WebSocket (socket.io). Server kiểm soát toàn bộ luồng game — thời gian, điểm số, kết quả. Client chỉ hiển thị và gửi đáp án.

Sau trận, hệ thống tự trao XP và tính streak qua Gamification module.

---

## 2. Kiến trúc

```
backend/
├── src/
│   ├── models/
│   │   └── battleMatch.model.js       MongoDB schema
│   ├── modules/battle/
│   │   ├── battle.service.js          generateQuestions, getHistory, getMatchById
│   │   ├── battle.controller.js       REST handlers
│   │   ├── battle.router.js           REST routes
│   │   └── battle.schema.js           Zod validation
│   └── socket/
│       ├── index.js                   initSocket, getIo, auth middleware
│       ├── auth.socket.js             JWT auth cho socket
│       └── battle/
│           ├── index.js               đăng ký socket event handlers
│           ├── matchmaking.js         queue + invite room
│           └── engine.js              game loop, scoring, disconnect handling

```

**Phân tách trách nhiệm:**

| Layer                      | Trách nhiệm                                              |
| :------------------------- | :------------------------------------------------------- |
| `matchmaking.js`           | Ghép trận (queue/invite)                                 |
| `engine.js`                | Game loop, tính điểm, xử lý disconnect/reconnect/forfeit |
| `battle.service.js`        | Sinh câu hỏi từ DB, truy vấn lịch sử trận                |
| `battle.router/controller` | 2 REST endpoints: lịch sử + chi tiết trận                |

---

## 3. Database

**Collection:** `battle_matches`

```
BattleMatch {
  mode:        'mcq' | 'typing'
  matchType:   'queue' | 'invite'
  roomCode:    String (sparse unique — chỉ có với invite)
  status:      'waiting' | 'in_progress' | 'finished' | 'abandoned'
  players: [
    { userId: ObjectId, score: Number, correctCount: Number, connected: Boolean }
  ]
  questions: [
    { cardId: ObjectId, term: String, correctAnswer: String, options: [String] }
    // options rỗng [] với typing mode
  ]
  winnerId:    ObjectId | null   (null = hòa hoặc abandoned)
  startedAt:   Date
  finishedAt:  Date
  timestamps:  true
}
```

**Nguồn câu hỏi:** Card từ **system decks** (`deck.ownerType = 'system'`, `deck.status = 'published'`). Không dùng deck của user.

---

## 4. Tính điểm

```
Đúng:  score = 100 + round(50 × remainingMs / 12000)
Sai:   score = 0
```

- Điểm tính **ngay lúc submit**, không phụ thuộc đối thủ.
- `remainingMs = deadlineTs - Date.now()` tại thời điểm server nhận answer.
- Speed bonus tối đa 50 điểm (trả lời ngay lập tức).
- Server là nguồn gốc sự thật — không thể gian lận bằng cách delay gửi packet.

**Vòng lặp round (server-authoritative):**

```
startMatch → emit 'battle:starting' { countdownMs, mode, total }  ← đếm ngược pre-game
           → pause startCountdownMs (3s) để 2 client render màn battle
           → runRound câu 0
runRound → emit 'battle:question' { index, total, term, mode, options, deadlineTs }
         → roundTimer (12s) | hoặc cả 2 đã answer → advanceRound
advanceRound → emit 'battle:roundResult' { index, correctAnswer, scores }  ← lộ đáp án + điểm
             → pause roundRevealMs (3s) để client hiện đáp án
             → runRound câu kế (deadlineTs mới full 12s) | hoặc finalizeMatch
```

- Start countdown (`startCountdownMs`) đặt **server-side**: timer câu 0 chỉ chạy sau countdown nên 2 client kịp render, không mất giây oan.
- `battle:starting`, `battle:finished`, `battle:opponentLeft` (forfeit) kèm `players: [{ userId, name, avatarUrl, … }]` (profile load 1 lần lúc startMatch, cache trong `liveState.profiles`) để client render avatar/tên real-time. `opponentLeft` còn kèm `winner` (profile) + `forfeitUserId`. Các event khác (`question`/`roundResult`) vẫn chỉ dùng userId thô.
- Đáp án đúng chỉ lộ ở `battle:roundResult` (không bao giờ gửi kèm `battle:question`).
- Typing mode: `battle:question` kèm gợi ý `answerLength`, `answerPattern` (độ dài từng từ), `firstChar` — giúp thu hẹp synonym, **không** lộ đáp án. Hint sống in-memory (`liveState.questions`), không lưu DB.
- Reveal pause (`roundRevealMs`) đặt **server-side**: câu kế chỉ broadcast sau pause nên `deadlineTs` luôn đủ 12s, đồng bộ 2 client.

---

## 5. Xử lý Disconnect

```
Player mất kết nối
       │
       ▼
server: player.connected = false
server: emit 'battle:opponentDisconnected' cho đối thủ
server: set graceTimer (15s)
       │
   ┌───┴──────────────────────────┐
   │ Trong 15s                    │ Sau 15s
   ▼                              ▼
Player emit 'battle:rejoin'    opponent.connected?
       │                        ├── Yes → finalizeAsForfeit (đối thủ thắng)
server: cancel graceTimer       └── No  → abandonMatch (status='abandoned')
server: rebind socket
server: emit 'battle:rejoined'
  { currentRound, total, term, mode, options, deadlineTs }   ← sync state hiện tại
Trận tiếp tục bình thường
```

**Forfeit** (`finalizeAsForfeit`): persist DB, emit `battle:opponentLeft`, gọi `grantRewards` nếu đã chơi ≥ 1 round (cùng luật gate như finish — xem mục 6).

**Abandon** (`abandonMatch`): persist `status='abandoned'`, emit `battle:abandoned`, **không trao XP**.

---

## 6. Reward sau trận

Tích hợp với `gamification.service.js`. Logic thưởng dùng chung cho finish + forfeit (`grantRewards`), gate 2 lớp:

**Lớp 1 — Streak (luôn tính).** Mọi player đã chơi ≥ 1 vòng đều cập nhật streak + daily bonus (1 lần/ngày), bất kể loại trận hay kết quả. Player đạt ngưỡng nỗ lực dùng `recordActivity` (vừa +15 XP vừa streak); player dưới ngưỡng / trận invite dùng `touchStreak` (chỉ streak, không XP).

**Lớp 2 — XP battle (có điều kiện).**

| Hành động     | XP  | Điều kiện                                                        |
| :------------ | :-- | :-------------------------------------------------------------- |
| Streak + bonus | +20/ngày | Mọi trận, chơi ≥ 1 vòng. Idempotent theo `dayKey`         |
| `battle_play` | +15 | `matchType='queue'` **và** `correctCount >= minCorrectForReward` |
| `battle_win`  | +35 | `queue` **và** thắng **và** winner `correctCount >= min`        |

**Lý do gate:**
- `invite` (phòng riêng) cho phép chọn đối thủ -> 2 người thông đồng farm vô hạn **không** XP battle. Nhưng vẫn là học thật vẫn tính streak.
- Ngưỡng `minCorrectForReward` (mặc định 3/10) chặn "vào queue trả lời bừa lấy 15 XP".
- Không phạt (không trừ XP): dưới ngưỡng/thua = 0 XP battle.

**Idempotency:** Unique index `(userId, source, refId)` trong collection `xp_events` — `refId = matchId`. Gọi `recordActivity` nhiều lần với cùng matchId không bị cộng XP trùng.

Reward được wrap trong `try/catch` riêng — lỗi gamification không bao giờ crash kết quả trận.

---

## 7. Cấu hình (`gamification.config.js`)

| Constant                  | Giá trị | Ý nghĩa                             |
| :------------------------ | :------ | :---------------------------------- |
| `BATTLE.rounds`           | 10      | Số câu hỏi mỗi trận                 |
| `BATTLE.startCountdownMs` | 3000    | Đếm ngược pre-game trước câu 0 (ms) |
| `BATTLE.perQuestionMs`    | 12000   | Thời gian mỗi câu (ms)              |
| `BATTLE.roundRevealMs`    | 3000    | Pause hiện đáp án giữa các round (ms) |
| `BATTLE.speedBonusMax`    | 50      | Speed bonus tối đa mỗi câu          |
| `BATTLE.queueTimeoutMs`   | 30000   | Thời gian chờ ghép trận tối đa (ms) |
| `BATTLE.reconnectGraceMs` | 15000   | Thời gian reconnect (ms)            |
| `BATTLE.minCorrectForReward` | 3    | Số câu đúng tối thiểu để nhận XP battle (chống farm) |

---

## 8. Tham chiếu

| File                                           | Vai trò                                |
| :--------------------------------------------- | :------------------------------------- |
| `backend/src/socket/battle/engine.js`          | Game loop chính                        |
| `backend/src/socket/battle/matchmaking.js`     | Queue + invite                         |
| `backend/src/modules/battle/battle.service.js` | Sinh câu hỏi, REST queries             |
| `backend/src/models/battleMatch.model.js`      | MongoDB schema                         |
| `backend/src/config/gamification.config.js`    | Constants BATTLE, XP                   |
| `doc/api.md`                                   | API reference (mục Battle)             |
| `doc/models.md`                                | Schema reference (bảng battle_matches) |
