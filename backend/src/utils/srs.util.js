export const calculateNextSRS = (lastGrade, currentSrs) => {
  let { easeFactor = 2.5, interval = 0 } = currentSrs || {};

  switch (lastGrade) {
    case 0: //'Again'
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      interval = 0;
      break;
    case 1: //'Hard'
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      interval = interval === 0 ? 1 : Math.round(interval * 1.2);
      break;
    case 2: //'Good'
      // easeFactor giữ nguyên
      interval = interval === 0 ? 3 : Math.round(interval * easeFactor);
      break;
    case 3: //'Easy'
      easeFactor = easeFactor + 0.15;
      interval = interval === 0 ? 5 : Math.round(interval * easeFactor * 1.3);
      break;
  }

  const nextReviewAt = new Date();
  if (interval === 0) {
    nextReviewAt.setMinutes(nextReviewAt.getMinutes() + 10);
  } else {
    nextReviewAt.setDate(nextReviewAt.getDate() + interval);
    nextReviewAt.setHours(0, 0, 0, 0);
  }

  return {
    easeFactor,
    interval,
    lastGrade,
    nextReviewAt,
  };
};
