<div class="joplin-table-wrapper"><table><tbody>
<tr><th><p><strong>Mô tả</strong></p></th><th><p>Sau khi hai người chơi được ghép đôi (qua tạo phòng hoặc ghép ngẫu nhiên), hệ thống tổ chức trận đấu từ vựng theo vòng. Mỗi vòng hệ thống phát một câu hỏi có giới hạn thời gian, người chơi gửi đáp án, hệ thống tính điểm có thưởng tốc độ và công bố kết quả sau mỗi vòng. Sau khi trả lời hết tất cả các câu, hệ thống xác định người thắng dựa trên điểm số và trao thưởng XP.</p></th></tr>
<tr><td><p><strong>Tác nhân kích hoạt</strong></p></td><td><p>Người dùng</p></td></tr>
<tr><td><p><strong>Tiền điều kiện</strong></p></td><td><p>Trận đấu đã được khởi tạo (startMatch hoàn tất), cả hai người chơi đang ở màn hình thi đấu.</p></td></tr>
<tr><td><p><strong>Các bước thực hiện</strong></p></td><td><ol>
<li>Hệ thống hiển thị màn hình đếm ngược chuẩn bị với avatar, tên của cả hai người chơi được hiển thị theo dạng [Tên bạn] VS [Tên đối thủ] và dòng chữ "Chuẩn bị thi đấu...". Đếm ngược từ 3 về 1, mỗi số hiển thị trong 1 giây.</li>
<li>Khi đếm ngược kết thúc, hệ thống hiển thị màn hình thi đấu gồm:
<ul>
<li>Bảng điểm phía trên: avatar, tên, điểm tích lũy của từng người và tiến độ "Câu hỏi X / Y" ở giữa.</li>
<li>Khu vực câu hỏi ở giữa: hiển thị từ/nghĩa cần trả lời và thanh thời gian đếm ngược (chuyển màu cảnh báo khi còn ít thời gian).</li>
</ul></li>
<li>Người dùng xem câu hỏi và trả lời theo chế độ đang chơi:
<ul>
<li>Trắc nghiệm MCQ: nhấn vào 1 trong 4 đáp án để chọn. Sau khi chọn, các nút bị khóa.</li>
<li>Gõ từ vựng: gõ đáp án vào ô "Gõ câu trả lời...", có gợi ý về ký tự đầu, số ký tự và cấu trúc từ. Nhấn "Nộp bài" để xác nhận.</li>
</ul></li>
<li>Sau khi nộp bài, hệ thống hiển thị "Đang chờ đối thủ..." cho đến khi cả hai đã trả lời hoặc hết thời gian.</li>
<li>Khi vòng kết thúc, hệ thống hiển thị đáp án đúng ("Đáp án đúng: [từ]") và tô màu các lựa chọn: xanh là đúng, đỏ là sai. Điểm của cả hai người được cập nhật trực tiếp trên bảng điểm mà không cần tải lại trang.</li>
<li>Hệ thống tự động chuyển sang câu hỏi tiếp theo và lặp lại từ bước 2 cho đến hết tất cả câu hỏi.</li>
<li>Sau khi hết câu hỏi, hệ thống hiển thị màn hình kết quả với tiêu đề "CHIẾN THẮNG!" / "THẤT BẠI!" / "HÒA!" kèm mô tả tương ứng. Bên dưới hiển thị điểm số và số câu đúng thực tế của cả hai người.</li>
<li>Phần "Phần thưởng nhận được" hiển thị phần thưởng gamification:
<ul>
<li>Ghép nhanh (Tìm trận nhanh): người dùng trả lời đúng ít nhất 3 câu nhận +15 XP hoàn thành trận; người thắng thỏa điều kiện nhận thêm +35 XP chiến thắng. Nếu không đủ điều kiện, hiển thị gợi ý "Trả lời đúng ít nhất 3 câu hỏi để tích lũy thêm XP đấu trường."</li>
<li>Phòng riêng (Tạo phòng riêng): không nhận XP đấu trường, hiển thị "Trận đấu giao hữu không tích lũy XP đấu trường, nhưng vẫn duy trì streak."</li>
<li>Cả hai chế độ đều cập nhật "Chuỗi streak được duy trì".</li>
</ul></li>
<li>Người dùng nhấn "Thoát ra sảnh" để quay về trang "Đấu trường 1v1".</li>
</ol>
<p><strong>Xử lý mất kết nối trong thi đấu:</strong></p>
<ul>
<li>Nếu một người chơi mất kết nối WebSocket trong khi trận đang diễn ra, hệ thống hiển thị overlay "Đối thủ mất kết nối" với bộ đếm ngược 15 giây cho người chơi còn lại.</li>
<li>Nếu người chơi mất kết nối reconnect trước khi bộ đếm về 0, overlay đóng lại và trận đấu tiếp tục bình thường từ câu hỏi hiện tại.</li>
<li>Nếu người chơi mất kết nối không reconnect sau 15 giây, hệ thống kết thúc trận theo hình thức bỏ cuộc (forfeit): người còn lại thắng, màn hình kết quả hiển thị với số câu đúng thực tế của cả hai người.</li>
</ul></td></tr>
</tbody></table></div>
