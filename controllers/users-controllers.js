const uuid = require('uuid/v4');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    const error = new HttpError(
      'ユーザーが見つかりません',
      500
    );
    return next(error);
  }
  res.json({users: users.map(user => user.toObject({ getters: true }))});
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    )
  }
  const { name, email, password } = req.body; 

  let existingUser
  try {
    existingUser = await User.findOne({ email: email })
  } catch (err) {
    const error = new HttpError(
      'サインアップに失敗しました,既にemailが存在しています',
      500
    )
    return next(error);
  };

  const createdUser = new User({
    name: name,
    email: email,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/400px-Empire_State_Building_%28aerial_view%29.jpg',
    password: password,
    places: []
  });

  try {
    await createdUser.save(); //mongoに保存
  } catch (err) {
    const error = new HttpError(
      'データベースに保存できませんでした',
      500
    );
    return next(error)
  }
  res.status(201).json({user: createdUser.toObject({ getters: true })});
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser
  try {
    existingUser = await User.findOne({ email: email })
  } catch (err) {
    const error = new HttpError(
      'ログインに失敗しました,既にemailが存在しています',
      500
    )
    return next(error);
  };

  if(!existingUser || existingUser.password !== password) {
    const error = new HttpError(
      'ログインに失敗しました。emailとpasswordを再入力してください',
      401
    )
    return next(error);
  }

  res.json({message: 'Logged in!'});
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
