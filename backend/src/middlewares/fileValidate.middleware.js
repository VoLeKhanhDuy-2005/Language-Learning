import multer from 'multer';
import AppError from '../utils/AppError.js';
import { FILE } from '../constants/codes/index.js';

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, fileFilterCallback) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      fileFilterCallback(null, true);
    } else {
      fileFilterCallback(new AppError(FILE.INVALID_IMAGE_FORMAT, 400), false);
    }
  },
});

export const validateAvatar = (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(FILE.FILE_TOO_LARGE, 400));
      }
      return next(new AppError(FILE.INVALID_IMAGE_FORMAT, 400));
    } else if (err) {
      return next(err);
    }
    next();
  });
};
