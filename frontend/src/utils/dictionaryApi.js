import axios from "axios";

export const fetchFromDictionaryApi = async (word) => {
  try {
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    );

    if (response.data && response.data.length > 0) {
      const entry = response.data[0];
      const result = {
        pos: "",
        phonetics: [],
        explanationEn: "",
        exampleEn: "",
      };

      // Extract POS, meaning and example from the first meaning
      if (entry.meanings && entry.meanings.length > 0) {
        const meaning = entry.meanings[0];
        result.pos = meaning.partOfSpeech || "";

        if (meaning.definitions && meaning.definitions.length > 0) {
          result.explanationEn = meaning.definitions[0].definition || "";
          result.exampleEn = meaning.definitions[0].example || "";
        }
      }

      // Extract phonetics (text and audio)
      if (entry.phonetics && entry.phonetics.length > 0) {
        const bestPhonetics = {};

        entry.phonetics.forEach((p) => {
          if (!p.text && !p.audio) return;

          let locale = "en-US";
          if (
            p.audio &&
            (p.audio.includes("-uk.mp3") || p.audio.includes("UK_"))
          ) {
            locale = "en-UK";
          } else if (p.audio && p.audio.includes("-au.mp3")) {
            locale = "en-AU";
          }

          const current = bestPhonetics[locale];
          const hasAudio = !!p.audio;
          const hasText = !!p.text;

          if (!current) {
            bestPhonetics[locale] = p;
          } else {
            // Prioritize ones with BOTH text and audio, then ones with audio
            const currentHasAudio = !!current.audio;
            const currentHasText = !!current.text;

            if (hasAudio && hasText && (!currentHasAudio || !currentHasText)) {
              bestPhonetics[locale] = p;
            } else if (hasAudio && !currentHasAudio) {
              bestPhonetics[locale] = p;
            } else if (
              hasAudio &&
              hasText &&
              currentHasAudio &&
              currentHasText
            ) {
              // If both have audio and text, prefer the one that doesn't have "-ca" (Canada) if we are in en-US
              if (
                locale === "en-US" &&
                current.audio.includes("-ca.mp3") &&
                !p.audio.includes("-ca.mp3")
              ) {
                bestPhonetics[locale] = p;
              }
            }
          }
        });

        Object.keys(bestPhonetics).forEach((locale) => {
          const p = bestPhonetics[locale];
          result.phonetics.push({
            text: p.text || "",
            audioUrl: p.audio || "",
            locale: locale,
          });
        });
      }

      return { success: true, data: result };
    }
    return { success: false, message: "No definitions found." };
  } catch (error) {
    console.error("Dictionary API Error:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch from dictionary API",
    };
  }
};
