const errorLogger = (err, req, res, next) => {
  res.locals.error = err;
  next(err);
};

export default errorLogger;
