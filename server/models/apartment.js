const mongoose = require('mongoose');
const _ = require('lodash');

const {
  EARTH_RADIUS_IN_KM
} = require('../constants');
const geoLocation = require('../services/geoLocation/geoLocation');
const {
  removeFalsyProps
} = require('../helpers/removeFalsyProps');
const {
  isSupportedTagId
} = require('./tag');
const {
  getIndexOfValue,
  getIndexOfFirstElementMatchKey
} = require('../helpers/arrayFunctions');
const {
  ObjectID
} = require('mongodb');
const visit = require('./visit');
const { Group } = require('./group');
const errors = require('../errors');

const ApartmentSchema = new mongoose.Schema({
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
  entranceDate: {
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
      validator: value => isSupportedTagId(value),
      message: '{VALUE} is not a supported tag'
    }
  }],
  requiredRoommates: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  totalRoommates: {
    type: Number,
    min: 0,
    max: 11
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
      minlength: 1,
      maxlength: 1000,
      required: true
    }
  }],
  _notificationSubscribers: {
    type: [mongoose.Schema.Types.ObjectId]
  },
  visits: [{
    _askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    createdAt: {
      type: Number,
      required: true
    },
    scheduledTo: {
      type: Number,
      required: true,
      validate: {
        validator: value => value > Date.now(),
        message: '{VALUE} is not a future date'
      }
    },
    status: {
      type: Number,
      required: true,
      validate: {
        validator: value => visit.isSupportedVisitStatusID(value),
        message: '{VALUE} is not a valid visit status'
      }
    },
  }],
  groups: [Group]
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
      $centerSphere: [coords, kmToRadians]
    }
  };
};

/**
 * find all the apartments in the geo-circle, which is defined by
 * the specified center point and radius.
 *
 * @param {Number} centerLong
 * @param {Number} centerLat
 * @param {Number} radius
 * @returns Promise object.
 */
ApartmentSchema.statics.findInRange = function (centerLong, centerLat, radius) {
  const Apartment = this;

  return Apartment.find({
    'location.geolocation': getGeoWithinObj([centerLong, centerLat], radius)
  });
};

/**
 * find all the apartments with the listed ids.
 *
 * @param {Array} listIds
 * @returns Promise object.
 */
ApartmentSchema.statics.findAllByIds = function (listIds) {
  const Apartment = this;

  return Apartment.find({
    _id: {
      $in: listIds
    }
  });
};

/**
 * @updatedBy: Alon Talmor
 * @date: 17/04/18
 *
 * The function now supports the new schema by which is should fetch all relevant apartments.
 * receives an object which contains all the properties to filter by.
 * properties are:
 * @prop: id - should be a String or a List of a legal ObjectID
 * @prop: createdBy, - should be a String of a legal ObjectID
 * @prop: entranceDate - A value which can be converted into Date
 * @prop: address - String of the full address
 * @prop: radius - Number, which indicates the range from the address or geolocation
 * @prop: price -  Array of 2 Numbers, which indicates the price range
 * @prop: roommates - Array of 2 Numbers, which indicates the roommates range
 * @prop: floor - Array of 2 Numbers, which indicates the floor range
 * @prop: tags - Array of the tags Numbers (ids)
 * @prop: geolocation - Array of 2 numbers: ['longitude','latitude']
 * @returns Promise Object with a list of all relevant apartments.
 *
 * @updatedBy: Alon Talmor
 * @date: 14/05/18
 * Allow id to be a List of ids or a String of one id.
 */
ApartmentSchema.statics.findByProperties = async function (p) {
  const Apartment = this;

  const query = {};
  if (p.id && (_.isArray(p.id) || ObjectID.isValid(p.id))) {
    // id
    const ids = _.castArray(p.id);
    query._id = {
      $in: ids
    };
  }
  if (p.createdBy && ObjectID.isValid(p.createdBy)) {
    // createdBy
    query._createdBy = p.createdBy;
  }
  if (p.entranceDate) {
    // entranceDate
    query.entranceDate = {
      $lte: new Date(p.entranceDate).getTime()
    };
  }
  const radius = +p.radius || 5; //km //address + geolocation + radius
  if (p.geolocation) {
    // find by geolocation first
    query['location.geolocation'] = getGeoWithinObj(p.geolocation, radius);
  } else if (p.address) {
    // find by address if geolocation is not defined
    const geolocation = await geoLocation.getGeoLocationCoords(p.address);
    if (!geolocation) {
      return new Promise(resolve => resolve([]));
    }
    query['location.geolocation'] = getGeoWithinObj(geolocation, radius);
  }
  if (p.price && Array.isArray(p.price)) {
    // price
    query.price = removeFalsyProps({
      $gte: p.price[0],
      $lte: p.price[1]
    });
  }
  if (p.roommates && Array.isArray(p.roommates)) {
    // roommates
    query.totalRoommates = removeFalsyProps({
      $gte: p.roommates[0],
      $lte: p.roommates[1]
    });
  }
  if (p.floor && Array.isArray(p.floor)) {
    // floor
    query.floor = removeFalsyProps({
      $gte: p.floor[0],
      $lte: p.floor[1]
    });
  }
  if (p.tags && Array.isArray(p.tags)) {
    // tags
    query.tags = {
      $all: p.tags
    };
  }
  return Apartment.find(query);
};

/**
 *
 * @returns string the apartment location as a string.
 */
ApartmentSchema.methods.getAddressString = function () {
  const apartment = this;

  const {
    address
  } = apartment.location;
  return `${address.number} ${address.street} ${address.city} ${address.state}`;
};

/**
 * add a new comment to an apartment.
 *
 * @param {ObjectId} _createdBy
 * @param {String} text
 * @param {Number} createdAt
 * @returns Promise object.
 */
ApartmentSchema.methods.addComment = function (_createdBy, text, createdAt) {
  const apartment = this;

  apartment.comments.unshift({
    _createdBy,
    createdAt,
    text
  });

  return apartment.save();
};

/**
 * @author: Alon Talmor
 * @date: 6/5/18
 *
 * @returns: true or false whether it is time to create a group.
 */
ApartmentSchema.methods.isTimeToOpenGroup = function () {
  const apartment = this;

  return apartment._interested.length >= apartment.requiredRoommates;
};

/**
 * add an interested user to the apartment's interested list.
 *
 * @param {ObjectId} _interestedID
 * @returns Promise object.
 */
ApartmentSchema.methods.addInterestedUser = function (_interestedID) {
  const apartment = this;

  apartment._interested.push(_interestedID);
  return apartment.save();
};

/**
 * @author: Omri Huller
 * @updatedBy: Alon Talmor
 * @date:6/5/18
 *
 * Created a new group.
 * - This methods creates a group by receiving a list of ids.
 * - if the received object is not a list then it creates the a group that best
 * matches the id received as parameter.
 * The candidates for matching are other users which are also interested in the apartment.
 *
 * @param: List of ObjectIDs that will be the members of the new group
 *         or String of ObjectID of the user to create a group by best matching
 * @returns: Promise containing the new updated apartment object.
 */
ApartmentSchema.methods.createGroup = function (id) {
  const apartment = this;

  let members;
  // if (!interested.includes(_interestedID)) {
  //   interested[0] = _interestedID;
  // }
  if (_.isArray(id) && id.every($ => ObjectID.isValid($))) {
    if (id.length !== apartment.requiredRoommates) {
      return Promise.reject(errors.groupCreationFailed);
    }
    members = id;
  } else if (_.isString(id) && ObjectID.isValid(id)) {
    members = apartment._interested.slice(0, apartment.requiredRoommates);
    members[0] = id;
  } else {
    return Promise.reject(errors.groupCreationFailed);
  }
  members = members.map($ => ({ id: $ }));
  // create new group
  const group = {
    members,
    _apartmentId: apartment._id,
  };
  apartment.groups.push(group);
  return apartment.save();
};

/**
 * @author: Alon Talmor
 * @date: 6/5/18
 *
 * This method finds the appropriate group and updates the status of the specified member.
 * Properties available:
 * @param groupId - the id of the group to update.
 * @param memberId - the id of the member to update.
 * @param status - the new status of the member.
 * @returns Promise object which includes the updated apartment
 * @throws groupNotFound exception if the group does not exist.
 * @throws userNotFound exception if the user in not a member of the group.
 */
ApartmentSchema.methods.updateMemberStatus = function (groupId, memberId, status) {
  const apartment = this;

  const group = apartment.groups.id(groupId);
  if (!group) {
    return Promise.reject(errors.groupNotFound);
  }
  group.updateStatus(memberId, status);
  return apartment.save();
};

/**
 * @author: Alon Talmor
 * @date: 16/6/18
 *
 * find the group specified by the groupId and change its status to be "signed".
 * @param groupId - should be a valid group id.
 * @returns Promise object containing the updated apartment.
 * @throws  groupNotFound exception if the group does not exist.
 */
ApartmentSchema.methods.signGroup = function (groupId) {
  const apartment = this;

  const group = apartment.groups.id(groupId);
  if (!group) {
    return Promise.reject(errors.groupNotFound);
  }
  group.sign();
  return apartment.save();
};

/**
 * remove the interested user from the apartment's interested list.
 *
 * @param {ObjectId} _interestedID
 * @returns Promise object.
 */
ApartmentSchema.methods.removeInterestedUser = function (_interestedID) {
  const apartment = this;

  const interestedIDIndex = getIndexOfValue(
    apartment._interested,
    _interestedID
  );
  if (interestedIDIndex > -1) {
    apartment._interested.splice(interestedIDIndex, 1);
  }

  apartment.groups = apartment.groups.filter($ => !$.members.some(m => m.id.equals(_interestedID)));

  return apartment.save();
};

/**
 * check if the user is interested in the apartment.
 *
 * @param {any} _interestedID
 * @returns true if the user is interested, otherwise false.
 */
ApartmentSchema.methods.isUserInterested = function (_interestedID) {
  const apartment = this;

  const interestedIDIndex = getIndexOfValue(
    apartment._interested,
    _interestedID
  );

  return interestedIDIndex > -1;
};
/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Returns the index of the subscriber id inside the inner data structure
 *
 * @param {objectID} _userID: the id of the user to get his index.
 *
 * @returns {Number} indicating the index of the user or -1 if not found
 */
ApartmentSchema.methods.getIndexOfSubscriberUser = function (_subscriberID) {
  const apartment = this;

  let index = -1;

  for (let i = 0; i < apartment._notificationSubscribers.length; i++) {
    if (apartment._notificationSubscribers[i].equals(_subscriberID)) index = i;
  }

  return index;
};
/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * check if the given user is a subscriber of the apartment ad i.e. he is notified about changes in the apartment ad.
 *
 * @param {objectID} _userID: the id of the user to check.
 *
 * @returns {Boolean} indicating whether the given user is a subscriber of the ad or not.
 */
ApartmentSchema.methods.isUserSubscriber = function (_userID) {
  const apartment = this;

  return apartment.getIndexOfSubscriberUser(_userID) > -1;
};
/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Adds the given user as a subscriber of the apartment ad i.e. he will be notified about changes in the apartment ad.
 *
 * @param {objectID} _userID: the id of the user to add.
 *
 * @returns {Promise} that resolved once the apartment document is updated in DB with the new subscriber.
 */
ApartmentSchema.methods.saveSubscriber = function (_subscriberID) {
  const apartment = this;

  if (!apartment.isUserSubscriber(_subscriberID)) {
    apartment._notificationSubscribers.push(_subscriberID);
  }

  return apartment.save();
};
/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Removes the given user from the subscriber of the apartment ad i.e. he will not be notified about changes in the apartment ad anymore.
 *
 * @param {objectID} _userID: the id of the user to remove.
 *
 * @returns {Promise} that resolved once the apartment document is updated in DB withot the deleted subscriber.
 */
ApartmentSchema.methods.deleteSubscriber = function (_subscriberID) {
  const apartment = this;

  const subscriberIndex = apartment.getIndexOfSubscriberUser(_subscriberID);

  if (subscriberIndex > -1) {
    apartment._notificationSubscribers.splice(subscriberIndex, 1);
  }

  return apartment.save();
};
/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Check whether the given user ID is the owner of the apartment
 *
 * @param {ObjectID} _userID: the ID of the user to check
 *
 * @returns {Boolean} indicating whether the given ID is the owner of the apartment.
 */
ApartmentSchema.methods.isOwner = function (_userID) {
  const apartment = this;

  return _userID.equals(apartment._createdBy);
};
/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Adds a new visit request to the apartment with the status of pending the owner and date now. Invariant: User can't have 2 future visits.
 *
 * @param {ObjectId} _visitorID: the ID of the user requested the visit
 * @param {Number} schedTo: the requested time for the visit
 *
 * @returns {Promise} that resolved once the visit was added to the apartment.
 */
ApartmentSchema.methods.addNewVisit = function (_visitorID, schedTo) {
  const apartment = this;

  if (
    apartment.isFutureVisitPlanned(_visitorID, Date.now()) ||
    !visit.canAddVisit(apartment.isOwner(_visitorID))
  ) {
    return Promise.reject();
  }
  return apartment.saveNewVisit(
    _visitorID,
    Date.now(),
    schedTo,
    visit.getVisitStatusOnCreate()
  );
};

/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Updates an existing visit request with the given status and sched to
 *
 * @param {ObjectId} _visitID: the ID of the visit document.
 * @param {ObjectId} _offeringUserID: the ID of the user who triggered the visit modification.
 * @param {Number} targetStatus: the new requested status of the visit.
 * @param {Number} schedTo: the requested time for the visit.
 *
 * @returns {Promise} that resolved once the visit was modified.
 */
ApartmentSchema.methods.updateVisit = function (
  _visitID,
  _offeringUserID,
  targetStatus,
  schedTo
) {
  const apartment = this;

  return apartment.updateVisitProps(
    _visitID,
    _offeringUserID, ['scheduledTo', 'status'], [schedTo, targetStatus]
  );
};

/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Adds a new visit request to the apartment.
 *
 * @param {ObjectId} _visitorID: the ID of the user who would like to visit in the apartment.
 * @param {Number} createdAt: time representing the creartion of the visit request.
 * @param {Number} schedTo: the requested time for the visit.
 * @param {Number} status: the status of the visit to be added.
 *
 * @returns {Promise} that resolved once the visit was added.
 */
ApartmentSchema.methods.saveNewVisit = function (
  _askedBy,
  createdAt,
  scheduledTo,
  status
) {
  const apartment = this;

  apartment.visits.push({
    _askedBy,
    createdAt,
    scheduledTo,
    status
  });

  return apartment.save();
};
/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Updates an existing visit request  according to the given parameters
 *
 * @param {ObjectId} _visitID: the ID of the visit document.
 * @param {ObjectId} _offeringUserID: the ID of the user who triggered the visit modification.
 * @param {Array} propNames: an array of the visit properties names to be modified.
 * @param {Array} propValues: an array of the new data to be set - the value at pos i is for property i in the propNames array.
 *
 * @returns Promise object that resolved once the visit was modified.
 */
ApartmentSchema.methods.updateVisitProps = function (
  _visitID,
  _offeringUserID,
  propNames,
  propValues
) {
  const apartment = this;

  const visitIndex = getIndexOfFirstElementMatchKey(apartment.visits, '_id', _visitID.toString());
  if (visitIndex < 0) {
    return Promise.reject();
  }

  if (!apartment.isLegalVisitChange(
    apartment.visits[visitIndex],
    _offeringUserID,
    propNames,
    propValues
  )) {
    return Promise.reject();
  }

  for (let i = 0; i < propNames.length; i++) {
    apartment.visits[visitIndex][propNames[i]] = propValues[i];
  }

  return apartment.save();
};
/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Validates the ability of the visit to be set with the new given parameters.
 *
 * @param {Object} visitData: the relevant visit document.
 * @param {ObjectId} _offeringUserID: the ID of the user who would like to change the visit.
 * @param {Array} propNames: an array of the visit properties names to be modified.
 * @param {Array} propValues: an array of the new data to be set - the value at pos i is for property i in the propNames array.
 *
 * @returns {Boolean} indicating whether the change is valid.
 */
ApartmentSchema.methods.isLegalVisitChange = function (
  visitData,
  _offeringUserID,
  propNames,
  propValues
) {
  const apartment = this;

  if (!visit.canModifyVisit(
    apartment._createdBy,
    visitData._askedBy,
    _offeringUserID
  )) {
    return false;
  }

  for (let i = 0; i < propNames.length; i++) {
    switch (propNames[i]) {
      case 'status':
        if (!visit.isValidVisitStatusChange(visitData.status, propValues[i], apartment.isOwner(_offeringUserID))) {
          return false;
        }
        break;
      default:
    }
  }

  return true;
};

/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Check whether the user has a visit after the provided date which is not canceled
 *
 * @param {ObjectId} _userID: the ID of the user you would like to check his vistis.
 * @param {Number} date: the base date that any following date is considered as future.
 *
 * @returns {Boolean} indicating whether there is a furture visit for the user (i.e. which is planned to be after the given date).
 */
ApartmentSchema.methods.isFutureVisitPlanned = function (_userID, date) {
  const apartment = this;

  let futureVisitExist = false;
  apartment.visits.forEach((visitData) => {
    if (
      visitData._askedBy.equals(_userID) &&
      visitData.status !== visit.getVisitStatusOnCancelation() &&
      visitData.scheduledTo > date
    ) {
      futureVisitExist = true;
    }
  });

  return futureVisitExist;
};

/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Gets the visit document with the given ID
 *
 * @param {ObjectID} _visitID: the requested visit document ID.
 *
 * @returns {Object} comtaining the visit schema.
 */
ApartmentSchema.methods.getVisitDataById = function (_visitID) {
  const apartment = this;

  const visitIndex = getIndexOfFirstElementMatchKey(apartment.visits, '_id', _visitID.toString());

  if (visitIndex < 0) {
    return {};
  }

  return apartment.visits[visitIndex];
};

const Apartment = mongoose.model('Apartment', ApartmentSchema);

module.exports = {
  Apartment
};