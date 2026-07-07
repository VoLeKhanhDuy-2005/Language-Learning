import crypto from 'crypto';
import Deck from '../../models/deck.model.js';
import Topic from '../../models/topic.model.js';
import Card from '../../models/card.model.js';
import UserCardState from '../../models/userCardState.model.js';
import AppError from '../../utils/AppError.js';
import { USER_DECK } from '../../constants/codes/index.js';

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

  // Personal decks are just for studying — no progress tracking here.
  const topics = await Topic.find({ deckId }).sort({ order: 1 });

  return { deck, topics };
};

export const getMyDeckTopic = async (userId, deckId, topicId) => {
  await ensureOwnedDeck(userId, deckId);

  const topic = await Topic.findOne({ _id: topicId, deckId });
  if (!topic) throw new AppError(USER_DECK.DECK_OR_TOPIC_NOT_FOUND, 404);

  return topic;
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

  const cardIds = await Card.find({ deckId, topicId }).distinct('_id');

  await Promise.all([
    Card.deleteMany({ deckId, topicId }),
    UserCardState.deleteMany({ cardId: { $in: cardIds } }),
  ]);
  await topic.deleteOne();

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
  if (data.definition !== undefined) set['explanation.vi'] = data.definition;
  if (data.example !== undefined) set['examples.en'] = data.example;

  const updated = await Card.findOneAndUpdate(
    { _id: cardId, deckId },
    { $set: set },
    { new: true }
  );

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

  const card = await Card.create({
    deckId,
    topicId: data.topicId,
    order: nextOrder,
    term: data.term,
    translation: data.translation,
    pos: data.pos || '',
    explanation: { vi: data.definition || '', en: '' },
    examples: { vi: '', en: data.example || '' },
  });

  // Keep counters in sync (topic + deck).
  await Promise.all([
    Topic.updateOne({ _id: data.topicId }, { $inc: { cardCount: 1 } }),
    Deck.updateOne({ _id: deckId }, { $inc: { cardCount: 1 } }),
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
