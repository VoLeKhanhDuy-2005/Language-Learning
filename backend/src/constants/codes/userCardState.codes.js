export const USER_CARD_STATE = Object.freeze({
  CARD_STATE_LIST_SUCCESS: 'CARD_STATE_LIST_SUCCESS',
  CARD_STATE_DETAIL_SUCCESS: 'CARD_STATE_DETAIL_SUCCESS',
  CARD_STATE_UPSERT_SUCCESS: 'CARD_STATE_UPSERT_SUCCESS',

  CARD_STATE_NOT_FOUND: 'CARD_STATE_NOT_FOUND',
  CARD_STATE_CREATE_MISSING_DATA: 'CARD_STATE_CREATE_MISSING_DATA',
});

export const USER_CARD_STATE_MESSAGES = {
  CARD_STATE_LIST_SUCCESS: 'Successfully retrieved user card states',
  CARD_STATE_DETAIL_SUCCESS: 'Successfully retrieved user card state details',
  CARD_STATE_UPSERT_SUCCESS: 'Successfully created/updated card state',

  CARD_STATE_NOT_FOUND: 'User card state not found',
  CARD_STATE_CREATE_MISSING_DATA:
    'deckId and topicId are required when creating a new card state',
};
