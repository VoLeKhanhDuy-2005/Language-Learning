import { trainNlpModel, predictIntent } from './ai.nlu.js';

const testCases = [
  // intent.meaning
  { text: 'từ apple nghĩa là chi vậy', expected: 'intent.meaning' },
  { text: 'happy dịch ra tiếng việt là sao', expected: 'intent.meaning' },
  { text: 'mình chưa hiểu nghĩa từ này lắm', expected: 'intent.meaning' },
  { text: 'beautiful có ý nghĩa gì', expected: 'intent.meaning' },
  { text: 'nghia cua tu banana la j', expected: 'intent.meaning' },
  { text: 'từ computer thì dịch thế nào', expected: 'intent.meaning' },
  {
    text: 'cho mình biết nghĩa tiếng việt của run',
    expected: 'intent.meaning',
  },

  // intent.example
  { text: 'lấy giúp mình vài câu có chữ happy', expected: 'intent.example' },
  { text: 'run được dùng trong câu như nào', expected: 'intent.example' },
  { text: 'câu mẫu cho từ beautiful với', expected: 'intent.example' },
  { text: 'ai cho mình xin ví dụ đi', expected: 'intent.example' },
  { text: 'áp dụng từ computer vào 1 câu xem', expected: 'intent.example' },
  { text: 'minh hoa giup tu apple', expected: 'intent.example' },

  // intent.pronunciation
  { text: 'schedule đọc kiểu gì vậy trời', expected: 'intent.pronunciation' },
  {
    text: 'chỉ mình phát âm chuẩn của though',
    expected: 'intent.pronunciation',
  },
  { text: 'từ colonel nói sao cho đúng', expected: 'intent.pronunciation' },
  { text: 'đọc từ này giùm mình với', expected: 'intent.pronunciation' },
  { text: 'cach phat am cua worcester', expected: 'intent.pronunciation' },
  { text: 'từ này phát âm nghe hơi khó', expected: 'intent.pronunciation' },

  // intent.related
  { text: 'còn từ nào na ná happy không nhỉ', expected: 'intent.related' },
  {
    text: 'gợi ý thêm vài từ vựng chủ đề động vật',
    expected: 'intent.related',
  },
  { text: 'từ đồng nghĩa với beautiful là gì', expected: 'intent.related' },
  { text: 'cùng nhóm với run có từ nào nữa', expected: 'intent.related' },
  { text: 'muốn học thêm từ liên quan đến food', expected: 'intent.related' },

  // intent.lesson
  { text: 'apple có trong bài học nào rồi nhỉ', expected: 'intent.lesson' },
  { text: 'muốn ôn lại phần học có run', expected: 'intent.lesson' },
  { text: 'bai nao noi ve tu happy', expected: 'intent.lesson' },
  { text: 'từ vựng này thuộc unit mấy', expected: 'intent.lesson' },
  {
    text: 'cho mình biết chương nào dạy về computer',
    expected: 'intent.lesson',
  },

  // None (ngoài phạm vi)
  { text: 'bạn có khỏe không đó', expected: 'None' },
  { text: 'nay là thứ mấy vậy', expected: 'None' },
  { text: 'kể cho mình nghe chuyện vui đi', expected: 'None' },
  { text: 'app này của ai làm vậy', expected: 'None' },
  { text: 'tạm biệt nha, hẹn gặp lại', expected: 'None' },

  // Câu mơ hồ / khó (edge case, không bắt buộc đúng nhưng đáng xem score)
  { text: 'ví dụ về cách phát âm từ này', expected: '???' }, // vừa example vừa pronunciation
  { text: 'từ này nghĩa là gì, đọc sao, cho ví dụ luôn', expected: '???' }, // đa intent
  { text: 'ê', expected: 'None' }, // câu quá ngắn, vô nghĩa
];

const runTests = async () => {
  await trainNlpModel();
  let correct = 0;
  const lowScoreCases = [];

  for (const { text, expected } of testCases) {
    const result = await predictIntent(text);
    const intent = result?.intent || 'None';
    const score = result?.score?.toFixed(3) || '0.000';
    const isCorrect = intent === expected;
    if (isCorrect) correct++;
    if (parseFloat(score) < 0.7) lowScoreCases.push({ text, intent, score });

    console.log(
      `${isCorrect ? '✅' : '❌'} "${text}" → dự đoán: ${intent} (score: ${score}) | mong đợi: ${expected}`
    );
  }

  console.log(`\n--- Kết quả: ${correct}/${testCases.length} đúng ---`);
  console.log(
    '\n⚠️ Các câu có score thấp (<0.7), cần bổ sung thêm dữ liệu train:'
  );
  lowScoreCases.forEach((c) =>
    console.log(`- "${c.text}" (${c.intent}, ${c.score})`)
  );
};

runTests();
