module.exports = (fn) => {
  return (req, res, next) => {
    // This function will catch the error and pass it to the next middleware.
    fn(req, res, next).catch((err) => next(err));
  };
};
