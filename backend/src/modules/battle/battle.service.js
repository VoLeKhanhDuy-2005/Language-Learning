import mongoose from 'mongoose';
import Card from '../../models/card.model.js';
import { BattleMatch } from '../../models/battleMatch.model.js';

export const normalize = (str) => str.toLowerCase().trim().replace(/\s+/g, ' ');

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const generateQuestions = async (count, mode) => {
  const sampled = await Card.aggregate([
    {
      $lookup: {
        from: 'decks',
        localField: 'deckId',
        foreignField: '_id',
        as: 'deck',
      },
    },
    { $unwind: '$deck' },
    {
      $match: {
        'deck.ownerType': 'system',
        'deck.status': 'published',
        term: { $nin: ['', null] },
        translation: { $nin: ['', null] },
      },
    },
    { $sample: { size: count } },
    { $project: { term: 1, translation: 1 } },
  ]);

  if (sampled.length === 0) throw new Error('NOT_ENOUGH_CARDS');

  if (mode === 'typing') {
    // Show the Vietnamese meaning, user types the English term.
    // Send length/pattern/firstChar hints
    return sampled.map((card) => {
      const correctAnswer = normalize(card.term);
      return {
        cardId: card._id,
        term: card.translation,
        correctAnswer,
        options: [],
        answerLength: correctAnswer.length,
        answerPattern: correctAnswer.split(' ').map((w) => w.length),
        firstChar: correctAnswer[0] || '',
      };
    });
  }

  // MCQ: fetch distractor pool (exclude sampled cards)
  const sampledIds = sampled.map((c) => c._id);
  const distractorPool = await Card.aggregate([
    {
      $lookup: {
        from: 'decks',
        localField: 'deckId',
        foreignField: '_id',
        as: 'deck',
      },
    },
    { $unwind: '$deck' },
    {
      $match: {
        'deck.ownerType': 'system',
        'deck.status': 'published',
        translation: { $nin: ['', null] },
        _id: { $nin: sampledIds },
      },
    },
    { $sample: { size: count * 6 } },
    { $project: { translation: 1 } },
  ]);

  return sampled.map((card) => {
    const correct = normalize(card.translation);
    const used = new Set([correct]);
    const distractors = [];

    // Shuffle the pool per question so each card gets its own random distractors
    // (iterating the pool in fixed order would reuse the same first 3 every time).
    for (const d of shuffle(distractorPool)) {
      if (distractors.length >= 3) break;
      const norm = normalize(d.translation);
      if (!used.has(norm)) {
        used.add(norm);
        distractors.push(norm);
      }
    }

    return {
      cardId: card._id,
      term: card.term,
      correctAnswer: correct,
      options: shuffle([correct, ...distractors]),
    };
  });
};

export const getHistory = async (userId, { page = 1, limit = 20 } = {}) => {
  const filter = { status: 'finished', 'players.userId': userId };
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    BattleMatch.find(filter)
      .select('-questions')
      .sort({ finishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('players.userId', 'name avatarUrl')
      .populate('winnerId', 'name avatarUrl'),
    BattleMatch.countDocuments(filter),
  ]);

  return { items, page, limit, total };
};

// Full match detail (includes questions). Null if id invalid or not found.
export const getMatchById = async (matchId) => {
  if (!mongoose.Types.ObjectId.isValid(matchId)) return null;
  return BattleMatch.findById(matchId)
    .populate('players.userId', 'name avatarUrl')
    .populate('winnerId', 'name avatarUrl');
};
