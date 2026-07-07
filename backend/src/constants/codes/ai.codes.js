export const AI = Object.freeze({
  CARD_AUTO_FILL_SUCCESS: 'CARD_AUTO_FILL_SUCCESS',
  AI_RESPONSE_SUCCESS: 'AI_RESPONSE_SUCCESS',
  QUESTION_REQUIRED: 'QUESTION_REQUIRED',
  INVALID_LANGUAGE: 'INVALID_LANGUAGE',
  INVALID_KEYWORD_IN_QUESTION: 'INVALID_KEYWORD_IN_QUESTION',
  INVALID_QUESTION: 'INVALID_QUESTION',
  NO_DATA_MATCH: 'NO_DATA_MATCH',
  BUSY_TRY_AGAIN: 'BUSY_TRY_AGAIN',
});

export const AI_MESSAGES = {
  CARD_AUTO_FILL_SUCCESS: 'Card details auto-filled successfully',
  AI_RESPONSE_SUCCESS: 'AI response successfully',
  QUESTION_REQUIRED: 'The question is required',
  INVALID_LANGUAGE: 'The language must be en (for English) or vi (for Vietnamese)',
  INVALID_KEYWORD_IN_QUESTION: 'No valid keyword found in your question',
  NO_DATA_MATCH: "MinLish currently doesn't have any data matching your question. Please try switching to web search mode!",
  INVALID_QUESTION: 'Invalid question',
  BUSY_TRY_AGAIN: "AI is busy, please try again later",
};
