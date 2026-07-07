import slugify from 'slugify';

export const generateSlug = (text) => {
  // vd: /cefr-level/beginner-level
  // dùng cho URL / SEO / routing
  return slugify(text, {
    lower: true,
    strict: true, // Loại bỏ toàn bộ ký tự đặc biệt, chỉ giữ chữ, số và dấu gạch ngang
  });
};

//console.log("TEST SLUG:", generateSlug(" Advanced Communication"));
