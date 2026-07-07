import mongoose from 'mongoose';
import Deck from '../../models/deck.model.js';
import Topic from '../../models/topic.model.js';
import Card from '../../models/card.model.js';
import UserCardState from '../../models/userCardState.model.js';
import AppError from '../../utils/AppError.js';
import { DECK, COMMON, ADMIN, MESSAGES } from '../../constants/codes/index.js';
import { generateSlug } from '../../utils/generate.js';

// Public deck endpoints serve the SYSTEM catalog only.
// A user's own decks are reached through /users/me/decks/*.
export const getDeckById = async (deckId) => {
  const deck = await Deck.findOne({
    _id: deckId,
    ownerType: 'system',
    status: 'published',
  });
  if (!deck) throw new AppError(DECK.DECK_NOT_FOUND, 404);

  return deck;
};

export const getDeckTopics = async (deckId, userId) => {
  // Reuse access check; throws 404 if deck not accessible.
  const deck = await getDeckById(deckId);

  const topics = await Topic.find({ deckId }).sort({ order: 1 });

  // Progress per topic in ONE aggregation. Solve N+1 query problem.
  // "learned" = card the user has any state for. A hidden card still counts.
  // Aggregate does NOT auto-cast strings to ObjectId — cast explicitly.
  const progressRows = await UserCardState.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        deckId: new mongoose.Types.ObjectId(deckId),
      },
    },
    { $group: { _id: '$topicId', learnedCardCount: { $sum: 1 } } },
  ]);

  // Map topicId -> learnedCardCount for O(1) merge.
  const learnedMap = progressRows.reduce((acc, row) => {
    acc[row._id.toString()] = row.learnedCardCount;
    return acc;
  }, {});

  const items = topics.map((topic) => {
    const learnedCardCount = learnedMap[topic._id.toString()] || 0;
    const totalCardCount = topic.cardCount;
    const progressPct =
      totalCardCount > 0
        ? Math.round((learnedCardCount / totalCardCount) * 100)
        : 0;

    return {
      topic,
      userProgress: { learnedCardCount, totalCardCount, progressPct },
    };
  });

  return { deck, topics: items };
};

export const getTopicCards = async (deckId, topicId, userId) => {
  // Reuse access check; throws 404 if deck not accessible.
  await getDeckById(deckId);

  // Topic must belong to this deck.
  const topic = await Topic.findOne({ _id: topicId, deckId });
  if (!topic) throw new AppError(DECK.DECK_OR_TOPIC_NOT_FOUND, 404);

  const cards = await Card.find({ deckId, topicId }).sort({ order: 1 });

  // Fetch user's states for these cards, then merge by cardId (O(1) lookup).
  const cardIds = cards.map((c) => c._id);
  const userCardStates = await UserCardState.find({
    userId,
    cardId: { $in: cardIds },
  });

  const stateMap = userCardStates.reduce((acc, state) => {
    acc[state.cardId.toString()] = state;
    return acc;
  }, {});

  const items = await Promise.all(
    cards.map(async (card) => {
      const quizOptions = await generateQuizOptions(
        topicId,
        card.term,
        card._id
      );
      return {
        card: {
          ...card.toObject(),
          quizOptions,
        },
        userCardState: stateMap[card._id.toString()] || null,
      };
    })
  );

  return { cards: items };
};

export const listDecks = async (filters) => {
  const { tagId, cefrLevelId, q, page, limit } = filters;

  // Public catalog = system published decks only.
  const query = { ownerType: 'system', status: 'published' };
  if (tagId) query.tagIds = tagId;
  if (cefrLevelId) query.cefrLevelIds = cefrLevelId;
  if (q) {
    // Escape regex metacharacters to avoid ReDoS / injection.
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [{ title: regex }, { description: regex }];
  }

  const skip = (page - 1) * limit;
  const [decks, totalItems] = await Promise.all([
    Deck.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    Deck.countDocuments(query),
  ]);

  return {
    decks,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

export const listAdminDecks = async (filters) => {
  const { tagId, cefrLevelId, q, status, page, limit } = filters;

  const query = {};
  if (tagId) query.tagIds = tagId;
  if (cefrLevelId) query.cefrLevelIds = cefrLevelId;
  if (status) query.status = status;
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // /[.*+?^${}()|[\]\\]/g
    // - regex dùng để bắt các ký tự đặc biệt
    // - [] : nhóm ký tự cần tìm
    // - \ : escape
    // - g : global -> thay tất cả, không chỉ lần đầu
    // \\$&
    // - \\ -> tạo ra một dấu \
    // - $& -> đại diện cho ký tự vừa match
    // + -> \+ thay vì + = lặp 1 hoặc nhiều lần, * = lặp 0 hoặc nhiều lần theo cách hiểu của regex

    const regex = new RegExp(escaped, 'i');
    query.$or = [{ title: regex }, { description: regex }];
  }
  query.ownerType = 'system';

  const skip = (page - 1) * limit; // Tính số lượng bản ghi cần bỏ qua khi phân trang
  // vd: const page = 3; const limit = 10;
  // const skip = (page - 1) * limit = 20;
  // -> trang 1 bỏ qua 0 record, trang 2 bỏ qua 10 record

  const [decks, totalItems] = await Promise.all([
    Deck.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate('tagIds', 'label code') //có kèm id tag nếu ko -_id
      .populate('cefrLevelIds', 'label code'),
    Deck.countDocuments(query), // Số lượng deck khớp với điều kiện query
  ]);
  return {
    decks,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

export const createAdminDeck = async (payload) => {
  if (!payload.title) throw new AppError(ADMIN.DECK_TITLE_REQUIRED, 400);
  let slug = payload.slug;
  if (!payload.slug) slug = generateSlug(payload.title);
  const existing = await Deck.findOne({ slug });
  if (existing) {
    throw new AppError(DECK.DECK_TITLE_EXISTS, 400);
  }

  const newDeck = new Deck({
    ...payload,
    slug,
    ownerType: 'system',
    status: payload.status || 'draft',
  });
  if (newDeck.status === 'published') {
    newDeck.publishedAt = new Date();
  }
  await newDeck.save();
  return newDeck;
};

export const getAdminDeckById = async (deckId) => {
  const deck = await Deck.findById(deckId)
    .populate('tagIds', 'label code')
    .populate('cefrLevelIds', 'label code');
  if (!deck) throw new AppError(DECK.DECK_NOT_FOUND, 404);
  return deck;
};

export const updateAdminDeck = async (deckId, payload) => {
  if (!payload.title) throw new AppError(ADMIN.DECK_TITLE_REQUIRED, 400);

  const deck = await Deck.findById(deckId);
  if (!deck) throw new AppError(DECK.DECK_NOT_FOUND, 404);

  let slug = payload.slug;
  if (!payload.slug) {
    slug = generateSlug(payload.title);
  }

  const existing = await Deck.findOne({ slug, _id: { $ne: deckId } });
  if (existing) {
    throw new AppError(DECK.DECK_TITLE_EXISTS, 400);
  }

  const oldStatus = deck.status;
  Object.assign(deck, payload);
  deck.slug = slug;
  if (payload.status === 'published' && oldStatus !== 'published') {
    deck.publishedAt = new Date();
  }
  await deck.save();
  return deck;
};

export const deleteAdminDeck = async (deckId) => {
  const deck = await Deck.findById(deckId);
  if (!deck) throw new AppError(DECK.DECK_NOT_FOUND, 404);
  deck.status = 'archived';
  await deck.save();
  return deck;
};

export const getAdminDeckTopics = async (deckId) => {
  const deck = await Deck.findById(deckId);
  if (!deck) throw new AppError(DECK.DECK_NOT_FOUND, 404);
  const topics = await Topic.find({ deckId }).sort({ order: 1 });
  return topics;
};

export const createAdminDeckTopic = async (deckId, data) => {
  const deck = await Deck.findById(deckId);
  if (!deck) throw new AppError(DECK.DECK_NOT_FOUND, 404);

  if (!data.name)
    throw new AppError(DECK.TOPIC_NAME_REQUIRED, 400, [
      {
        field: 'name',
        message: 'The name field is required',
      },
    ]);

  const last = await Topic.findOne({ deckId })
    .sort({ order: -1 })
    .select('order');
  const nextOrder = last ? last.order + 1 : 1;
  let slug = data.slug;
  if (!data.slug) slug = generateSlug(data.name);
  const existing = await Topic.findOne({ deckId, slug });
  if (existing)
    throw new AppError(DECK.TOPIC_SLUG_EXISTS, 409, [
      {
        field: 'slug',
        message: 'Topic slug already exists. Please change the slug or title',
      },
    ]);

  const topic = await Topic.create({
    deckId,
    name: data.name,
    slug,
    order: nextOrder,
    cardCount: 0,
  });
  await Deck.updateOne({ _id: deckId }, { $inc: { topicCount: 1 } });
  return topic;
};

export const getAdminDeckTopic = async (deckId, topicId) => {
  const topic = await Topic.findOne({ _id: topicId, deckId });
  if (!topic) throw new AppError(DECK.DECK_OR_TOPIC_NOT_FOUND, 404);
  return topic;
};

export const updateAdminDeckTopic = async (deckId, topicId, data) => {
  const topic = await Topic.findOne({ _id: topicId, deckId });
  if (!topic) throw new AppError(DECK.DECK_OR_TOPIC_NOT_FOUND, 404);

  let slug = data.slug;
  if (!data.slug) slug = generateSlug(data.name);
  const existing = await Topic.findOne({ deckId, slug, _id: { $ne: topicId } });
  if (existing)
    throw new AppError(DECK.TOPIC_SLUG_EXISTS, 409, [
      {
        field: 'slug',
        message: 'Topic slug already exists. Please change the slug or title',
      },
    ]);
  topic.slug = slug;

  if (data.name) topic.name = data.name;
  else
    throw new AppError(DECK.TOPIC_NAME_REQUIRED, 400, [
      {
        field: 'name',
        message: 'The name field is required',
      },
    ]);
  await topic.save();
  return topic;
};

export const deleteAdminDeckTopic = async (deckId, topicId) => {
  const topic = await Topic.findOne({ _id: topicId, deckId });
  if (!topic) throw new AppError(DECK.DECK_OR_TOPIC_NOT_FOUND, 404);

  const cardIds = await Card.find({ deckId, topicId }).distinct('_id');
  // distinct('_id') trả về mảng thuần:
  // [ ObjectId("66a..."), ObjectId("66b...")]
  // find().select('_id') trả về mảng document:
  // [ { _id: ObjectId("66a...") }, { _id: ObjectId("66b...") }]

  await Promise.all([
    Card.deleteMany({ deckId, topicId }),
    UserCardState.deleteMany({ cardId: { $in: cardIds } }),
  ]);
  await topic.deleteOne();

  await Topic.updateMany(
    { deckId, order: { $gt: topic.order } },
    { $inc: { order: -1 } }
  );

  await Deck.updateOne(
    { _id: deckId },
    { $inc: { topicCount: -1, cardCount: -cardIds.length } }
  );
};

export const deleteAdminMultipleDeckTopics = async (deckId, topicIds) => {
  if (!Array.isArray(topicIds) || topicIds.length === 0) {
    throw new AppError(COMMON.INVALID_DATA, 400, [{ field: 'topicIds', message: 'Must be a non-empty array' }]);
  }

  const topics = await Topic.find({ _id: { $in: topicIds }, deckId });
  if (topics.length === 0) {
    throw new AppError(DECK.DECK_OR_TOPIC_NOT_FOUND, 404);
  }
  const foundTopicIds = topics.map((t) => t._id);

  const cardIds = await Card.find({ deckId, topicId: { $in: foundTopicIds } }).distinct('_id');
  await Promise.all([
    Card.deleteMany({ deckId, topicId: { $in: foundTopicIds } }),
    UserCardState.deleteMany({ cardId: { $in: cardIds } }),
  ]);
  await Topic.deleteMany({ _id: { $in: foundTopicIds } });

  // Tính toán lại order cho các topics còn lại
  const remainingTopics = await Topic.find({ deckId }).sort({ order: 1 });
  const bulkOps = remainingTopics.map((t, index) => ({
    updateOne: {
      filter: { _id: t._id },
      update: { $set: { order: index + 1 } },//array dùng index bắt đầu từ 0
    },
  }));
  if (bulkOps.length > 0) {
    await Topic.bulkWrite(bulkOps);
  }
  await Deck.updateOne(
    { _id: deckId },
    { $inc: { topicCount: -foundTopicIds.length, cardCount: -cardIds.length } }
  );
};

export const reorderAdminDeckTopics = async (deckId, topics) => {
  const errors = [];
  if (!Array.isArray(topics) || topics.length === 0) {
    errors.push({
      field: 'topics',
      message: 'The topics field must be a non-empty array',
    });
  } else {
    const seenTopicIds = new Set();
    const seenOrders = new Set();
    topics.forEach((item, index) => {
      if (!item.topicId) {
        errors.push({
          field: `topics[${index}].topicId`,
          message: 'The topicId field is required',
        });
      } else if (seenTopicIds.has(item.topicId)) {
        errors.push({
          field: `topics[${index}].topicId`,
          message: 'Duplicate topicId found in the list',
        });
      } else {
        seenTopicIds.add(item.topicId);
      }

      if (!item.order || !Number.isInteger(item.order) || item.order < 1) {
        errors.push({
          field: `topics[${index}].order`,
          message: 'The order field is required and must be an integer >= 1',
        });
      } else if (seenOrders.has(item.order)) {
        errors.push({
          field: `topics[${index}].order`,
          message: 'Duplicate order found in the list',
        });
      } else {
        seenOrders.add(item.order);
      }
    });
  }

  if (errors.length > 0) {
    throw new AppError(COMMON.INVALID_DATA, 400, errors);
  }

  const deck = await Deck.findById(deckId);
  if (!deck) throw new AppError(DECK.DECK_NOT_FOUND, 404);

  const bulkOps = topics.map(({ topicId, order }) => ({
    updateOne: {
      filter: { _id: topicId, deckId },
      // deckId là để kiểm tra deck này có đúng là chứa topic này không, tránh giả deckId
      update: { $set: { order } },
    },
  }));
  if (bulkOps.length > 0) {
    await Topic.bulkWrite(bulkOps); // Chạy tất cả update trong một lần gọi MongoDB
  }
};

export const generateQuizOptions = async (
  topicId,
  currentTerm,
  excludeCardId = null
) => {
  const matchQuery = {
    topicId: new mongoose.Types.ObjectId(topicId),
    term: { $ne: currentTerm },
  };
  if (excludeCardId) {
    matchQuery._id = { $ne: new mongoose.Types.ObjectId(excludeCardId) };
  }
  const randomCards = await Card.aggregate([
    { $match: matchQuery },
    { $sample: { size: 3 } },
    { $project: { term: 1 } }, // Chỉ giữ lại field term và _id (defauld id nếu không truyền _id :0)
  ]);

  const options = randomCards.map((c) => ({
    word: c.term,
    isCorrect: false,
  }));
  if (options.length < 3) {
    const excludeTerms = options.map((o) => o.word);
    excludeTerms.push(currentTerm);
    const extraCards = await Card.aggregate([
      { $match: { term: { $nin: excludeTerms } } },
      { $sample: { size: 3 - options.length } },
      { $project: { term: 1 } },
    ]);
    extraCards.forEach((c) => {
      options.push({ word: c.term, isCorrect: false });
    });
  }
  options.push({
    word: currentTerm,
    isCorrect: true,
  });

  // Shuffle array
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Thuật toán Fisher-Yates shuffle (0 <= j <= i)
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
};

export const generateQuizOptionsBatch = async (cardRequests) => {
  if (!cardRequests || cardRequests.length === 0) return {};

  const topicIds = [...new Set(cardRequests.map((c) => c.topicId.toString()))];

  // 1. Lấy một pool từ vựng chung cho các topic này (1 query duy nhất)
  const poolCards = await Card.aggregate([
    {
      $match: {
        topicId: { $in: topicIds.map((id) => new mongoose.Types.ObjectId(id)) },
      },
    },
    { $sample: { size: 100 } }, // Số lượng lớn để làm pool
    { $project: { term: 1 } },
  ]);

  // Nếu không đủ từ trong các topic, lấy thêm từ ngẫu nhiên
  let extraPool = [];
  if (poolCards.length < 50) {
    extraPool = await Card.aggregate([
      { $sample: { size: 100 } },
      { $project: { term: 1 } },
    ]);
  }

  // Gộp tất cả các từ lại và loại bỏ trùng lặp
  const allTerms = [
    ...new Set([
      ...poolCards.map((c) => c.term),
      ...extraPool.map((c) => c.term),
    ]),
  ];

  const results = {};

  // 2. Tạo quiz options cho từng card trong memory (Không query DB)
  for (const req of cardRequests) {
    const { term, cardId } = req;
    let availableTerms = allTerms.filter((t) => t !== term); // Lọc bỏ từ hiện tại

    for (let i = availableTerms.length - 1; i > 0; i--) {
      // Shuffle pool từ vựng còn lại
      const j = Math.floor(Math.random() * (i + 1));
      [availableTerms[i], availableTerms[j]] = [
        availableTerms[j],
        availableTerms[i],
      ];
    }

    const selectedTerms = availableTerms.slice(0, 3); // Chọn 3 đáp án sai

    const options = selectedTerms.map((t) => ({
      word: t,
      isCorrect: false,
    }));

    options.push({
      // Thêm đáp án đúng
      word: term,
      isCorrect: true,
    });

    for (let i = options.length - 1; i > 0; i--) {
      // Shuffle thứ tự đáp án
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    results[cardId] = options;
  }
  return results;
};

export const listAdminDeckCards = async (deckId, filters) => {
  const deck = await Deck.findById(deckId);
  if (!deck) throw new AppError(ADMIN.DECK_NOT_FOUND, 404);

  const { topicId, q, page, limit, pos } = filters;
  const query = { deckId };
  if (topicId) query.topicId = topicId;
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [{ term: regex }, { translation: regex }];
  }
  if (pos) query.pos = pos;

  const skip = (page - 1) * limit;
  const [cards, totalItems] = await Promise.all([
    Card.find(query).sort({ order: 1 }).skip(skip).limit(limit),
    Card.countDocuments(query),
  ]);
  return {
    cards,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

const validateCardData = (data) => {
  const errors = [];
  if (!data.topicId)
    errors.push({ field: 'topicId', message: 'The topicId field is required' });
  if (!data.term)
    errors.push({ field: 'term', message: 'The term field is required' });
  if (!data.pos)
    errors.push({ field: 'pos', message: 'The pos field is required' });
  if (!data.translation)
    errors.push({
      field: 'translation',
      message: 'The translation field is required',
    });
  if (errors.length > 0) {
    throw new AppError(COMMON.INVALID_DATA, 400, errors);
  }
};

const validateTopicInDeck = async (deckId, topicId) => {
  const topic = await Topic.findById(topicId);
  if (!topic) {
    throw new AppError(ADMIN.TOPIC_NOT_FOUND, 404);
  }
  if (topic.deckId.toString() !== deckId.toString()) {
    throw new AppError(COMMON.INVALID_DATA, 400, [
      {
        field: 'topicId',
        message: 'Topic does not belong to this deck',
      },
    ]);
  }
  return topic;
};

export const createAdminDeckCard = async (deckId, data) => {
  validateCardData(data);
  const deck = await Deck.findById(deckId);
  if (!deck) throw new AppError(ADMIN.DECK_NOT_FOUND, 404);
  await validateTopicInDeck(deckId, data.topicId);

  const last = await Card.findOne({ deckId, topicId: data.topicId })
    .sort({ order: -1 })
    .select('order');
  const nextOrder = last ? last.order + 1 : 1;

  const card = await Card.create({
    deckId,
    topicId: data.topicId,
    order: nextOrder,
    term: data.term,
    translation: data.translation,
    pos: data.pos || '',
    phonetics: data.phonetics || [],
    explanation: data.explanation || { vi: '', en: '' },
    examples: data.examples || { vi: '', en: '' },
    imageUrl: data.imageUrl || '',
    // default '', []: tránh Client (hoặc do lỗi logic) gửi lên field: null
  });
  await Promise.all([
    Topic.updateOne({ _id: data.topicId }, { $inc: { cardCount: 1 } }),
    Deck.updateOne({ _id: deckId }, { $inc: { cardCount: 1 } }),
  ]);
  return card;
};

export const getAdminDeckCard = async (deckId, cardId) => {
  const card = await Card.findOne({ _id: cardId, deckId });
  if (!card) throw new AppError(ADMIN.CARD_NOT_FOUND, 404);
  return card;
};

export const updateAdminDeckCard = async (deckId, cardId, data) => {
  const card = await Card.findOne({ _id: cardId, deckId });
  if (!card) throw new AppError(ADMIN.CARD_NOT_FOUND, 404);
  validateCardData(data);
  await validateTopicInDeck(deckId, data.topicId);

  const set = {};
  if (data.topicId !== undefined) set.topicId = data.topicId;
  if (data.term !== undefined)
    // Check có gửi field hay ko != ! check falsy
    set.term = data.term;
  if (data.translation !== undefined) set.translation = data.translation;
  if (data.pos !== undefined) set.pos = data.pos;
  if (data.phonetics !== undefined) set.phonetics = data.phonetics;
  if (data.explanation !== undefined) set.explanation = data.explanation;
  if (data.examples !== undefined) set.examples = data.examples;
  if (data.imageUrl !== undefined) set.imageUrl = data.imageUrl;

  const isTopicChanged = set.topicId && set.topicId.toString() !== card.topicId.toString();

  if (isTopicChanged) {
    await Card.updateMany(
      { deckId, topicId: card.topicId, order: { $gt: card.order } },
      { $inc: { order: -1 } }
    );
    
    const newOrder = data.order !== undefined ? data.order : await Card.countDocuments({ deckId, topicId: set.topicId }) + 1;
    await Card.updateMany(
      { deckId, topicId: set.topicId, order: { $gte: newOrder } },
      { $inc: { order: 1 } }
    );
    set.order = newOrder;
  } else if (data.order !== undefined && data.order !== card.order) {
    const newOrder = data.order;
    const oldOrder = card.order;
    if (newOrder > oldOrder) {
      await Card.updateMany(
        { deckId, topicId: card.topicId, order: { $gt: oldOrder, $lte: newOrder } },
        { $inc: { order: -1 } }
      );
    } else if (newOrder < oldOrder) {
      await Card.updateMany(
        { deckId, topicId: card.topicId, order: { $gte: newOrder, $lt: oldOrder } },
        { $inc: { order: 1 } }
      );
    }
    set.order = newOrder;
  }

  const updated = await Card.findOneAndUpdate(
    { _id: cardId, deckId },
    { $set: set },
    { new: true }
  );

  if (set.topicId && set.topicId.toString() !== card.topicId.toString()) {
    await Promise.all([
      Topic.updateOne({ _id: card.topicId }, { $inc: { cardCount: -1 } }),
      Topic.updateOne({ _id: set.topicId }, { $inc: { cardCount: 1 } }),
    ]);
  }

  return updated;
};

export const deleteAdminDeckCard = async (deckId, cardId) => {
  const card = await Card.findOne({ _id: cardId, deckId });
  if (!card) throw new AppError(ADMIN.CARD_NOT_FOUND, 404);
  await Promise.all([
    card.deleteOne(),
    UserCardState.deleteMany({ cardId }),
    Card.updateMany(
      { deckId, topicId: card.topicId, order: { $gt: card.order } },
      { $inc: { order: -1 } }
    ),
  ]);
  await Promise.all([
    Topic.updateOne({ _id: card.topicId }, { $inc: { cardCount: -1 } }),
    Deck.updateOne({ _id: deckId }, { $inc: { cardCount: -1 } }),
  ]);
};

export const deleteAdminMultipleDeckCards = async (deckId, cardIds) => {
  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    throw new AppError(COMMON.INVALID_DATA, 400, [{ field: 'cardIds', message: 'Must be a non-empty array' }]);
  }
  const cards = await Card.find({ _id: { $in: cardIds }, deckId });
  if (cards.length === 0) {
    throw new AppError(ADMIN.CARD_NOT_FOUND, 404);
  }
  const foundCardIds = cards.map((c) => c._id);

  // Group by topicId để update topic cardCount
  const topicCountMap = {};
  cards.forEach((card) => {
    const topicIdStr = card.topicId.toString();
    topicCountMap[topicIdStr] = (topicCountMap[topicIdStr] || 0) + 1;//topicCountMap[topicIdStr] chưa có lấy 0, có rồi + 1
  });

  await Promise.all([
    Card.deleteMany({ _id: { $in: foundCardIds } }),
    UserCardState.deleteMany({ cardId: { $in: foundCardIds } }),
  ]);

  const topicUpdates = Object.keys(topicCountMap).map((topicId) => {
    return Topic.updateOne(
      { _id: topicId },
      { $inc: { cardCount: -topicCountMap[topicId] } }
    );
  });
  await Promise.all(topicUpdates);//chạy tất cả các Promise trong mảng topicUpdates song song và chờ tất cả hoàn thành

  // Tính toán lại order cho các cards còn lại trong từng topic bị ảnh hưởng
  const affectedTopicIds = Object.keys(topicCountMap);
  for (const tId of affectedTopicIds) {
    const remainingCards = await Card.find({ deckId, topicId: tId }).sort({ order: 1 });
    const bulkOps = remainingCards.map((c, index) => ({
      updateOne: {
        filter: { _id: c._id },
        update: { $set: { order: index + 1 } },
      },
    }));
    if (bulkOps.length > 0) {
      await Card.bulkWrite(bulkOps);
    }
  }

  await Deck.updateOne(
    { _id: deckId },
    { $inc: { cardCount: -foundCardIds.length } }
  );
};

export const reorderAdminTopicCards = async (topicId, cards) => {
  const errors = [];
  if (!Array.isArray(cards) || cards.length === 0) {
    errors.push({
      field: 'cards',
      message: 'The cards field must be a non-empty array',
    });
  } else {
    const seenCardIds = new Set();
    const seenOrders = new Set();
    cards.forEach((item, index) => {
      if (!item.cardId) {
        errors.push({
          field: `cards[${index}].cardId`,
          message: 'The cardId field is required',
        });
      } else if (seenCardIds.has(item.cardId)) {
        errors.push({
          field: `cards[${index}].cardId`,
          message: 'Duplicate cardId found in the list',
        });
      } else {
        seenCardIds.add(item.cardId);
      }

      if (!item.order || !Number.isInteger(item.order) || item.order < 1) {
        errors.push({
          field: `cards[${index}].order`,
          message: 'The order field is required and must be an integer >= 1',
        });
      } else if (seenOrders.has(item.order)) {
        errors.push({
          field: `cards[${index}].order`,
          message: 'Duplicate order found in the list',
        });
      } else {
        seenOrders.add(item.order);
      }
    });
  }

  if (errors.length > 0) {
    throw new AppError(COMMON.INVALID_DATA, 400, errors);
  }

  const topic = await Topic.findById(topicId);
  if (!topic) throw new AppError(DECK.TOPIC_NOT_FOUND, 404);

  const bulkOps = cards.map(({ cardId, order }) => ({
    updateOne: {
      filter: { _id: cardId, topicId },
      // topicId để kiểm tra topic này có đúng là chứa card này không, tránh giả topicId
      update: { $set: { order } },
    },
  }));
  if (bulkOps.length > 0) {
    await Card.bulkWrite(bulkOps);
  }
};
