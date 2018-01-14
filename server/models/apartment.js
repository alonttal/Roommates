const mongoose = require('mongoose');
const _ = require('lodash');

const { EARTH_RADIUS_IN_KM } = require('../constants');
const geoLocation = require('../services/geoLocation/geoLocation');
const { removeFalsyProps } = require('../helpers/removeFalsyProps');
const { isSupportedTagId } = require('./tag');
const { getIndexOfValue } = require('../helpers/arrayFunctions');

const ApartmentSchema = new mongoose.Schema({
    title: {
        type: String,
        min: 4,
        max: 35,
        required: true
    },
    _createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    createdAt: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        min: 0,
        required: true
    },
    _interested: [{
        type: String,
        ref: 'User'
    }],
    enteranceDate: {
        type: Number,
        required: true
    },
    location: {
        address: {
            state: {
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
            street: {
                type: String,
                minlength: 2,
                maxlength: 30,
                lowercase: true,
                trim: true,
                required: true
            },
            number: {
                type: Number,
                min: 1,
                max: 10000,
                required: true
            },
            apartmentNumber: {
                type: Number,
                min: 1,
                max: 1000
            }
        },
        geolocation: {
            type: [Number],
            index: '2dsphere',
            default: [0, 0]
        }
    },
    numberOfRooms: {
        type: Number,
        min: 1,
        max: 20
    },
    floor: {
        type: Number,
        min: -2,
        max: 300
    },
    totalFloors: {
        type: Number,
        min: 0,
        max: 300
    },
    area: {
        type: Number,
        min: 0,
        max: 1000
    },
    images: [{
        type: String,
        default: ''
    }],
    description: {
        type: String,
        default: ''
    },
    tags: [{
        type: Number,
        validate: {
            validator: (value) => isSupportedTagId(value),
            message: '{VALUE} is not a supported tag'
        }
    }],
    requiredNumberOfRoommates: {
        type: Number,
        min: 1,
        max: 10,
        required: true
    },
    currentlyNumberOfRoommates: {
        type: Number,
        min: 0,
        max: 10
    },
    comments: [{
        _createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        createdAt: {
            type: Number,
            required: true
        },
        text: {
            type: String,
            minlength: 10,
            maxlength: 1000,
            required: true
        }
    }]
});

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

ApartmentSchema.statics.findInRange = function (centerLong, centerLat, radius) {
    const Apartment = this;

    return Apartment.find({
        'location.geolocation': getGeoWithinObj([centerLong, centerLat], radius)
    });
};

ApartmentSchema.statics.findAllByIds = function (listIds) {
    const Apartment = this;

    return Apartment.find({ _id: { $in: listIds } });
};

//TODO: add the rest of properties
//_id, _createdBy, fromPrice, toPrice, entranceDate, address, latitude, longitude, radius, minRoommates, maxRoommates, floor
ApartmentSchema.statics.findByProperties = async function (p) {
    const Apartment = this;

    let price;
    if (p.minPrice || p.maxPrice) {
        price = removeFalsyProps({ $gte: p.minPrice, $lte: p.maxPrice });
    }

    let entranceDate;
    if (p.latestEntranceDate) {
        entranceDate = removeFalsyProps({ $lte: p.latestEntranceDate });
    }

    let roommates;
    if (p.minRoommates || p.maxRoommates) {
        roommates = removeFalsyProps({ $gte: p.minRoommates, $lte: p.maxRoommates });
    }

    let geolocation;
    if (p.latitude && p.longitude) {
        const coords = [p.longitude, p.latitude];
        geolocation = p.radius ? getGeoWithinObj(coords, p.radius) : coords;
    } else if (p.address) {
        geolocation = await geoLocation.getGeoLocationCoords(p.address);
        if (!geolocation) {
            return new Promise((resolve) => resolve([]));
        }
        geolocation = p.radius ? getGeoWithinObj(geolocation, p.radius) : geolocation;
    }

    let floor;
    if (p.minFloor || p.maxFloor) {
        floor = removeFalsyProps({ $gte: p.minFloor, $lte: p.maxFloor });
    }

    const properties = removeFalsyProps({
        _id: p._id,
        _createdBy: p._createdBy,
        price: price,
        enteranceDate: entranceDate,
        'location.geolocation': geolocation,
        numOfRooms: roommates,
        currentlyNumberOfRoommates: p.currentRoommatesNumber,
        floor: floor
    });

    return Apartment.find(properties);
};

ApartmentSchema.methods.getAddressString = function () {
    const apartment = this;

    const { address } = apartment.location;
    return `${address.number} ${address.street} ${address.city} ${address.state}`;
};

ApartmentSchema.methods.addComment = function (_createdBy, text, createdAt) {
    const apartment = this;

    apartment.comments.push({
        _createdBy,
        createdAt,
        text
    });

    return apartment.save();
};

ApartmentSchema.methods.addInterestedUser = function (_interestedID) {
    const apartment = this;

    apartment._interested.push(_interestedID);

    return apartment.save();
};

ApartmentSchema.methods.removeInterestedUser = function (_interestedID) {
    const apartment = this;

    const interestedIDIndex = getIndexOfValue(apartment._interested, _interestedID);
    if (interestedIDIndex > -1) {
        apartment._interested.splice(interestedIDIndex, 1);
    }

    return apartment.save();
};

ApartmentSchema.methods.isUserInterested = function (_interestedID) {
    const apartment = this;

    const interestedIDIndex = getIndexOfValue(apartment._interested, _interestedID);

    return (interestedIDIndex > -1);
};

const Apartment = mongoose.model('Apartment', ApartmentSchema);

module.exports = {
    Apartment
};