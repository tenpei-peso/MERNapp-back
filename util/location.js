const axios = require('axios');

const HttpError = require('../models/http-error');

async function getCoordsForAddress () {
  const response = {
    lat: 40.7484474,
    lng: -73.9871516
  };

  const data = response;

  if (!data || data.status === 'ZERO_RESULTS') {
    const error = new HttpError(
      'Could not find location for the specified address.',
      422
    );
    throw error;
  }

  const coordinates = data

  return coordinates;
}

module.exports = getCoordsForAddress;
