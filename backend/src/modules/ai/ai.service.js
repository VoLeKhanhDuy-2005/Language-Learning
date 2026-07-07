import { GoogleGenerativeAI } from '@google/generative-ai';
import Card from '../../models/card.model.js';
import Lesson from '../../models/lesson.model.js';
import AppError from '../../utils/AppError.js';
import { AI } from '../../constants/codes/index.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' },
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateWithRetry = async (prompt, retries = 3) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      lastError = error;

      // chỉ retry lỗi tạm thời
      if (!error.message.includes('503') && !error.message.includes('429')) {
        throw new AppError(error.message, 500);
      }
      await sleep(1000 * (i + 1));
    }
  }
  throw new AppError(lastError.message, 500);
};

export const responseQuestionService = async (question, mode, language = 'vi') => {
  if (!question)
    throw new AppError(AI.QUESTION_REQUIRED, 400);
  if(language !== 'en' && language !== 'vi')
    throw new AppError(AI.INVALID_LANGUAGE, 400);
  if (mode === 'network') {
    const data = await responseQuestionNetworkService(question, language);
    if(data.isValidQuestion)
      return data;
    else
      throw new AppError(AI.INVALID_QUESTION, 400);
  } else {
    const keywordData = await extractKeywordsService(question);
    const keywords = keywordData.keywords || [];

    if (keywords.length === 0)
      throw new AppError(AI.INVALID_KEYWORD_IN_QUESTION, 400);

    const foundItems = await queryMinLishDataForAI(keywords);
    if (foundItems.length !== 0){
      const data = await responseQuestionMinLishService(question, foundItems, language);
      if(data.isValidQuestion)
        return data;
      else
        throw new AppError(AI.INVALID_QUESTION, 400);
    }
    else
      throw new AppError(AI.NO_DATA_MATCH, 400);
  }
};

export const extractKeywordsService = async (question) => {
  const prompt = `Trích xuất các từ khóa quan trọng nhất từ câu hỏi sau để dùng cho việc tìm kiếm bài học/từ vựng tiếng Anh trong Database: "${question}"
  Yêu cầu:
  - Ưu tiên giữ lại các từ / cụm từ tiếng Anh hoặc nghĩa tiếng Việt của từ/cụm từ.
  - Lược bỏ các từ để hỏi thông thường (ví dụ: "làm sao", "như thế nào", "cách để", "giúp tôi", "là gì").
  - Trả về kết quả bắt buộc dưới định dạng JSON bao gồm trường:
  + "keywords": một mảng các chuỗi (array of strings) chứa các từ khóa. (Nếu không có từ khóa nào hợp lý, trả về mảng rỗng []).`;

  const result = await generateWithRetry(prompt);
  return JSON.parse(result.response.text());
};

export const queryMinLishDataForAI = async (keywords) => {
  keywords = [...new Set(keywords)];
  let contextData = [];
  for (const keyword of keywords) {
    const searchRegex = new RegExp(keyword, 'i');

    const mainCard = await Card.findOne({
      $or: [
        { term: searchRegex },
        { translation: searchRegex },
        // Tìm theo cả từ tiếng anh hoặc nghĩa tiếng việt
      ],
    })
      .populate('deckId')
      .populate('topicId')
      .lean(); // Để trả về plain JS Object, nhẹ hơn và dễ stringify cho AI

    if (!mainCard) continue;
    // Lấy ra từ vựng gốc xác định được để đi tìm Lesson
    const termToSearch = mainCard.term;

    // Lấy 10 ngẫu nhiên cards liên quan cùng topic
    const relatedTopicCards = await Card.aggregate([
      {
        $match: {
          topicId: mainCard.topicId._id,
          _id: { $ne: mainCard._id },
        },
      },
      {
        $sample: { size: 10 },
      },
    ]);

    // Lấy 10 ngẫu nhiên cards liên quan cùng deck
    const relatedDeckCards = await Card.aggregate([
      {
        $match: {
          deckId: mainCard.deckId._id,
          _id: { $ne: mainCard._id },
        },
      },
      {
        $sample: { size: 10 },
      },
    ]);

    // Lấy 10 lesson chứa term ngẫu nhiên
    const relatedLessons = await Lesson.aggregate([
      {
        $match: {
          $or: [
            { title: { $regex: termToSearch, $options: 'i' } },
            { description: { $regex: termToSearch, $options: 'i' } },
          ],
        },
      },
      { $sample: { size: 10 } },
    ]);

    contextData.push(`
    [TỪ VỰNG CHÍNH]
    Từ vựng: ${mainCard.term} (${mainCard.pos})
    Phát âm: ${JSON.stringify(mainCard.phonetics)}
    Nghĩa tiếng Việt: ${mainCard.translation}
    Giải thích: ${JSON.stringify(mainCard.explanation)}
    Ví dụ: ${JSON.stringify(mainCard.examples)}
    Thuộc Topic: ${mainCard.topicId.name || 'Không rõ'}
    Thuộc Deck: ${mainCard.deckId.name || 'Không rõ'}

    [10 TỪ VỰNG LIÊN QUAN CÙNG TOPIC]
    ${relatedTopicCards.map((c) => `- ${c.term} (${c.pos}): ${c.translation}`).join('\n')}

    [10 TỪ VỰNG LIÊN QUAN CÙNG DECK]
    ${relatedDeckCards.map((c) => `- ${c.term} (${c.pos}): ${c.translation}`).join('\n')}

    [CÁC BÀI HỌC CÓ CHỨA TỪ NÀY]
    ${relatedLessons.map((l) => `- Bài học: "${l.title}" | Mô tả: "${l.description}"`).join('\n')}
  `);
  }
  return contextData;
};

export const responseQuestionNetworkService = async (question, language = 'vi') => {
  // AI trả lời tự do
  try {
    const prompt = `
    Bạn là hệ thống kiểm tra câu hỏi cho ứng dụng học tiếng Anh.
    Kiểm tra câu hỏi: "${question}"
    Quy tắc:
    - isValidQuestion = true nếu câu hỏi liên quan đến học tiếng Anh:
      + từ vựng
      + ngữ pháp
      + phát âm
      + dịch thuật
      + giải thích tiếng Anh
    - isValidQuestion = false nếu câu hỏi không liên quan đến học tiếng Anh.
      Ví dụ:
      "What should we eat tonight?"
      "What movie should I watch?"
      "How is the weather today?"
    Nếu isValidQuestion = true:
    trả lời câu hỏi bằng tiếng ${language === 'en' ? 'Anh' : 'Việt'}
    Chỉ trả về JSON:
    {
      "isValidQuestion": boolean,
      "answer": string
    }
    `;
    const result = await generateWithRetry(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    if (error.message.includes('503')) throw new AppError(AI.BUSY_TRY_AGAIN, 503);
    throw new AppError(error.message, 500);
  }
};

export const responseQuestionMinLishService = async (question, contextData, language = 'vi') => {
  try {
    const prompt = `
    Dựa vào dữ liệu từ hệ thống MinLish sau đây:
    ---
    ${contextData}
    ---

    Bạn là trợ lý cho ứng dụng học tiếng Anh MinLish.
    Trước tiên hãy kiểm tra câu hỏi "${question}".
    Quy tắc:
    - isValidQuestion = true nếu câu hỏi liên quan đến:
      + học từ vựng tiếng Anh
      + ngữ pháp tiếng Anh
      + phát âm
      + dịch thuật
      + giải thích nghĩa/cách dùng tiếng Anh
      + nội dung học tập từ dữ liệu MinLish
    - isValidQuestion = false nếu:
      + câu hỏi không liên quan đến học tiếng Anh
      + dữ liệu MinLish không liên quan đến câu hỏi
    Nếu isValidQuestion = true:
    - Trả lời câu hỏi bằng tiếng ${language === 'en' ? 'Anh' : 'Việt'}
    - Chỉ sử dụng dữ liệu MinLish nếu có liên quan
    Chỉ trả về JSON hợp lệ:
    {
      "isValidQuestion": true hoặc false,
      "answer": "câu trả lời"
    }
    `;
    const result = await generateWithRetry(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    if (error.message.includes('503')) throw new AppError(AI.BUSY_TRY_AGAIN, 503);
    throw new AppError(error.message, 500);
  }
};

export const generateCardDetailsFromAI = async (inputStr) => {
  try {
    const prompt = `Bạn là một chuyên gia ngôn ngữ học. Dựa vào từ vựng hoặc nghĩa sau: "${inputStr}".
  Hãy cung cấp các thông tin của thẻ từ vựng dưới định dạng JSON bao gồm:
  - term: từ vựng tiếng Anh (bắt buộc)
  - translation: nghĩa tiếng Việt (bắt buộc)
  - pos: từ loại (chọn duy nhất một trong các pos sau theo đúng phát âm: adjective, adverb, auxiliary verb, collocation,
       conjunction, determiner, idiom, interjection, modal verb, noun, phrasal verb, phrase, preposition, pronoun, verb)
  - phonetics: mảng chứa object có dạng { text: "phát âm IPA", locale: "en-UK" hoặc "en-US" hoặc cả 2}
  - explanation: object chứa { vi: "giải thích tiếng Việt", en: "giải thích tiếng Anh" }
  - examples: object chứa { vi: "ví dụ tiếng Việt", en: "ví dụ tiếng Anh" }
  Đảm bảo kết quả trả về là JSON hợp lệ, đầy đủ ngoặc và đúng format.`;

    const result = await generateWithRetry(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    if (error.message.includes('503')) throw new AppError(AI.BUSY_TRY_AGAIN, 503);
    throw new AppError(error.message, 500);
  }
};
