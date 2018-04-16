const mongoose = require('mongoose');

const { EARTH_RADIUS_IN_KM } = require('../constants');
const geoLocation = require('../services/geoLocation/geoLocation');
const { getIndexOfValue } = require('../helpers/arrayFunctions');
const { ObjectID } = require('mongodb');

const ApartmentSchema = new mongoose.Schema({
    street: {
        type: String,
        minlength: 2,
        maxlength: 30,
        lowercase: true,
        trim: true,
        required: true        
    },
    city: {
        type: String,
        minlength: 2,
        maxlength: 30,
        lowercase: true,
        trim: true,
        required: true
    },
    geolocation: {
        type: [Number],
        index: '2dsphere',
        default: [0, 0]
    },
    ratedCharacteristics:{
        parking: {
            type: number
        },
        publicTransport:  {
            type: number
        },
        noise:  {
            type: number
        },
        commercialServices:  {
            type: number
        },
        upkeep:  {
            type: number
        },
        generalRating:  {
            type: number
        }
   },
    voters: [{
        type: String,
        ref: 'User'
  }],
    reviews: [{
    _createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    createdAt: {
      type: Number,
      required: true
    },
    review: {
      type: String,
      minlength: 10,
      maxlength: 1000,
      required: true
    }
  }],
});

/**
 * the coords array is an array of 2 values:
 * the first one is the longitude and the second is the latitude.
 * radius is the max distance from the coords in units of km.
 *
 * @param {Array} coords
 * @param {Number} radius
 * @returns a mongoose format object for finding apartment in radius
 */
const getGeoWithinObj = (coords, radius) => {
  const kmToRadians = radius / EARTH_RADIUS_IN_KM;
  return {
    $geoWithin: {
      $centerSphere: [
        coords,
        kmToRadians
      ]
    }
  };
};

/**
 * find all the streets in the geo-circle, which is defined by
 * the specified center point and radius.
 *
 * @param {Number} centerLong
 * @param {Number} centerLat
 * @param {Number} radius
 * @returns Promise object.
 */
ReviewSchema.statics.findInRange = function (centerLong, centerLat) {
  const street = this;

  return street.find({
    'geolocation': getGeoWithinObj([centerLong, centerLat], 1)
  });
};

/**
 *
 * @returns string the apartment location as a string.
 */
ApartmentSchema.methods.getAddressString = function () {
  const apartment = this;

  const { address } = apartment.location;
  return `${address.number} ${address.street} ${address.city} ${address.state}`;
};

/**
 * add a new review to a street.
 *
 * @param {ObjectId} _createdBy
 * @param {String} review
 * @param {Number} createdAt
 * @returns Promise object.
 */
ReviewSchema.methods.addComment = function (_createdBy, review, createdAt) {
  const street = this;
  if(street.voters.find(_createdBy)){
      return;
  }
  street.reviews.push({
    _createdBy,
    createdAt,
    review
  });
  street.voters.push(_createdBy);

  return review.save();
};



/**
 * check if the user is interested in the apartment.
 *
 * @param {any} _interestedID
 * @returns true if the user is interested, otherwise false.
 */
ApartmentSchema.methods.isUserInterested = function (_interestedID) {
  const apartment = this;

  const interestedIDIndex = getIndexOfValue(apartment._interested, _interestedID);

  return (interestedIDIndex > -1);
};




const Apartment = mongoose.model('Apartment', ApartmentSchema);

module.exports = {
  Review
};