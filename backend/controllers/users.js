const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFoundError = require('../errors/NotFoundError');
const CastError = require('../errors/CastError');
const ValidationError = require('../errors/ValidationError');
const ConflictingRequest = require('../errors/ConflictingRequest');
const UnauthorizedError = require('../errors/UnauthorizedError');

const { NODE_ENV, JWT_SECRET } = process.env;

module.exports.getAllUsers = (req, res, next) => {
  User.find({})
    .then((result) => res.send(result))
    .catch(next);
};

module.exports.getUserById = (req, res, next) => {
  User.findById(req.params.userId)
    .orFail(() => {
      next(new NotFoundError('Ошибка. Пользователь не найден, попробуйте еще раз'));
    })
    .then((result) => {
      if (result) {
        res.send(result);
      } else {
        next(new NotFoundError('Ошибка. Пользователь не найден, попробуйте еще раз'));
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new CastError('Ошибка. Введен некорректный id пользователя'));
      } else {
        next(err);
      }
    });
};

module.exports.createUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;

  User.find({ email })
    .then((response) => {
      if (response.length === 0) {
        bcrypt.hash(password, 10)
          .then((hash) => {
            User.create({
              name, about, avatar, email, password: hash,
            })
              .then((user) => User.findOne({ _id: user._id }))
              .then((user) => {
                res.send(user);
              })
              .catch((err) => {
                if (err.name === 'ValidationError') {
                  next(new ValidationError('Ошибка. При создании пользователя были переданы некорректные данные'));
                } else {
                  next(err);
                }
              });
          });
      } else {
        next(new ConflictingRequest('Ошибка. Пользователь c таким email уже зарегистрирован'));
      }
    })
    .catch((err) => {
      next(err);
    });
};

module.exports.updateUser = (req, res, next) => {
  const { name, about } = req.body;
  User.findByIdAndUpdate(
    req.user._id,
    { name, about },
    { new: true, runValidators: true },
  )
    .then((user) => {
      if (user) {
        res.send(user);
      } else {
        next(new NotFoundError('Ошибка. Пользователь не найден, попробуйте еще раз'));
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new CastError('Ошибка. Введен некорректный id пользователя'));
      } else if (err.name === 'ValidationError') {
        next(new ValidationError('Ошибка. При обновлении данных пользователя были переданы некорректные данные'));
      } else {
        next(err);
      }
    });
};

module.exports.updateUserAvatar = (req, res, next) => {
  const { avatar } = req.body;
  User.findByIdAndUpdate(
    req.user._id,
    { avatar },
    { new: true, runValidators: true },
  )
    .then((user) => {
      if (user) {
        res.send(user);
      } else {
        next(new NotFoundError('Ошибка. Пользователь не найден, попробуйте еще раз'));
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new CastError('Ошибка. Переданы некорректные данные'));
      } else {
        next(err);
      }
    });
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign(
        { _id: user._id },
        NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret',
        { expiresIn: '7d' },
      );
      res.send({ token });
    })
    .catch(() => {
      next(new UnauthorizedError('Почта или пароль введены неправильно'));
    });
};

module.exports.getCurrentUserInfo = (req, res, next) => {
  const userId = req.user._id;
  User.findOne({ _id: userId })
    .then((user) => {
      if (user) {
        res.send(user);
      } else {
        next(new NotFoundError('Ошибка. Пользователь не найден, попробуйте еще раз'));
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new CastError('Ошибка. Переданы некорректные данные'));
      } else {
        next(err);
      }
    });
};
