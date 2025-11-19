const User = require('../models/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');

exports.register = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    user = new User({
      username,
      password,
      role,
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ msg: 'Server error during login' });
    }
    if (!user) {
      console.log('Login failed:', info);
      return res.status(400).json({ msg: info?.message || 'Invalid credentials' });
    }
    req.logIn(user, err => {
      if (err) {
        console.error('Session error:', err);
        return res.status(500).json({ msg: 'Failed to create session' });
      }
      res.json({
        msg: 'Logged in successfully',
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          testStatus: user.testStatus,
        },
      });
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ msg: 'Logout failed' });
    }
    res.json({ msg: 'Logged out successfully' });
  });
};

exports.getCurrentUser = (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        role: req.user.role,
        testStatus: req.user.testStatus,
      },
    });
  } else {
    res.status(401).json({ msg: 'Not authenticated' });
  }
};
