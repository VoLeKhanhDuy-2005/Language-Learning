# Goal

Add a feature for Admins and Users to auto-fill card details using a reputable dictionary API.

## User Review Required

> [!IMPORTANT]
> The easiest and most reliable free dictionary API is the **Free Dictionary API** (`api.dictionaryapi.dev`), which returns English definitions, parts of speech, phonetics (with audio), and examples.
> Since this API is an English-English dictionary, it **cannot** provide the Vietnamese translation (`Nghĩa tiếng Việt`), Vietnamese explanations, or Vietnamese examples. Those fields will be left blank for you to fill in.

## Proposed Changes

### Frontend API Layer

- **`frontend/src/features/flashcards/flashcardsApi.js` & `frontend/src/features/admin/adminApi.js`**
  - Add a new helper function `fetchFromDictionaryApi(word)` that makes a GET request to `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`.

### Frontend UI (Admin)

- **`frontend/src/features/admin/pages/card/AdminCardCreatePage.jsx` & `AdminCardEditPage.jsx`**
  - Modify the `rightElement` of the "Word" input to include a new button: `📖 Dict` (next to the `✦ AI` button).
  - Add `handleDictionaryFill` function to call the API and parse the response. It will map:
    - `pos`: First meaning's part of speech
    - `phonetics`: IPA text and audio URL
    - `explanationEn`: First definition
    - `exampleEn`: First example (if available)

### Frontend UI (User)

- **`frontend/src/features/flashcards/pages/UserDeckDetailPage.jsx`**
  - Inside the "Create/Edit Card" modal, add the `📖 Dict` button next to the Term input field.
  - Implement `handleDictionaryFill` to map the API response to the User Card state (Term, Translation (left blank), POS, Definition, Example).

## Verification Plan

1. Test the "Dict" button in the Admin Create Card page with a word like "hello". Verify that POS, Phonetics, and English definition/example are populated.
2. Test the "Dict" button in the User Deck Detail page with a word like "world". Verify that POS, Definition, and Example are populated.
