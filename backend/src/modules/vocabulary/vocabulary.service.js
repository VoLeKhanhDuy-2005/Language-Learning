import Card from '../../models/card.model.js';
import Deck from '../../models/deck.model.js';

// Search published SYSTEM-deck vocabulary by term, to prefill the
// "create card" form. Returns a flat shape matching the create payload.
export const searchSystemVocabularyService = async ({ q, limit }, userId) => {
  // Escape regex metacharacters to avoid ReDoS / injection.
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'i');

  const deckConditions = [{ ownerType: 'system', status: 'published' }];
  if (userId) {
    deckConditions.push({ ownerId: userId });
  }

  const validDeckIds = await Deck.find({ $or: deckConditions }).distinct('_id');

  const cards = await Card.find({
    deckId: { $in: validDeckIds },
    term: regex,
  })
    .sort({ term: 1 })
    .limit(limit);

  return cards.map((c) => ({
    sourceCardId: c._id,
    term: c.term,
    translation: c.translation,
    pos: c.pos || '',
    definition: c.explanation?.vi || '',
    example: c.examples?.en || '',
  }));
};
