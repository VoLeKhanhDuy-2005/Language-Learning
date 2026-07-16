import Card from '../../models/card.model.js';
import Deck from '../../models/deck.model.js';

// Search published SYSTEM-deck vocabulary by term, to prefill the
// "create card" form. Returns a flat shape matching the create payload.
export const searchSystemVocabularyService = async (
  { q, page, limit },
  userId
) => {
  // Escape regex metacharacters to avoid ReDoS / injection.
  const escaped = (q || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'i');

  const deckConditions = [{ ownerType: 'system', status: 'published' }];
  if (userId) {
    deckConditions.push({ ownerId: userId });
  }

  const validDeckIds = await Deck.find({ $or: deckConditions }).distinct('_id');

  const filter = {
    deckId: { $in: validDeckIds },
    term: regex,
  };

  const [cards, totalItems] = await Promise.all([
    Card.find(filter)
      .populate('deckId', 'title')
      .populate('topicId', 'name')
      .sort({ term: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Card.countDocuments(filter),
  ]);

  const mappedCards = cards.map((c) => ({
    sourceCardId: c._id,
    deckId: c.deckId?._id || c.deckId,
    deckName: c.deckId?.title || '',
    topicId: c.topicId?._id || c.topicId,
    topicName: c.topicId?.name || '',
    term: c.term,
    translation: c.translation,
    pos: c.pos || '',
    definition: c.explanation?.vi || '',
    example: c.examples?.en || '',
  }));

  return {
    cards: mappedCards,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
    },
  };
};
