# Goal Description

The goal is to allow users to fully learn and review the flashcard decks they have created themselves, reusing the existing Spaced Repetition System (SRS) and learning UI used for system decks. The solution should be reusable, easily maintainable, and production-ready.

- This plan introduces a new endpoint `/users/me/decks/:deckId/topics/:topicId/study-cards` for fetching user cards tailored for the study mode (including SRS state and quiz options).
- `UserDeckDetailPage.jsx` will be updated with a "Learn" button.
- A new route `/profile/decks/:deckId/learn` will be added to render the `DeckDetailPage` component with `isSystem=false`.

## Proposed ideas

---

### Backend: userDeck Module

Updates to fetch user progress properly for custom decks and provide cards with `quizOptions` and `userCardState` for the learning interface.

#### [MODIFY] `userDeck.service.js`

- Refactor `getMyDeckTopics(userId, deckId)` to include progress aggregation (`userProgress`) by calculating learned cards per topic using `UserCardState` (similar to `getDeckTopics` in `deck.service.js`).
- Add a new function `getMyTopicStudyCards(userId, deckId, topicId)` that fetches cards for a specific user deck topic, attaches their `userCardState`, and generates `quizOptions`.

#### [MODIFY] `userDeck.controller.js`

- Add a controller function `getMyTopicStudyCards` to handle requests to the new service function.

#### [MODIFY] `userDeck.router.js`

- Add a new `GET` route: `/:deckId/topics/:topicId/study-cards` hooked to the `getMyTopicStudyCards` controller.

---

### Frontend: Flashcards & Routing

Integrating the frontend learning page (`DeckDetailPage.jsx`) to consume the newly created endpoint and rendering it via `App.jsx`.

#### [MODIFY] `flashcardsApi.js`

- Export a new API call `getUserTopicStudyCards(deckId, topicId)` to fetch cards from `/users/me/decks/${deckId}/topics/${topicId}/study-cards`.

#### [MODIFY] `DeckDetailPage.jsx`

- Replace the hardcoded `getTopicCards` API call. Ensure that when `isSystem === false`, the page correctly invokes `getUserTopicStudyCards` instead.

#### [MODIFY] `UserDeckDetailPage.jsx`

- Add a primary **Learn** button in the header alongside the edit button. This will trigger navigation to `/profile/decks/${deckId}/learn`.

#### [MODIFY] `App.jsx`

- Add a new route matcher for `/profile/decks/:deckId/learn` and render `<DeckDetailPage deckId={deckId} isSystem={false} onNavigate={navigate} />`.

## Verification Plan

### Automated Tests

- Review existing test cases ensuring the new API route compiles and responds accurately.

### Manual Verification

1. Log in to the application and navigate to the User Decks page (`/profile/decks`).
2. Create or open an existing user deck that contains topics and cards.
3. Verify that the topic list now shows progress metrics (e.g., "0 / X Words").
4. Click the "Learn" button on the user deck detail page.
5. Verify the navigation goes to `/profile/decks/:deckId/learn`.
6. Verify that the study session loads and that flashcard and quiz modes function properly.
7. Finish learning the topic and confirm that the cards then appear in the Review schedule (`/review`).
