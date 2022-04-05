// require('dotenv').config();
const jwt = require('jsonwebtoken');
const UnauthorizedError = require('../errors/UnauthorizedError');

// const { JWT_SECRET } = process.env;

module.exports = (req, res, next) => {
  const { authorization } = req.headers;
  console.log('req.headers', req.headers);
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Для совершения действия вы должны пройти авторизацию'));
  }

  const token = authorization.replace('Bearer ', '');
  console.log('token', token);
  let payload;

  try {
    payload = jwt.verify(token, 'some-secret-key');
  } catch (err) {
    next(new UnauthorizedError('Для совершения действия вы должны пройти авторизацию'));
  }

  req.user = payload;
  return next();
};
