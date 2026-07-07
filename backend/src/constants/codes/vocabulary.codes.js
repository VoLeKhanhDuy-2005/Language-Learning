export const VOCABULARY = Object.freeze({
  // success
  VOCAB_SEARCH_SUCCESS: 'VOCAB_SEARCH_SUCCESS',
  VOCAB_CARD_LIST_SUCCESS: 'VOCAB_CARD_LIST_SUCCESS',
  VOCAB_CARD_CREATE_SUCCESS: 'VOCAB_CARD_CREATE_SUCCESS',
  VOCAB_CARD_UPDATE_SUCCESS: 'VOCAB_CARD_UPDATE_SUCCESS',
  VOCAB_CARD_DELETE_SUCCESS: 'VOCAB_CARD_DELETE_SUCCESS',
  // error
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  DECK_NOT_FOUND: 'DECK_NOT_FOUND',
  TOPIC_NOT_FOUND: 'TOPIC_NOT_FOUND',
  TOPIC_NOT_IN_DECK: 'TOPIC_NOT_IN_DECK',
  VOCAB_ALREADY_EXISTS: 'VOCAB_ALREADY_EXISTS',
  VOCAB_NOT_FOUND: 'VOCAB_NOT_FOUND',
  VOCAB_DECK_NOT_FOUND: 'VOCAB_DECK_NOT_FOUND',
  VOCAB_TOPIC_NOT_FOUND: 'VOCAB_TOPIC_NOT_FOUND',
  VOCAB_UPDATE_FORBIDDEN: 'VOCAB_UPDATE_FORBIDDEN',
  VOCAB_DELETE_FORBIDDEN: 'VOCAB_DELETE_FORBIDDEN',
});

export const VOCABULARY_MESSAGES = {
  VOCAB_SEARCH_SUCCESS: 'Vocabulary search successful',
  VOCAB_CARD_LIST_SUCCESS: 'Cards retrieved successfully',
  VOCAB_CARD_CREATE_SUCCESS: 'Vocabulary card added successfully',
  VOCAB_CARD_UPDATE_SUCCESS: 'Vocabulary updated successfully',
  VOCAB_CARD_DELETE_SUCCESS: 'Vocabulary deleted successfully',
  USER_NOT_FOUND: 'User not found',
  MISSING_REQUIRED_FIELDS:
    'Missing required fields (deckId, topicId, term, translation)',
  DECK_NOT_FOUND: 'Deck not found',
  TOPIC_NOT_FOUND: 'Topic not found',
  TOPIC_NOT_IN_DECK: 'Topic does not belong to this deck',
  VOCAB_ALREADY_EXISTS: 'This vocabulary already exists in this topic',
  VOCAB_NOT_FOUND: 'Vocabulary not found',
  VOCAB_DECK_NOT_FOUND: 'The deck containing this vocabulary was not found',
  VOCAB_TOPIC_NOT_FOUND: 'The topic containing this vocabulary was not found',
  VOCAB_UPDATE_FORBIDDEN:
    'You do not have permission to update this vocabulary because it belongs to the system or another user',
  VOCAB_DELETE_FORBIDDEN:
    'You do not have permission to delete this vocabulary because it belongs to the system or another user',
};
