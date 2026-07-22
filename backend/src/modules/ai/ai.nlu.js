import { NlpManager } from 'node-nlp';

const manager = new NlpManager({
  languages: ['vi'],
  forceNER: true,
  nlu: { log: false },
});

const CONFIDENCE_THRESHOLD = 0.77; // giữa 0.754 (sàn mặc định) và 0.787 (điểm thật thấp nhất

export const trainNlpModel = async () => {
  // Khai báo entity %word% - bắt buộc phải có khi dùng forceNER + placeholder
  manager.addRegexEntity('word', 'vi', /[a-zA-ZÀ-ỹ0-9]+/);

  // Intent: intent.meaning
  manager.addDocument('vi', 'có nghĩa là gì', 'intent.meaning');
  manager.addDocument('vi', 'nghĩa của %word% là gì', 'intent.meaning');
  manager.addDocument('vi', '%word% tiếng việt là gì', 'intent.meaning');
  manager.addDocument('vi', 'dịch từ %word% sang tiếng việt', 'intent.meaning');
  manager.addDocument('vi', 'dịch %word%', 'intent.meaning');
  manager.addDocument('vi', 'ý nghĩa của chữ %word%', 'intent.meaning');
  manager.addDocument('vi', 'cho mình hỏi nghĩa của %word%', 'intent.meaning');
  manager.addDocument('vi', '%word% là gì vậy', 'intent.meaning');
  manager.addDocument('vi', 'từ %word% nghĩa là sao', 'intent.meaning');
  manager.addDocument('vi', 'giải thích giúp mình từ %word%', 'intent.meaning');
  manager.addDocument(
    'vi',
    'bạn ơi %word% dịch ra tiếng việt là gì',
    'intent.meaning'
  );
  manager.addDocument('vi', '%word% dịch sao vậy bạn', 'intent.meaning');
  manager.addDocument('vi', 'từ này nghĩa là gì', 'intent.meaning');
  manager.addDocument('vi', 'y nghia cua %word% la gi', 'intent.meaning');
  manager.addDocument('vi', 'cho tớ hỏi %word% là gì', 'intent.meaning');
  manager.addDocument('vi', 'chữ %word% dịch ra là gì nhỉ', 'intent.meaning');
  manager.addDocument(
    'vi',
    'mình không hiểu %word% nghĩa là gì',
    'intent.meaning'
  );
  manager.addDocument('vi', 'giải nghĩa từ %word% giúp mình', 'intent.meaning');

  // Intent: intent.example
  manager.addDocument('vi', 'cho ví dụ', 'intent.example');
  manager.addDocument('vi', 'ví dụ về %word%', 'intent.example');
  manager.addDocument('vi', 'đặt câu với %word%', 'intent.example');
  manager.addDocument('vi', 'cho một câu mẫu có từ %word%', 'intent.example');
  manager.addDocument('vi', 'ví dụ của từ %word%', 'intent.example');
  manager.addDocument('vi', 'cách dùng từ %word% trong câu', 'intent.example');
  manager.addDocument('vi', 'ví dụ', 'intent.example');
  manager.addDocument(
    'vi',
    'cho mình một câu ví dụ với %word%',
    'intent.example'
  );
  manager.addDocument(
    'vi',
    'câu nào có dùng từ %word% không',
    'intent.example'
  );
  manager.addDocument(
    'vi',
    'bạn đặt câu giúp mình với %word%',
    'intent.example'
  );
  manager.addDocument(
    'vi',
    'có câu nào minh họa cho %word% không',
    'intent.example'
  );
  manager.addDocument(
    'vi',
    'cho ví dụ cụ thể về cách dùng %word%',
    'intent.example'
  );
  manager.addDocument('vi', 'mình cần ví dụ dùng từ %word%', 'intent.example');
  manager.addDocument('vi', 'vi du ve %word%', 'intent.example');
  manager.addDocument(
    'vi',
    'áp dụng %word% vào câu như thế nào',
    'intent.example'
  );
  manager.addDocument('vi', 'cho ví dụ đi', 'intent.example');
  manager.addDocument(
    'vi',
    'từ %word% dùng trong câu ra sao',
    'intent.example'
  );
  manager.addDocument(
    'vi',
    'lấy giúp mình vài câu có chữ %word%',
    'intent.example'
  );
  manager.addDocument('vi', 'câu mẫu cho từ %word% với', 'intent.example');
  manager.addDocument(
    'vi',
    'ai cho mình xin ví dụ về %word%',
    'intent.example'
  );
  manager.addDocument('vi', 'minh họa giúp từ %word%', 'intent.example');
  manager.addDocument('vi', 'cho câu ví dụ đi', 'intent.example');

  // Intent: intent.pronunciation
  manager.addDocument('vi', 'phát âm', 'intent.pronunciation');
  manager.addDocument('vi', 'đọc là', 'intent.pronunciation');
  manager.addDocument('vi', 'đọc sao', 'intent.pronunciation');
  manager.addDocument('vi', 'đọc thế nào', 'intent.pronunciation');
  manager.addDocument('vi', 'cách đọc %word%', 'intent.pronunciation');
  manager.addDocument(
    'vi',
    'phát âm chữ %word% thế nào',
    'intent.pronunciation'
  );
  manager.addDocument('vi', '%word% đọc sao', 'intent.pronunciation');
  manager.addDocument(
    'vi',
    'từ %word% đọc như thế nào',
    'intent.pronunciation'
  );
  manager.addDocument(
    'vi',
    'chỉ mình cách phát âm %word%',
    'intent.pronunciation'
  );
  manager.addDocument('vi', '%word% phát âm ra sao', 'intent.pronunciation');
  manager.addDocument(
    'vi',
    'cách phát âm chuẩn của %word%',
    'intent.pronunciation'
  );
  manager.addDocument('vi', 'phat am tu %word%', 'intent.pronunciation');
  manager.addDocument(
    'vi',
    'mình đọc từ %word% có đúng không',
    'intent.pronunciation'
  );
  manager.addDocument(
    'vi',
    'hướng dẫn phát âm %word% giúp mình',
    'intent.pronunciation'
  );
  manager.addDocument('vi', '%word% nghe đọc như nào', 'intent.pronunciation');
  manager.addDocument('vi', 'từ này đọc ra sao vậy', 'intent.pronunciation');

  // Intent: intent.related
  manager.addDocument('vi', 'từ liên quan', 'intent.related');
  manager.addDocument('vi', 'cùng chủ đề', 'intent.related');
  manager.addDocument(
    'vi',
    'những từ khác liên quan đến %word%',
    'intent.related'
  );
  manager.addDocument('vi', 'từ vựng cùng chủ đề với %word%', 'intent.related');
  manager.addDocument('vi', 'từ khác', 'intent.related');
  manager.addDocument('vi', 'còn từ nào giống %word% không', 'intent.related');
  manager.addDocument(
    'vi',
    'gợi ý thêm từ liên quan tới %word%',
    'intent.related'
  );
  manager.addDocument('vi', 'từ nào cùng nhóm với %word%', 'intent.related');
  manager.addDocument(
    'vi',
    'cho mình thêm từ vựng giống %word%',
    'intent.related'
  );
  manager.addDocument(
    'vi',
    'có từ nào đồng nghĩa với %word% không',
    'intent.related'
  );
  manager.addDocument('vi', 'tu lien quan den %word%', 'intent.related');
  manager.addDocument(
    'vi',
    'ngoài %word% ra còn từ nào tương tự',
    'intent.related'
  );
  manager.addDocument('vi', 'từ vựng chủ đề này còn gì nữa', 'intent.related');
  manager.addDocument('vi', 'cho thêm vài từ cùng chủ đề', 'intent.related');
  manager.addDocument('vi', 'từ đồng nghĩa với %word% là gì', 'intent.related');
  manager.addDocument(
    'vi',
    'muốn học thêm từ liên quan đến %word%',
    'intent.related'
  );

  // Intent: intent.lesson
  manager.addDocument('vi', 'bài học', 'intent.lesson');
  manager.addDocument('vi', 'học ở đâu', 'intent.lesson');
  manager.addDocument('vi', 'bài nào có từ %word%', 'intent.lesson');
  manager.addDocument('vi', 'từ %word% nằm trong bài học nào', 'intent.lesson');
  manager.addDocument('vi', 'bài học nào dạy từ %word%', 'intent.lesson');
  manager.addDocument('vi', 'mình học từ %word% ở bài nào', 'intent.lesson');
  manager.addDocument('vi', '%word% thuộc bài học số mấy', 'intent.lesson');
  manager.addDocument('vi', 'bai hoc nao co tu %word%', 'intent.lesson');
  manager.addDocument(
    'vi',
    'cho mình biết bài học liên quan đến %word%',
    'intent.lesson'
  );
  manager.addDocument('vi', 'từ này xuất hiện ở bài nào vậy', 'intent.lesson');
  manager.addDocument('vi', 'muốn ôn lại bài có từ %word%', 'intent.lesson');
  manager.addDocument('vi', 'bài học chứa %word% là bài nào', 'intent.lesson');
  manager.addDocument('vi', 'muốn ôn lại phần học có %word%', 'intent.lesson');
  manager.addDocument('vi', 'bài nào nói về từ %word%', 'intent.lesson');
  manager.addDocument('vi', 'từ vựng này thuộc unit mấy', 'intent.lesson');
  manager.addDocument(
    'vi',
    'cho mình biết chương nào dạy về %word%',
    'intent.lesson'
  );
  manager.addDocument('vi', 'lesson nào', 'intent.lesson');
  manager.addDocument('vi', 'xuất hiện trong những lesson nào', 'intent.lesson');
  manager.addDocument('vi', 'xuất hiện ở lesson nào', 'intent.lesson');
  manager.addDocument('vi', 'có trong lesson nào', 'intent.lesson');

  // Intent: None (ngoài phạm vi / fallback)
  manager.addDocument('vi', 'xin chào', 'None');
  manager.addDocument('vi', 'chào bạn', 'None');
  manager.addDocument('vi', 'bạn khỏe không', 'None');
  manager.addDocument('vi', 'cảm ơn nhé', 'None');
  manager.addDocument('vi', 'tạm biệt', 'None');
  manager.addDocument('vi', 'hôm nay thời tiết thế nào', 'None');
  manager.addDocument('vi', 'bạn tên gì', 'None');
  manager.addDocument('vi', 'bạn là ai', 'None');
  manager.addDocument('vi', 'giúp mình việc khác được không', 'None');
  manager.addDocument('vi', 'kể chuyện cười đi', 'None');
  manager.addDocument('vi', 'nay là thứ mấy', 'None');
  manager.addDocument('vi', 'mấy giờ rồi', 'None');
  manager.addDocument('vi', 'app này của ai làm', 'None');
  manager.addDocument('vi', 'bạn khỏe không đó', 'None');
  manager.addDocument('vi', 'ê', 'None');
  manager.addDocument('vi', 'ê ơi', 'None');
  manager.addDocument('vi', 'alo', 'None');
  manager.addDocument('vi', 'test thử xem', 'None');
  manager.addDocument('vi', 'cho mình hỏi chút xíu', 'None');
  manager.addDocument('vi', 'bạn ăn cơm chưa', 'None');

  console.log('Training NLP Model for Intent Classification...');
  await manager.train();
  manager.save();
  console.log('NLP Model trained and ready!');
};

export const predictIntent = async (text) => {
  const response = await manager.process('vi', text);

  if (response.score < CONFIDENCE_THRESHOLD) {
    return { intent: 'None', score: response.score, uncertain: true };
  }

  //return response.intent;
  return { intent: response.intent, score: response.score, uncertain: false };
};
