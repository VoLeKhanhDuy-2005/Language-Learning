import { GoogleGenerativeAI } from '@google/generative-ai';
import Card from '../../models/card.model.js';
import Lesson from '../../models/lesson.model.js';
import AIConversation from '../../models/aiConversation.model.js';
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

// Conversation History Services
/**
 * Lấy danh sách hội thoại của một user (chỉ metadata, không kèm messages)
 */
export const getConversationsService = async (userId) => {
  const conversations = await AIConversation.find({ userId })
    .select('_id title lastMode createdAt updatedAt')
    .sort({ updatedAt: -1 })
    .lean();
  return conversations;
};

/**
 * Lấy chi tiết một hội thoại (kèm messages)
 */
export const getConversationByIdService = async (conversationId, userId) => {
  const conversation = await AIConversation.findOne({
    _id: conversationId,
    userId,
  }).lean();
  if (!conversation) throw new AppError(AI.CONVERSATION_NOT_FOUND, 404);
  return conversation;
};

/**
 * Tạo hội thoại mới
 */
export const createConversationService = async (userId) => {
  const conversation = await AIConversation.create({ userId });
  return conversation;
};

/**
 * Xoá một hội thoại
 */
export const deleteConversationService = async (conversationId, userId) => {
  const result = await AIConversation.findOneAndDelete({
    _id: conversationId,
    userId,
  });
  if (!result) throw new AppError(AI.CONVERSATION_NOT_FOUND, 404);
};

/**
 * Đổi tên hội thoại
 */
export const renameConversationService = async (
  conversationId,
  userId,
  title
) => {
  const conversation = await AIConversation.findOneAndUpdate(
    { _id: conversationId, userId },
    { title },
    { new: true }
  ).lean();
  if (!conversation) throw new AppError(AI.CONVERSATION_NOT_FOUND, 404);
  return conversation;
};

// Q&A Services
/**
 * Build context string từ conversation history (tối đa maxMessages tin nhắn gần nhất)
 */
const buildHistoryContext = (messages, maxMessages = 10) => {
  if (!messages || messages.length === 0) return '';
  const recent = messages.slice(-maxMessages);
  const lines = recent.map(
    (m) => `${m.role === 'user' ? 'Người dùng' : 'Trợ lý'}: ${m.content}`
  );
  return `\n\n[LỊCH SỬ HỘI THOẠI GẦN ĐÂY]\n${lines.join('\n')}\n`;
};

export const responseQuestionService = async (
  question,
  mode,
  language = 'vi',
  conversationId = null,
  userId = null
) => {
  if (!question) throw new AppError(AI.QUESTION_REQUIRED, 400);
  if (language !== 'en' && language !== 'vi')
    throw new AppError(AI.INVALID_LANGUAGE, 400);

  // Lấy lịch sử hội thoại nếu có
  let historyContext = '';
  let conversation = null;
  if (conversationId && userId) {
    conversation = await AIConversation.findOne({
      _id: conversationId,
      userId,
    }).lean();
    if (conversation) {
      historyContext = buildHistoryContext(conversation.messages);
    }
  }

  let data;
  if (mode === 'network') {
    data = await responseQuestionNetworkService(
      question,
      language,
      historyContext
    );
    if (!data.isValidQuestion) throw new AppError(AI.INVALID_QUESTION, 400);
  } else {
    const keywordData = await extractKeywordsService(question);
    const keywords = keywordData.keywords || [];

    if (keywords.length === 0)
      throw new AppError(AI.INVALID_KEYWORD_IN_QUESTION, 400);

    const foundItems = await queryMinLishDataForAI(keywords);
    if (foundItems.length !== 0) {
      data = await responseQuestionMinLishService(
        question,
        foundItems,
        language,
        historyContext
      );
      if (!data.isValidQuestion) throw new AppError(AI.INVALID_QUESTION, 400);
    } else throw new AppError(AI.NO_DATA_MATCH, 400);
  }

  // Lưu messages vào conversation nếu có conversationId
  if (conversationId && userId && conversation) {
    const userMessage = { role: 'user', content: question, mode };
    const assistantMessage = {
      role: 'assistant',
      content: data.answer,
      mode,
    };

    // Auto-title: dùng câu hỏi đầu tiên làm tiêu đề
    const isFirstMessage = conversation.messages.length === 0;
    const titleUpdate = isFirstMessage ? { title: question.slice(0, 80) } : {};

    await AIConversation.findByIdAndUpdate(conversationId, {
      $push: { messages: { $each: [userMessage, assistantMessage] } },
      lastMode: mode,
      ...titleUpdate,
    });
  }

  return data;
};

export const extractKeywordsService = async (question) => {
  let normalized = question.toLowerCase().trim();

  const stopWords = [
    'trong tiếng anh',
    'trong tiếng việt',
    'có nghĩa là gì',
    'có nghĩa là',
    'nghĩa là gì',
    'nghĩa là',
    'làm thế nào',
    'như thế nào',
    'cho tôi biết',
    'dịch sang tiếng anh',
    'dịch sang tiếng việt',
    'bằng tiếng anh',
    'bằng tiếng việt',
    'cách để',
    'giúp tôi',
    'chỉ tôi',
    'là gì',
    'dịch sang',
    'dịch từ',
    'dịch',
    'từ này',
    'câu này',
    'chữ này',
    'đoạn này',
    'phát âm',
    'đọc là',
    'đọc sao',
    'đọc thế nào',
    'cách đọc',
    'hãy',
    'cho ví dụ',
    'ví dụ về',
    'tại sao',
    'khi nào',
    'ở đâu',
    'ai',
    'cái gì',
    'từ',
    'này',
    'có',
    'nghĩa',
    'gì',
    'nhé',
    'với',
    'ạ',
    'vậy',
    'sử dụng',
    'dùng',
    'thế nào',
    'làm sao',
    'của',
    'cho',
    'về',
    'cái',
    'thế',
    'nào',
    'hỏi',
    'biết',
    'xin',
    'what is the meaning of',
    'what is meaning of',
    'the meaning of',
    'meaning of',
    'how to pronounce',
    'pronunciation of',
    'how do you say',
    'how to use',
    'example of',
    'what do you mean by',
    'what does it mean',
    'can you tell me',
    'tell me',
    'please',
    'what is',
    "what's",
    'what does',
    'how to',
    'what',
    'is',
    'the',
    'a',
    'an',
    'of',
    'mean',
    'meaning',
    'pronounce',
    'pronunciation',
    'word',
  ];

  for (const word of stopWords) {
    let prev;
    do {
      prev = normalized;
      const regex = new RegExp('(^|\\s)' + word + '(?=\\s|$)', 'gi');
      normalized = normalized.replace(regex, ' ');
    } while (prev !== normalized);
  }

  // Làm sạch dấu câu
  normalized = normalized.replace(/[.?!,;:"'()[\]{}<>]/g, ' ');
  const phrase = normalized.trim().replace(/\s+/g, ' ');

  const keywords = [];
  if (phrase.length > 0) {
    keywords.push(phrase);

    // Tách thành các từ đơn để tăng độ phủ (bỏ qua các từ quá ngắn)
    // VD: "to" hầu như không có ý nghĩa khi tìm kiếm. Nó là stop word (từ dừng),
    //  xuất hiện ở rất nhiều câu nên chỉ làm kết quả tìm kiếm kém chính xác.
    const words = phrase.split(' ');
    if (words.length > 1) {
      for (const w of words) {
        if (w.length > 2) keywords.push(w);
      }
    }
  }

  return { keywords };
};

export const queryMinLishDataForAI = async (keywords) => {
  keywords = [...new Set(keywords)];
  let contextData = [];
  for (const keyword of keywords) {
    if (keyword.length < 2) continue; // Bỏ qua từ quá ngắn dễ gây nhiễu

    // Dùng Regex tìm từ chính xác (Word boundaries) (VD: tránh việc "core" match trúng "score")
    // Bắt đầu/kết thúc bằng khoảng trắng hoặc dấu câu, hoặc đầu/cuối chuỗi
    const searchRegex = new RegExp(
      `(^|\\s|[.,!?"'])${keyword}(?=\\s|$|[.,!?"'])`,
      'i'
    );

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

    // Tìm các từ có liên quan về mặt ngữ nghĩa (chứa term này trong term, translation, ví dụ hoặc giải thích)
    // Dùng word boundary cho an toàn với tiếng Anh (nếu là từ tiếng Việt thì dùng $regex thông thường)
    const semanticRegex = new RegExp(
      `(^|\\s|[.,!?"'])${termToSearch}(?=\\s|$|[.,!?"'])`,
      'i'
    );
    const semanticRelatedCards = await Card.aggregate([
      {
        $match: {
          _id: { $ne: mainCard._id },
          $or: [
            { term: semanticRegex },
            { translation: semanticRegex },
            { 'examples.en': semanticRegex },
            { 'explanation.en': semanticRegex },
          ],
        },
      },
      { $sample: { size: 10 } },
    ]);

    contextData.push({
      mainCard,
      relatedTopicCards,
      relatedDeckCards,
      relatedLessons,
      semanticRelatedCards,
    });
  }
  return contextData;
};

export const responseQuestionNetworkService = async (
  question,
  language = 'vi',
  historyContext = ''
) => {
  // AI trả lời tự do
  try {
    const prompt = `
    Bạn là hệ thống kiểm tra câu hỏi cho ứng dụng học tiếng Anh.${historyContext}
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
    Nếu có lịch sử hội thoại, hãy duy trì context và trả lời liên quan đến cuộc trò chuyện.
    Chỉ trả về JSON:
    {
      "isValidQuestion": boolean,
      "answer": string
    }
    `;
    const result = await generateWithRetry(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    if (error.message.includes('503'))
      throw new AppError(AI.BUSY_TRY_AGAIN, 503);
    throw new AppError(error.message, 500);
  }
};

export const responseQuestionMinLishService = async (
  question,
  contextData,
  language = 'vi',
  historyContext = ''
) => {
  if (!contextData || contextData.length === 0) {
    return {
      isValidQuestion: false,
      answer:
        language === 'en'
          ? "Sorry, I couldn't find any relevant data in MinLish."
          : 'Xin lỗi, tôi không tìm thấy dữ liệu nào liên quan trong hệ thống MinLish.',
    };
  }

  const q = question.toLowerCase();

  // Xác định ý định của câu hỏi (Intent parsing)
  const isPronunciation =
    q.includes('phát âm') ||
    q.includes('đọc') ||
    q.includes('pronounce') ||
    q.includes('pronunciation');
  const isExample =
    q.includes('ví dụ') || q.includes('đặt câu') || q.includes('example');
  const isRelated =
    q.includes('liên quan') ||
    q.includes('cùng chủ đề') ||
    q.includes('từ khác') ||
    q.includes('related');
  const isLesson =
    q.includes('bài học') || q.includes('học ở đâu') || q.includes('lesson');

  let answer = '';

  for (let i = 0; i < contextData.length; i++) {
    const item = contextData[i];
    const card = item.mainCard;

    answer += `**${card.term}** (${card.pos})\n`;

    if (isPronunciation) {
      const phoneticsStr =
        card.phonetics && card.phonetics.length > 0
          ? card.phonetics.map((p) => p.text).join(', ')
          : language === 'en'
            ? 'No information'
            : 'Chưa có thông tin';
      answer += `- ${language === 'en' ? 'Pronunciation' : 'Phát âm'}: ${phoneticsStr}\n`;
      answer += `- ${language === 'en' ? 'Meaning' : 'Nghĩa'}: ${card.translation}\n`;
    } else if (isExample) {
      answer += `- ${language === 'en' ? 'Meaning' : 'Nghĩa'}: ${card.translation}\n`;
      answer += `- ${language === 'en' ? 'Example' : 'Ví dụ'} (EN): ${card.examples?.en || (language === 'en' ? 'No example' : 'Chưa có ví dụ')}\n`;
      answer += `- ${language === 'en' ? 'Example' : 'Ví dụ'} (VI): ${card.examples?.vi || (language === 'en' ? 'No example' : 'Chưa có ví dụ')}\n`;
    } else if (isRelated) {
      answer += `- ${language === 'en' ? 'Meaning' : 'Nghĩa'}: ${card.translation}\n`;
      if (card.relatedWords && card.relatedWords.length > 0) {
        answer += `- ${language === 'en' ? 'Manually specified related words' : 'Các từ liên quan (nhập tay)'}: ${card.relatedWords.join(', ')}\n`;
      }
      if (item.semanticRelatedCards && item.semanticRelatedCards.length > 0) {
        answer += `- ${language === 'en' ? 'Semantically related words' : 'Các từ liên quan ngữ nghĩa'}: ${item.semanticRelatedCards.map((c) => c.term).join(', ')}\n`;
      }
      if (item.relatedTopicCards && item.relatedTopicCards.length > 0) {
        answer += `- ${language === 'en' ? 'Related topic words' : 'Các từ cùng chủ đề'}: ${item.relatedTopicCards.map((c) => c.term).join(', ')}\n`;
      }
      if (item.relatedDeckCards && item.relatedDeckCards.length > 0) {
        answer += `- ${language === 'en' ? 'Related deck words' : 'Các từ cùng bộ'}: ${item.relatedDeckCards.map((c) => c.term).join(', ')}\n`;
      }
    } else if (isLesson) {
      if (item.relatedLessons && item.relatedLessons.length > 0) {
        answer += `- ${language === 'en' ? 'You can learn this word in these lessons' : 'Bạn có thể học từ này trong các bài'}: \n`;
        item.relatedLessons.forEach((l) => {
          answer += `  + ${l.title}\n`;
        });
      } else {
        answer += `- ${language === 'en' ? 'No lessons contain this word yet' : 'Hiện chưa có bài học nào chứa từ này'}.\n`;
      }
    }
    // Mặc định (hỏi nghĩa hoặc chung chung)
    else {
      answer += `- ${language === 'en' ? 'Vietnamese Meaning' : 'Nghĩa tiếng Việt'}: ${card.translation}\n`;
      if (card.phonetics && card.phonetics.length > 0) {
        answer += `- ${language === 'en' ? 'Pronunciation' : 'Phát âm'}: ${card.phonetics.map((p) => p.text).join(', ')}\n`;
      }
      if (language === 'en' && card.explanation?.en) {
        answer += `- ${language === 'en' ? 'Explanation' : 'Giải thích'}: ${card.explanation.en}\n`;
      } else if (card.explanation?.vi) {
        answer += `- ${language === 'en' ? 'Explanation' : 'Giải thích'}: ${card.explanation.vi}\n`;
      }
    }
    answer += '\n';
  }

  return {
    isValidQuestion: true,
    answer: answer.trim(),
  };
};

const fetchAudioAndPhonetics = async (word) => {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const entry = data[0];
        const phonetics = [];
        entry.phonetics.forEach((p) => {
          if (p.text || p.audio) {
            phonetics.push({
              text: p.text || '',
              locale: p.audio?.includes('-uk') ? 'en-UK' : 'en-US',
              audio: p.audio || '',
            });
          }
        });
        const withAudio = phonetics.filter((p) => p.audio);
        if (withAudio.length > 0) {
          return withAudio;
        }
      }
    }
  } catch (err) {
    console.error('Free Dictionary API error:', err.message);
  }
  return null;
};

const fetchFreeImage = async (word) => {
  try {
    if (process.env.PEXELS_API_KEY) {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(word)}&per_page=1`,
        {
          headers: { Authorization: process.env.PEXELS_API_KEY },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.photos && data.photos.length > 0) {
          return data.photos[0].src.medium;
        }
      }
    }

    if (process.env.PIXABAY_API_KEY) {
      const response = await fetch(
        `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(word)}&image_type=photo&per_page=3`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.hits && data.hits.length > 0) {
          return data.hits[0].webformatURL;
        }
      }
    }
  } catch (err) {
    console.error('Free Image API error:', err.message);
  }
  return '';
};

const translateToVietnamese = async (text) => {
  if (!text) return '';
  try {
    const deeplAuthKey = process.env.DEEPL_AUTH_KEY;
    if (deeplAuthKey) {
      const isFreeTier = deeplAuthKey.endsWith(':fx');
      const apiUrl = isFreeTier
        ? 'https://api-free.deepl.com/v2/translate'
        : 'https://api.deepl.com/v2/translate';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${deeplAuthKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: [text],
          target_lang: 'VI',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.translations && data.translations.length > 0) {
          return data.translations[0].text;
        }
      } else {
        console.error(`DeepL API Error: ${response.status} - ${await response.text()}`);
      }
    }

    // Fallback to free Google Translate if DeepL is not configured or failed (use for localhost when dev)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data[0]) {
        let translatedText = '';
        for (let i = 0; i < data[0].length; i++) {
          if (data[0][i][0]) {
            translatedText += data[0][i][0];
          }
        }
        return translatedText;
      }
    }
  } catch (err) {
    console.error('Translation Error:', err.message);
  }
  return '';
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
    const parsedData = JSON.parse(result.response.text());

    // Fetch Audio and Image in parallel
    const [phoneticsData, imageUrl] = await Promise.all([
      fetchAudioAndPhonetics(parsedData.term),
      fetchFreeImage(parsedData.term),
    ]);

    // Apply Audio
    if (phoneticsData && phoneticsData.length > 0) {
      parsedData.phonetics = phoneticsData;
    } else {
      // Fallback Google TTS
      if (
        !parsedData.phonetics ||
        !Array.isArray(parsedData.phonetics) ||
        parsedData.phonetics.length === 0
      ) {
        parsedData.phonetics = [{ text: '', locale: 'en-US' }];
      }
      parsedData.phonetics = parsedData.phonetics.map((p) => ({
        ...p,
        audio:
          p.audio ||
          `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-US&q=${encodeURIComponent(parsedData.term)}`,
      }));
    }

    // Apply Image
    if (imageUrl) {
      parsedData.imageUrl = imageUrl;
    }

    return parsedData;
  } catch (error) {
    if (error.message && error.message.includes('503'))
      throw new AppError(AI.BUSY_TRY_AGAIN, 503);
    throw new AppError(error.message, 500);
  }
};

export const dictionaryFillCardService = async (word) => {
  try {
    const [phoneticsData, imageUrl] = await Promise.all([
      fetchAudioAndPhonetics(word),
      fetchFreeImage(word),
    ]);

    let explanationEn = '';
    let exampleEn = '';
    let pos = '';

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const entry = data[0];
          if (entry.meanings && entry.meanings.length > 0) {
            const meaning = entry.meanings[0];
            pos = meaning.partOfSpeech || '';
            if (meaning.definitions && meaning.definitions.length > 0) {
              explanationEn = meaning.definitions[0].definition || '';
              exampleEn = meaning.definitions[0].example || '';
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    const [translation, explanationVi, exampleVi] = await Promise.all([
      translateToVietnamese(word),
      translateToVietnamese(explanationEn),
      translateToVietnamese(exampleEn),
    ]);

    const parsedData = {
      pos,
      translation,
      explanationEn,
      explanationVi,
      exampleEn,
      exampleVi,
      phonetics: phoneticsData || [],
    };

    if (
      !parsedData.phonetics ||
      !Array.isArray(parsedData.phonetics) ||
      parsedData.phonetics.length === 0
    ) {
      parsedData.phonetics = [{ text: '', locale: 'en-US' }];
    }
    parsedData.phonetics = parsedData.phonetics.map((p) => ({
      ...p,
      audio:
        p.audio ||
        `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en-US&q=${encodeURIComponent(word)}`,
    }));

    if (imageUrl) {
      parsedData.imageUrl = imageUrl;
    }

    return parsedData;
  } catch (error) {
    throw new AppError(error.message, 500);
  }
};
