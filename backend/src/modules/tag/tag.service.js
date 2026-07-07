import Tag from '../../models/tag.model.js';
import Lesson from '../../models/lesson.model.js';
import Deck from '../../models/deck.model.js';
import AppError from '../../utils/AppError.js';
import { TAG, COMMON, ADMIN } from '../../constants/codes/index.js';
import { generateSlug } from '../../utils/generate.js';

export const listTags = async ({ usedBy } = {}) => {
  // No filter show the full tag vocabulary.
  if (!usedBy) {
    return Tag.find().sort({ label: 1 });
  }

  let tagIds;
  if (usedBy === 'lesson') {
    tagIds = await Lesson.find({ status: 'published' }).distinct('tagIds');
  } else {
    tagIds = await Deck.find({
      ownerType: 'system',
      status: 'published',
    }).distinct('tagIds');
  }

  return Tag.find({ _id: { $in: tagIds } }).sort({ label: 1 });
};

export const getTagById = async (id) => {
  const level = await Tag.findById(id);
  if (!level) {
    throw new AppError(TAG.TAG_NOT_FOUND, 404);
  }
  return level;
};

const checkDuplicateTag = async (payload, excludeId = null) => {
  const { label } = payload;

  const conditions = [];
  if (label) {
    conditions.push({ label });
  } else {
    throw new AppError(ADMIN.TAG_LABEL_REQUIRED, 400);
  }
  const query = {
    $or: conditions,
  };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await Tag.findOne(query);
  if (existing) {
    throw new AppError(TAG.TAG_LABEL_EXISTS, 409);
  }
};

export const createTag = async (payload) => {
  await checkDuplicateTag(payload);
  payload.code = generateSlug(payload.label);
  return Tag.create(payload);
};

export const updateTag = async (id, payload) => {
  const level = await Tag.findById(id);
  if (!level) {
    throw new AppError(TAG.TAG_NOT_FOUND, 404);
  }
  await checkDuplicateTag(payload, id);
  payload.code = generateSlug(payload.label);
  Object.assign(level, payload);
  //copy tất cả thuộc tính trong payload vào object level
  //(ghi đè các field trùng tên, field cũ không ghi đè thì giữ nguyên)

  return level.save();
};

export const deleteTag = async (id) => {
  const level = await Tag.findByIdAndDelete(id); //trả về document vừa bị xóa
  if (!level) {
    throw new AppError(TAG.TAG_NOT_FOUND, 404);
  }
  return level;
};
