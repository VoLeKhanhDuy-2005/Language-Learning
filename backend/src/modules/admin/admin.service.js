import User from '../../models/user.model.js';
import Lesson from '../../models/lesson.model.js';
import Deck from '../../models/deck.model.js';
import UserLessonProgress from '../../models/userLessonProgress.model.js';
import UserCardState from '../../models/userCardState.model.js';

export const getDashboardMetrics = async () => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const totalLessons = await Lesson.countDocuments();
  const totalDecks = await Deck.countDocuments({ ownerType: 'system' });

  // User registration chart (12 tháng trước)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);
  const userChartRaw = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 },
    },
  ]);

  // Format chart data
  const userRegistrationChart12Months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1); // Đặt ngày thành 1 để tránh lỗi tràn ngày khi tháng tiếp theo có ít ngày hơn (Tránh 31 về 29 -> Tháng 2 thành tháng 3 => 2 tháng 3)
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // +1 do Date.getMonth() trả về tháng bắt đầu từ 0
    const record = userChartRaw.find(
      (r) => r._id.year === year && r._id.month === month
    );
    userRegistrationChart12Months.push({
      label: `${month}/${year}`,
      count: record ? record.count : 0,
    });
  }
  const userRegistrationChart6Months = userRegistrationChart12Months.slice(-6);

  const popularLessonsRaw = await UserLessonProgress.aggregate([
    {
      $group: {
        _id: '$lessonId',
        userCount: { $sum: 1 },
      },
    },
    { $sort: { userCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'lessons',
        localField: '_id',
        foreignField: '_id',
        as: 'lesson',
      },
    },
    { $unwind: '$lesson' },
    //biến array lesson: [{ _id: "l1", title: "A" }] thành object lesson: { _id: "l1", title: "A" }
    {
      $project: {
        _id: '$lesson._id',
        title: '$lesson.title',
        slug: '$lesson.slug',
        thumbnailUrl: '$lesson.thumbnailUrl',
        userCount: 1, //userCount (1 = giữ nguyên)
      },
    },
  ]);

  const popularDecksRaw = await UserCardState.aggregate([
    {
      $group: {
        _id: { deckId: '$deckId', userId: '$userId' },
      },
    },
    {
      $group: {
        _id: '$_id.deckId',
        userCount: { $sum: 1 },
      },
    },
    { $sort: { userCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'decks',
        localField: '_id',
        foreignField: '_id',
        as: 'deck',
      },
    },
    { $unwind: '$deck' },
    {
      $project: {
        _id: '$deck._id',
        title: '$deck.title',
        slug: '$deck.slug',
        coverImage: '$deck.coverImage',
        cardCount: '$deck.cardCount',
      },
    },
  ]);

  // Recent content
  const recentLessons = await Lesson.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('_id title slug status createdAt');

  const recentDecks = await Deck.find({ ownerType: 'system' })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('_id title slug status createdAt');
  return {
    totalUsers,
    activeUsers,
    totalLessons,
    totalDecks,
    userRegistrationChart6Months,
    userRegistrationChart12Months,
    popularLessons: popularLessonsRaw,
    popularDecks: popularDecksRaw,
    recentContent: {
      lessons: recentLessons,
      decks: recentDecks,
    },
  };
};
