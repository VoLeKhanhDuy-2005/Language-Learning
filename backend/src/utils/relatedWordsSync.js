import Card from '../models/card.model.js';

/**
 * Thêm `currentTerm` vào mảng `relatedWords` của các thẻ có `term` nằm trong `relatedWordsToAdd`
 * @param {ObjectId|string} deckId
 * @param {string} currentTerm
 * @param {string[]} relatedWordsToAdd
 */
export const addRelatedWordsBiDirectional = async (
  deckId,
  currentTerm,
  relatedWordsToAdd
) => {
  if (!currentTerm || !relatedWordsToAdd || relatedWordsToAdd.length === 0)
    return;

  await Card.updateMany(
    { deckId, term: { $in: relatedWordsToAdd } },
    { $addToSet: { relatedWords: currentTerm } } //$addToSet: add ko trùng != $push
  );
};

/**
 * Xóa `currentTerm` khỏi mảng `relatedWords` của các thẻ có `term` nằm trong `relatedWordsToRemove`
 * (chỉ xóa nếu không còn thẻ nào khác trong deck có term=currentTerm và đang tham chiếu đến word)
 * @param {ObjectId|string} deckId
 * @param {string} currentTerm
 * @param {string[]} relatedWordsToRemove
 */
export const removeRelatedWordsBiDirectional = async (
  deckId,
  currentTerm,
  relatedWordsToRemove
) => {
  if (
    !currentTerm ||
    !relatedWordsToRemove ||
    relatedWordsToRemove.length === 0
  )
    return;

  for (const wordToRemove of relatedWordsToRemove) {
    const stillReferenced = await Card.exists({
      deckId,
      term: currentTerm,
      relatedWords: wordToRemove,
    });

    if (!stillReferenced) {
      await Card.updateMany(
        { deckId, term: wordToRemove },
        { $pull: { relatedWords: currentTerm } } //$pull: delete in updateMany
      );
    }
  }
};
