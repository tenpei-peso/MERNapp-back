const uuid = require('uuid/v4');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');
const mongooseUniqueValidator = require('mongoose-unique-validator');

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }
  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      '情報を取得できませんでした',
      500
    );
    return next(error);
  }

  res.json({ place: place.toObject( {getters: true}) }); // => { place } => { place: place }
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let places;

  try {
    places = await Place.find({creator: userId});
  } catch (err) {
    const error = new HttpError(
      '情報を取得できませんでした',
      500
    );
    return next(error);
  }

  res.json({ places: places.map(place => place.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress();
  } catch (error) {
    return next(error);
  }

  // const title = req.body.title;
  const createdPlace = new Place({
    title: title,
    description: description,
    address: address,
    location: coordinates,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/400px-Empire_State_Building_%28aerial_view%29.jpg',
    creator: creator
  });

  let user;
  
  try {
    user = await User.findById(creator)
  } catch (err) {
    const error = new HttpError(
      'データが見つかりませんでした',
      500
    );
    return next(error)
  }

  try {
    await createdPlace.save(); //mongoに保存
    user.places.push(createdPlace);
    await user.save();
  } catch (err) {
    const error = new HttpError(
      'データベースに保存できませんでした',
      500
    );
    return next(error)
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    )
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      '情報を取得できませんでした',
      500
    );
    return next(error);
  }
  place.title = title;
  place.description = description;

  try {      //書き換えた情報をもう一回DBに格納
    await place.save();
  } catch (err) {
    const error = new HttpError(
      '情報を取得できませんでした',
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  
  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'place情報を取得できませんでした',
      500
    );
    return next(error);
  }

  if(!place) {
    const error = new HttpError(
      'placeがありません',
      500
    )
  }
  console.log(place)

  try {
    place.creator.places.pull(place)
    await place.creator.save({})
    await place.remove()
  } catch (err) {
    const error = new HttpError(
      '削除に失敗しました',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Deleted place.' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
