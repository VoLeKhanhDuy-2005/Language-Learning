users

| Field              | Ý nghĩa                                |
| :-------------     | :------------------------------------- |
| `_id`              | ID duy nhất của user trong MongoDB.    |
| `email`            | Email đăng nhập, nên unique.           |
| `passwordHash`     | Mật khẩu đã băm, không lưu plain text. |
| `name`             | Tên hiển thị của user.                 |
| `avatarUrl`        | Ảnh đại diện.                          |
| `role`             | Vai trò như `user`, `admin`            |
| `createdAt`        | Ngày tạo tài khoản.                    |
| `updatedAt`        | Ngày cập nhật gần nhất.                |
| `isVerified`       | Check verify email                     |
| `isActive`         | Ban/unban                              |
| `banReason`        | Lý do khóa tài khoản                   |
| `passwordChangedAt`| Thời điểm đổi mật khẩu gần nhất        |

cefr_levels

| Field   | Ý nghĩa                         |
| :------ | :------------------------------ |
| `_id`   | ID level.                       |
| `code`  | Mã ngắn, ví dụ `a1,a2` …        |
| `label` | Tên hiển thị, ví dụ `A1`, `A2`. |

tags

| Field   | Ý nghĩa                               |
| :------ | :------------------------------------ |
| `_id`   | ID tag.                               |
| `code`  | Mã ngắn, ví dụ `movie`, `daily,` …    |
| `label` | Tên hiển thị, ví dụ `Movie`, `Daily`. |

lessons

| Field          | Ý nghĩa                                            |
| :------------- | :------------------------------------------------- |
| `_id`          | ID lesson.                                         |
| `title`        | Tên bài học.                                       |
| `slug`         | Chuỗi URL thân thiện.                              |
| `description`  | Mô tả ngắn.                                        |
| `tagIds`       | Các tags                                           |
| `cefrLevelIds` | Các mức cerf_levels                                |
| `modes`        | Những mode hỗ trợ, ví dụ `dictation`, `shadowing`. |
| `status`       | Trạng thái như `draft`, `published`, `archived`.   |
| `publishedAt`  | Ngày công khai bài học.                            |
| `durationMs`   | Tổng thời lượng video (ms), mặc định 0.            |
| `createdAt`    | Ngày tạo.                                          |
| `updatedAt`    | Ngày cập nhật.                                     |
| `sourceUrl`    | URL gốc để phát media.                             |
| `thumbnailUrl` | Ảnh thumbnail.                                     |

lesson_segments

| Field                   | Ý nghĩa                                             |
| :---------------------- | :-------------------------------------------------- |
| `_id`                   | ID segment.                                         |
| `lessonId`              | Segment thuộc lesson nào.                           |
| `startMs`               | Thời điểm bắt đầu trong video, tính bằng mili giây. Dùng để sắp xếp thứ tự segment. |
| `endMs`                 | Thời điểm kết thúc trong video.                     |
| `transcript.original`   | Câu gốc đầy đủ.                                     |
| `transcript.normalized` | Chuẩn hóa để so sánh                                |
| `translation`           | Bản dịch                                            |
| `createdAt`             | Ngày tạo.                                           |
| `updatedAt`             | Ngày cập nhật.                                      |

decks

| Field          | Ý nghĩa                                          |
| :------------- | :----------------------------------------------- |
| `_id`          | ID bộ thẻ.                                       |
| `title`        | Tên bộ thẻ.                                      |
| `slug`         | URL thân thiện.                                  |
| `description`  | Mô tả ngắn về deck.                              |
| `coverImage`   | Ảnh bìa.                                         |
| `tagIds`       | Các tag như `common`, `basic`, `oxford`.         |
| `cefrLevelIds` | Các mức cerf_levels                              |
| `status`       | Trạng thái như `draft`, `published`, `archived`. |
| `ownerType`    | `system`, `user`                                 |
| `ownerId`      | UserId của chủ bộ từ                             |
| `topicCount`   | Số topic con trong deck.                         |
| `cardCount`    | Tổng số thẻ.                                     |
| `publishedAt`  | Ngày công khai.                                  |

topics (“Bảng này là các nhóm nhỏ bên trong một deck. Ví dụ trong deck “1000 từ tiếng Anh thông dụng”, các nhóm con là Gia đình, Trường học, Công việc, Sức khỏe”)

| Field       | Ý nghĩa                      |
| :---------- | :--------------------------- |
| `_id`       | ID nhóm thẻ.                 |
| `deckId`    | Thuộc deck nào.              |
| `name`      | Tên nhóm, ví dụ `Gia đình`.  |
| `slug`      | URL thân thiện.              |
| `order`     | Thứ tự hiển thị bên sidebar. |
| `cardCount` | Số card trong nhóm.          |

cards (“Đây là dữ liệu gốc của từng flashcard/từ vựng”)

| Field                             | Ý nghĩa                                        |
| :-------------------------------- | :--------------------------------------------- |
| `_id`                             | ID card.                                       |
| `deckId`                          | Card thuộc deck nào.                           |
| `topicId`                         | Card thuộc nhóm nào trong deck (deck_topics ). |
| `order`                           | Thứ tự card trong nhóm.                        |
| `term`                            | Từ hoặc cụm từ chính cần học.                  |
| `pos`                             | Từ loại như noun, verb, adjective.             |
| `phonetics`                       | [{text, audio, locale}, ...]                   |
| `translation`                     | Nghĩa của từ dịch sang tiếng việt.             |
| `explanation.vi / explanation.en` | Giải thích                                     |
| `examples.vi / examples.en`       | Ví dụ câu dùng từ.                             |
| `imageUrl`                        | Ảnh minh họa từ                                |
| `createdAt`                       | Ngày tạo.                                      |
| `updatedAt`                       | Ngày cập nhật.                                 |

user_lesson_progress

| Field         | Ý nghĩa                                                                 |
| :------------ | :---------------------------------------------------------------------- |
| `_id`         | ID bản ghi tiến độ.                                                     |
| `userId`      | User nào.                                                               |
| `lessonId`    | Lesson nào.                                                             |
| `dictation`   | Trạng thái Dictation (`status`, `progressPct`, `lastStartMs`).     |
| `shadowing`   | Trạng thái Shadowing (`status`, `progressPct`, `lastStartMs`).     |
| `updatedAt`   | Cập nhật gần nhất.                                                      |

user_segment_progress (“Bảng này lưu tiến độ của user ở mức từng segment. Vì Dictation và Shadowing diễn ra theo từng câu”)

| Field       | Ý nghĩa                                                                                                                                                                |
| :---------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_id`       | ID bản ghi.                                                                                                                                                            |
| `userId`    | User nào.                                                                                                                                                              |
| `lessonId`  | Thuộc lesson nào.                                                                                                                                                      |
| `segmentId` | Thuộc segment nào.                                                                                                                                                     |
| `dictation` | Trạng thái Dictation cho segment này. attemptCount: số lần thử. bestScore: điểm tốt nhất. completed: đã vượt qua hay chưa. hintUsedCount: đã dùng gợi ý bao nhiêu lần. |
| `shadowing` | Trạng thái Shadowing cho segment này. attemptCount bestScore latestAudioUrl completed                                                                           |
| `updatedAt` | Lần cập nhật gần nhất.                                                                                                                                                 |

user_gamification

| Field              | Ý nghĩa                                                                                       |
| :----------------- | :-------------------------------------------------------------------------------------------- |
| `_id`              | ID bản ghi.                                                                                   |
| `userId`           | Tham chiếu user (unique — 1 user 1 bản ghi).                                                 |
| `totalXp`          | Tổng XP tích lũy all-time. Index desc cho leaderboard.                                       |
| `level`            | Cấp độ hiện tại, tính từ `totalXp` theo công thức `requiredXpForLevel(L) = 50*L*(L+1)`.     |
| `currentStreak`    | Số ngày học liên tiếp hiện tại.                                                               |
| `longestStreak`    | Kỷ lục streak cao nhất từ trước đến nay.                                                     |
| `lastActiveDayKey` | Ngày cuối cùng có hành động học (`YYYY-MM-DD` theo múi giờ `Asia/Ho_Chi_Minh`). `null` nếu chưa học. |
| `lastXpAt`         | Thời điểm nhận XP gần nhất.                                                                  |
| `createdAt`        | Ngày tạo bản ghi.                                                                             |
| `updatedAt`        | Ngày cập nhật gần nhất.                                                                       |

xp_events

| Field       | Ý nghĩa                                                                                                                                                                       |
| :---------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_id`       | ID sự kiện.                                                                                                                                                                   |
| `userId`    | User được cộng XP.                                                                                                                                                            |
| `source`    | Loại hành động: `segment_complete`, `card_review`, `battle_play`, `battle_win`, `daily_streak`.                                                                               |
| `refId`     | Khóa idempotency — `segmentId` / `matchId` / `dayKey` / `${cardId}:${dayKey}`. Unique index `(userId, source, refId)` đảm bảo không cộng XP trùng cho cùng 1 hành động.     |
| `amount`    | Số XP đã cộng.                                                                                                                                                                |
| `createdAt` | Thời điểm ghi nhận.                                                                                                                                                           |

battle_matches

| Field          | Ý nghĩa                                                                                         |
| :------------- | :---------------------------------------------------------------------------------------------- |
| `_id`          | ID trận đấu (dùng làm matchId trong socket).                                                    |
| `mode`         | Dạng câu hỏi: `mcq` (chọn đáp án) hoặc `typing` (gõ nghĩa).                                   |
| `matchType`    | Cách ghép trận: `queue` (random) hoặc `invite` (dùng room code). **Chỉ `queue` được trao XP**; `invite` là friendly-only (chống farm điểm). |
| `roomCode`     | Mã phòng 6 ký tự (chỉ có với invite). Sparse unique index.                                     |
| `status`       | `waiting` → `in_progress` → `finished` hoặc `abandoned`.                                       |
| `players`      | Mảng 2 phần tử `[{ userId, score, correctCount, connected }]`. `connected` = còn kết nối cuối trận. |
| `questions`    | Mảng câu hỏi `[{ cardId, term, correctAnswer, options }]`. `options` rỗng với typing mode.     |
| `winnerId`     | UserId người thắng. `null` = hòa hoặc trận `abandoned`.                                        |
| `startedAt`    | Thời điểm bắt đầu trận.                                                                         |
| `finishedAt`   | Thời điểm kết thúc.                                                                             |
| `createdAt`    | Thời điểm tạo document.                                                                         |
| `updatedAt`    | Cập nhật gần nhất.                                                                              |
user_card_states

| Field       | Ý nghĩa                                         |
| :---------- | :---------------------------------------------- |
| `_id`       | ID state.                                       |
| `userId`    | User nào.                                       |
| `cardId`    | Card nào.                                       |
| `deckId`    | Thuộc deck nào.                                 |
| `topicId`   | Thuộc nhóm nào.                                 |
| `srs`       | {easeFactor, interval, lastGrade, nextReviewAt} |
| `flags`     | Cờ đặc biệt như đánh dấu sao, tạm ẩn.           |
| `createdAt` | Ngày bắt đầu học card này.                      |
| `updatedAt` | Ngày cập nhật gần nhất.                         |
