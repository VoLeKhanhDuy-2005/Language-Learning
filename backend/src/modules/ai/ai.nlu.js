import { NlpManager } from 'node-nlp';

const manager = new NlpManager({
  languages: ['vi'],
  forceNER: true,
  nlu: { log: false },
});

export const trainNlpModel = async () => {
  // Intent: intent.meaning
  manager.addDocument('vi', 'có nghĩa là gì', 'intent.meaning');
  manager.addDocument('vi', 'nghĩa của %word% là gì', 'intent.meaning');
  manager.addDocument('vi', '%word% tiếng việt là gì', 'intent.meaning');
  manager.addDocument('vi', 'dịch từ %word% sang tiếng việt', 'intent.meaning');
  manager.addDocument('vi', 'dịch %word%', 'intent.meaning');
  manager.addDocument('vi', 'ý nghĩa của chữ %word%', 'intent.meaning');
  manager.addDocument('vi', 'cho mình hỏi nghĩa của %word%', 'intent.meaning');

  // Intent: intent.example
  manager.addDocument('vi', 'cho ví dụ', 'intent.example');
  manager.addDocument('vi', 'ví dụ về %word%', 'intent.example');
  manager.addDocument('vi', 'đặt câu với %word%', 'intent.example');
  manager.addDocument('vi', 'cho một câu mẫu có từ %word%', 'intent.example');
  manager.addDocument('vi', 'ví dụ của từ %word%', 'intent.example');
  manager.addDocument('vi', 'cách dùng từ %word% trong câu', 'intent.example');
  manager.addDocument('vi', 'ví dụ', 'intent.example');

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

  // Intent: intent.lesson
  manager.addDocument('vi', 'bài học', 'intent.lesson');
  manager.addDocument('vi', 'học ở đâu', 'intent.lesson');
  manager.addDocument('vi', 'bài nào có từ %word%', 'intent.lesson');
  manager.addDocument('vi', 'từ %word% nằm trong bài học nào', 'intent.lesson');
  manager.addDocument('vi', 'bài học nào dạy từ %word%', 'intent.lesson');

  console.log('Training NLP Model for Intent Classification...');
  await manager.train();
  manager.save();
  console.log('NLP Model trained and ready!');
};

export const predictIntent = async (text) => {
  const response = await manager.process('vi', text);
  return response.intent;
};
