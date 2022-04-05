const Card = require('../models/card');
const NotFoundError = require('../errors/NotFoundError');
const CastError = require('../errors/CastError');
const ValidationError = require('../errors/ValidationError');
const ForbiddenError = require('../errors/ForbiddenError');

module.exports.getAllCards = (req, res, next) => {
  Card.find({}).sort({ createdAt: -1 })
    .then((result) => res.send(result))
    .catch(next);
};

module.exports.createCard = (req, res, next) => {
  const { name, link } = req.body;
  console.log(name, link);
  Card.create({ name, link, owner: req.user._id })
    .then((card) => {
      res.send(card);
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new ValidationError('Ошибка. При создании карточки были переданы некорректные данные'));
      } else {
        next(err);
      }
    });
};

module.exports.deleteCard = (req, res, next) => {
  Card.findById(req.params.cardId)
    .then((card) => {
      if (card) {
        const cardOwner = card.owner.toString().replace('new ObjectId("', '');
        if (req.user._id === cardOwner) {
          Card.findByIdAndRemove(req.params.cardId)
            .then((result) => {
              res.send(result);
            })
            .catch((err) => {
              if (err.name === 'CastError') {
                next(new CastError('Ошибка. Введен некорректный id карточки'));
              } else {
                next(err);
              }
            });
        } else {
          next(new ForbiddenError('Отстутствуют права на удаление чужой карточки'));
        }
      } else {
        next(new NotFoundError('Ошибка. Карточка не найдена, попробуйте еще раз'));
      }
    })
    .catch((err) => {
      if (err.name === 'DocumentNotFoundError') {
        next(new NotFoundError('Ошибка. Карточка не найдена, попробуйте еще раз'));
      } else {
        next(err);
      }
    });
};

module.exports.likeCard = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } },
    { new: true },
  )
    .then((card) => {
      if (card) {
        res.send(card);
      } else {
        next(new NotFoundError('Ошибка. Карточка не найдена, попробуйте еще раз'));
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new CastError('Ошибка. Введен некорректный id карточки'));
      } else {
        next(err);
      }
    });
};

module.exports.dislikeCard = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } },
    { new: true },
  )
    .then((card) => {
      if (card) {
        res.send(card);
      } else {
        next(new NotFoundError('Ошибка. Карточка не найдена, попробуйте еще раз'));
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new CastError('Ошибка. Введен некорректный id карточки'));
      } else {
        next(err);
      }
    });
};
