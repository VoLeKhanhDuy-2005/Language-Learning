import CefrLevel from '../../models/cefrLevel.model.js';

export const listCefrLevels = async () => {
  return CefrLevel.find().sort({ code: 1 });
};
