module.exports = {
  isAdmin: function (req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    res.status(401).json({ msg: 'Unauthorized' });
  },
  isCandidate: function (req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'candidate') {
      return next();
    }
    res.status(401).json({ msg: 'Unauthorized' });
  },
};
