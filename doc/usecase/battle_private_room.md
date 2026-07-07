<div class="joplin-table-wrapper"><table><tbody>
<tr><th><p><strong>Mô tả</strong></p></th><th><p>Cho phép người dùng tạo một phòng thi đấu từ vựng riêng tư với mã phòng để mời đối thủ tham gia.</p></th></tr>
<tr><td><p><strong>Tác nhân kích hoạt</strong></p></td><td><p>Người dùng</p></td></tr>
<tr><td><p><strong>Tiền điều kiện</strong></p></td><td><ul>
<li>Người dùng đã đăng nhập vào hệ thống và có kết nối WebSocket hợp lệ.</li>
</ul></td></tr>
<tr><td><p><strong>Các bước thực hiện</strong></p></td><td><ol>
<li>Người dùng truy cập trang "Đấu trường 1v1". Hệ thống hiển thị khu vực "Chọn chế độ thi đấu" với hai lựa chọn: "Trắc nghiệm MCQ" (chọn nghĩa tiếng Việt chính xác của từ tiếng Anh) và "Gõ từ vựng" (gõ từ tiếng Anh tương ứng với nghĩa tiếng Việt). Người dùng nhấp vào chế độ mong muốn để chọn.</li>
<li>Người dùng nhấn nút "Tạo phòng riêng".</li>
<li>Hệ thống tạo phòng và hiển thị hộp thoại "Đã tạo phòng riêng" với thông báo "Hãy gửi mã này cho bạn bè để cùng chơi:" kèm theo mã phòng gồm 6 ký tự. Người dùng nhấp vào mã để sao chép — hệ thống hiển thị xác nhận "Đã sao chép!".</li>
<li>Hệ thống hiển thị vòng xoay chờ và dòng chữ "Đang chờ đối thủ tham gia...". Người dùng gửi mã phòng cho đối thủ.</li>
<li>Người dùng có thể nhấn "Rời phòng" để hủy bất kỳ lúc nào trước khi đối thủ tham gia. Hệ thống đóng hộp thoại, hủy phòng và vô hiệu hóa mã phòng. Nếu đối thủ thử dùng mã phòng cũ sau khi chủ phòng đã rời, hệ thống từ chối và hiển thị thông báo mã phòng không hợp lệ.</li>
<li>Khi đối thủ nhập đúng mã phòng 6 ký tự vào ô "Nhập mã phòng gồm 6 ký tự" ở trang "Đấu trường 1v1" và nhấn "Vào phòng", hộp thoại tự động đóng lại. Cả hai người dùng được chuyển sang màn hình "Chuẩn bị thi đấu..." và trận đấu bắt đầu.</li>
</td></tr>
</tbody></table></div>
