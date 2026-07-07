import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: config.mailHost || 'smtp.ethereal.email',
  port: config.mailPort || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.mailUser,
    pass: config.mailPass,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"MinLish" <${config.mailUser}>`,
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendOtpEmail = async (email, otp) => {
  const subject = 'Mã OTP kích hoạt tài khoản MinLish';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #4CAF50; text-align: center;">Chào mừng bạn đến với MinLish!</h2>
      <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP bên dưới để kích hoạt tài khoản của mình:</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0;">
        ${otp}
      </div>
      <p>Mã OTP này có hiệu lực trong vòng 10 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
      <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2026 MinLish. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};
export const sendForgotPasswordEmail = async (email, otp) => {
  const subject = 'Mã OTP đặt lại mật khẩu MinLish';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #2196F3; text-align: center;">Đặt lại mật khẩu MinLish</h2>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP bên dưới để tiếp tục:</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0;">
        ${otp}
      </div>
      <p>Mã OTP này có hiệu lực trong vòng 10 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
      <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2026 MinLish. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};

export const sendChangePasswordEmail = async (email, name, newPassword) => {
  const subject = 'Thông báo thay đổi mật khẩu tài khoản MinLish';
  const changeTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #FF9800; text-align: center;">Thông báo thay đổi mật khẩu</h2>
      <p>Chào <strong>${name}</strong>,</p>
      <p>Mật khẩu tài khoản MinLish của bạn đã được thay đổi vào lúc <strong>${changeTime}</strong>.</p>
      <p>Mật khẩu mới của bạn là: <strong>${newPassword}</strong></p>
      <p><strong>Lưu ý:</strong> Việc thay đổi mật khẩu này được thực hiện bởi Quản trị viên (Admin) của hệ thống. Vui lòng đăng nhập và đổi lại mật khẩu để đảm bảo an toàn.</p>
      <p>Nếu bạn không yêu cầu thay đổi này hoặc không nhận biết về hành động này, vui lòng liên hệ ngay với đội ngũ hỗ trợ của chúng tôi bằng cách phản hồi lại email này để được giải quyết kịp thời.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} MinLish. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};

export const sendBanEmail = async (email, name, banReason) => {
  const subject = 'Thông báo khóa tài khoản MinLish';
  const lockTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #f44336; text-align: center;">Thông báo khóa tài khoản</h2>
      <p>Chào <strong>${name}</strong>,</p>
      <p>Tài khoản MinLish của bạn đã bị khóa vào lúc <strong>${lockTime}</strong>.</p>
      <p><strong>Lý do khóa:</strong> ${banReason || 'Vi phạm chính sách của chúng tôi.'}</p>
      <p>Nếu bạn cho rằng việc khóa tài khoản này là nhầm lẫn, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi qua email phản hồi lại email này để được xem xét và hỗ trợ.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} MinLish. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};
