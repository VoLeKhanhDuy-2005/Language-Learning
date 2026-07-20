import crypto from 'crypto';
import mongoose from 'mongoose';
import Deck from '../../models/deck.model.js';
import Topic from '../../models/topic.model.js';
import Card from '../../models/card.model.js';
import UserCardState from '../../models/userCardState.model.js';
import AppError from '../../utils/AppError.js';
import { USER_DECK } from '../../constants/codes/index.js';
import { generateQuizOptions } from '../deck/deck.service.js';
import {
  addRelatedWordsBiDirectional,
  removeRelatedWordsBiDirectional,
} from '../../utils/relatedWordsSync.js';

const MAX_USER_DECKS = 3;

// Throws 404 if the deck is missing or not owned by this user.
const ensureOwnedDeck = async (userId, deckId) => {
  const deck = await Deck.findOne({
    _id: deckId,
    ownerType: 'user',
    ownerId: userId,
  });
  if (!deck) throw new AppError(USER_DECK.DECK_NOT_FOUND, 404);
  return deck;
};

const buildSlug = (title) => {
  const base = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'deck'}-${crypto.randomBytes(4).toString('hex')}`;
};

export const listMyDecks = async (userId, filters) => {
  const { q, page, limit } = filters;

  const query = { ownerType: 'user', ownerId: userId };
  if (q) {
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

export const getMyDeckById = async (userId, deckId) => {
  const deck = await Deck.findOne({
    _id: deckId,
    ownerType: 'user',
    ownerId: userId,
  });
  if (!deck) throw new AppError(USER_DECK.DECK_NOT_FOUND, 404);

  return deck;
};

export const updateMyDeck = async (userId, deckId, data) => {
  const update = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;

  // Scope by owner so users can only update their own decks.
  const deck = await Deck.findOneAndUpdate(
    { _id: deckId, ownerType: 'user', ownerId: userId },
    { $set: update },
    { new: true }
  );
  if (!deck) throw new AppError(USER_DECK.DECK_NOT_FOUND, 404);

  return deck;
};

export const deleteMyDeck = async (userId, deckId) => {
  const deck = await Deck.findOne({
    _id: deckId,
    ownerType: 'user',
    ownerId: userId,
  });
  if (!deck) throw new AppError(USER_DECK.DECK_NOT_FOUND, 404);

  const cardIds = await Card.find({ deckId }).distinct('_id');

  await Promise.all([
    Card.deleteMany({ deckId }),
    Topic.deleteMany({ deckId }),
    UserCardState.deleteMany({ cardId: { $in: cardIds } }),
  ]);
  await deck.deleteOne();
};

export const getMyDeckTopics = async (userId, deckId) => {
  const deck = await ensureOwnedDeck(userId, deckId);

  const topics = await Topic.find({ deckId }).sort({ order: 1 });

  const progressRows = await UserCardState.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        deckId: new mongoose.Types.ObjectId(deckId),
      },
    },
    { $group: { _id: '$topicId', learnedCardCount: { $sum: 1 } } },
  ]);

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

export const getMyDeckTopic = async (userId, deckId, topicId) => {
  await ensureOwnedDeck(userId, deckId);

  const topic = await Topic.findOne({ _id: topicId, deckId });
  if (!topic) throw new AppError(USER_DECK.DECK_OR_TOPIC_NOT_FOUND, 404);

  return topic;
};

export const getMyTopicStudyCards = async (userId, deckId, topicId) => {
  await ensureOwnedDeck(userId, deckId);

  const topic = await Topic.findOne({ _id: topicId, deckId });
  if (!topic) throw new AppError(USER_DECK.DECK_OR_TOPIC_NOT_FOUND, 404);

  const cards = await Card.find({ deckId, topicId }).sort({ order: 1 });

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

export const updateMyDeckTopic = async (userId, deckId, topicId, data) => {
  await ensureOwnedDeck(userId, deckId);

  // Scope by deck so a topicId from another deck can't be hit.
  // Slug stays stable even when the name changes.
  const topic = await Topic.findOneAndUpdate(
    { _id: topicId, deckId },
    { $set: { name: data.name } },
    { new: true }
  );
  if (!topic) throw new AppError(USER_DECK.DECK_OR_TOPIC_NOT_FOUND, 404);

  return topic;
};

export const deleteMyDeckTopic = async (userId, deckId, topicId) => {
  await ensureOwnedDeck(userId, deckId);

  const topic = await Topic.findOne({ _id: topicId, deckId });
  if (!topic) throw new AppError(USER_DECK.DECK_OR_TOPIC_NOT_FOUND, 404);

  const cards = await Card.find({ deckId, topicId });
  const cardIds = cards.map((c) => c._id);

  await Promise.all([
    Card.deleteMany({ deckId, topicId }),
    UserCardState.deleteMany({ cardId: { $in: cardIds } }),
  ]);
  await topic.deleteOne();

  const relatedWordsPromises = cards.map((c) =>
    removeRelatedWordsBiDirectional(deckId, c.term, c.relatedWords)
  );
  await Promise.all(relatedWordsPromises);

  // Keep deck counters in sync.
  await Deck.updateOne(
    { _id: deckId },
    { $inc: { topicCount: -1, cardCount: -cardIds.length } }
  );
};

export const createMyDeckTopic = async (userId, deckId, data) => {
  await ensureOwnedDeck(userId, deckId);

  // Auto-assign order = highest existing order + 1 (append to end).
  const last = await Topic.findOne({ deckId })
    .sort({ order: -1 })
    .select('order');
  const nextOrder = last ? last.order + 1 : 1;

  const topic = await Topic.create({
    deckId,
    name: data.name,
    slug: buildSlug(data.name),
    order: nextOrder,
    cardCount: 0,
  });

  await Deck.updateOne({ _id: deckId }, { $inc: { topicCount: 1 } });

  return topic;
};

export const listMyDeckCards = async (userId, deckId, filters) => {
  await ensureOwnedDeck(userId, deckId);

  const { topicId, q, page, limit } = filters;

  const query = { deckId };
  if (topicId) query.topicId = topicId;
  if (q) {
    // Escape regex metacharacters to avoid ReDoS / injection.
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [{ term: regex }, { translation: regex }];
  }

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

export const getMyDeckCard = async (userId, deckId, cardId) => {
  await ensureOwnedDeck(userId, deckId);

  const card = await Card.findOne({ _id: cardId, deckId });
  if (!card) throw new AppError(USER_DECK.DECK_OR_CARD_NOT_FOUND, 404);

  return card;
};

export const updateMyDeckCard = async (userId, deckId, cardId, data) => {
  await ensureOwnedDeck(userId, deckId);

  const card = await Card.findOne({ _id: cardId, deckId });
  if (!card) throw new AppError(USER_DECK.DECK_OR_CARD_NOT_FOUND, 404);

  // Map flat request fields onto the card document.
  // Card stays in its topic — moving between topics is not supported.
  const set = {};
  if (data.term !== undefined) set.term = data.term;
  if (data.translation !== undefined) set.translation = data.translation;
  if (data.pos !== undefined) set.pos = data.pos;
  if (data.explanation !== undefined) {
    if (data.explanation.vi !== undefined)
      set['explanation.vi'] = data.explanation.vi;
    if (data.explanation.en !== undefined)
      set['explanation.en'] = data.explanation.en;
  }
  if (data.examples !== undefined) {
    if (data.examples.vi !== undefined) set['examples.vi'] = data.examples.vi;
    if (data.examples.en !== undefined) set['examples.en'] = data.examples.en;
  }
  if (data.phonetics !== undefined) set.phonetics = data.phonetics;
  if (data.imageUrl !== undefined) set.imageUrl = data.imageUrl;
  if (data.relatedWords !== undefined)
    set.relatedWords = Array.isArray(data.relatedWords)
      ? data.relatedWords
      : [];

  let updated;
  try {
    updated = await Card.findOneAndUpdate(
      { _id: cardId, deckId },
      { $set: set },
      { new: true }
    );
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(USER_DECK.CARD_EXISTS, 400);
    }
    throw error;
  }

  const oldTerm = card.term;
  const newTerm = updated.term;
  const oldRelatedWords = card.relatedWords || [];
  const newRelatedWords = updated.relatedWords || [];

  if (oldTerm !== newTerm) {
    await removeRelatedWordsBiDirectional(deckId, oldTerm, oldRelatedWords);
    await addRelatedWordsBiDirectional(deckId, newTerm, newRelatedWords);
  } else {
    const wordsToAdd = newRelatedWords.filter(
      (w) => !oldRelatedWords.includes(w)
    );
    const wordsToRemove = oldRelatedWords.filter(
      (w) => !newRelatedWords.includes(w)
    );
    await addRelatedWordsBiDirectional(deckId, newTerm, wordsToAdd);
    await removeRelatedWordsBiDirectional(deckId, oldTerm, wordsToRemove);
  }

  return updated;
};

export const deleteMyDeckCard = async (userId, deckId, cardId) => {
  await ensureOwnedDeck(userId, deckId);

  const card = await Card.findOne({ _id: cardId, deckId });
  if (!card) throw new AppError(USER_DECK.DECK_OR_CARD_NOT_FOUND, 404);

  await Promise.all([card.deleteOne(), UserCardState.deleteMany({ cardId })]);

  // Keep counters in sync (topic + deck).
  await Promise.all([
    Topic.updateOne({ _id: card.topicId }, { $inc: { cardCount: -1 } }),
    Deck.updateOne({ _id: deckId }, { $inc: { cardCount: -1 } }),
    removeRelatedWordsBiDirectional(deckId, card.term, card.relatedWords),
  ]);
};

export const createMyDeckCard = async (userId, deckId, data) => {
  await ensureOwnedDeck(userId, deckId);

  // Topic must belong to this deck (block cross-deck topicId).
  const topic = await Topic.findOne({ _id: data.topicId, deckId });
  if (!topic) throw new AppError(USER_DECK.DECK_OR_TOPIC_NOT_FOUND, 404);

  // Auto-assign order = highest existing order in this topic + 1.
  const last = await Card.findOne({ deckId, topicId: data.topicId })
    .sort({ order: -1 })
    .select('order');
  const nextOrder = last ? last.order + 1 : 1;

  let card;
  try {
    card = await Card.create({
      deckId,
      topicId: data.topicId,
      order: nextOrder,
      term: data.term,
      translation: data.translation,
      pos: data.pos || '',
      explanation: data.explanation || { vi: '', en: '' },
      examples: data.examples || { vi: '', en: '' },
      phonetics: Array.isArray(data.phonetics) ? data.phonetics : [],
      imageUrl: data.imageUrl || '',
      relatedWords: Array.isArray(data.relatedWords) ? data.relatedWords : [],
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(USER_DECK.CARD_EXISTS, 400);
    }
    throw error;
  }

  // Keep counters in sync (topic + deck).
  await Promise.all([
    Topic.updateOne({ _id: data.topicId }, { $inc: { cardCount: 1 } }),
    Deck.updateOne({ _id: deckId }, { $inc: { cardCount: 1 } }),
    addRelatedWordsBiDirectional(deckId, card.term, card.relatedWords),
  ]);

  return card;
};

export const createDeck = async (userId, data) => {
  const ownedCount = await Deck.countDocuments({
    ownerType: 'user',
    ownerId: userId,
  });
  if (ownedCount >= MAX_USER_DECKS) {
    throw new AppError(
      USER_DECK.MAX_DECKS_REACHED,
      400,
      [],
      `You can create at most ${MAX_USER_DECKS} decks`
    );
  }

  // User decks are personal and always published
  const deck = await Deck.create({
    title: data.title,
    description: data.description || '',
    slug: buildSlug(data.title),
    ownerType: 'user',
    ownerId: userId,
    status: 'published',
    publishedAt: new Date(),
  });

  return deck;
};
