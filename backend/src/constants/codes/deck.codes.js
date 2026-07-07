export const DECK = Object.freeze({
  // public success
  DECK_DETAIL_SUCCESS: 'DECK_DETAIL_SUCCESS',
  DECK_TOPICS_SUCCESS: 'DECK_TOPICS_SUCCESS',
  TOPIC_CARDS_SUCCESS: 'TOPIC_CARDS_SUCCESS',
  DECK_LIST_SUCCESS: 'DECK_LIST_SUCCESS',
  // error
  DECK_NOT_FOUND: 'DECK_NOT_FOUND',
  DECK_OR_TOPIC_NOT_FOUND: 'DECK_OR_TOPIC_NOT_FOUND',
  DECK_TITLE_EXISTS: 'DECK_TITLE_EXISTS',
  TOPIC_SLUG_EXISTS: 'TOPIC_SLUG_EXISTS',
  TOPIC_NAME_REQUIRED: 'TOPIC_NAME_REQUIRED',
  TOPIC_NOT_FOUND: 'TOPIC_NOT_FOUND',
});

export const DECK_MESSAGES = {
  DECK_DETAIL_SUCCESS: 'Deck detail retrieved successfully',
  DECK_TOPICS_SUCCESS: 'Deck topics retrieved successfully',
  TOPIC_CARDS_SUCCESS: 'Topic cards retrieved successfully',
  DECK_LIST_SUCCESS: 'Decks retrieved successfully',
  DECK_NOT_FOUND: 'Deck not found',
  DECK_OR_TOPIC_NOT_FOUND: 'Deck or topic not found',
  DECK_TITLE_EXISTS: 'Deck title already exists. Please change the title',
  TOPIC_SLUG_EXISTS:
    'Topic slug already exists. Please change the slug or title',
  TOPIC_NAME_REQUIRED: 'The name field is required',
  TOPIC_NOT_FOUND: 'Topic not found',
};
