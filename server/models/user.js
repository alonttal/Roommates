const mongoose = require('mongoose');
const _ = require('lodash');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ObjectID } = require('mongodb');

const { isSupportedHobbieId } = require('./hobbie');
const {
  NotificationSchema,
  addAggregationDataInNotification
} = require('./notification');
const { PrivateMessageSchema, wasPrivateMessageWrittenByParticipants, setPrivateMessageReadState, getPrivateMessageCreationTime } = require('./privateMessage');
const { getMatchScore } = require('../logic/matcher');
const arrayFunctions = require('../helpers/arrayFunctions');
const { XAUTH, XAUTH_EXPIRATION_TIME } = require('../constants');
const {
  invalidCredentials,
  emailInUse,
  PasswordResetFailure
} = require('../errors');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    minlength: 2,
    trim: true,
    required: true
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
  },
  birthdate: {
    type: Number,
    min: new Date('1900-01-01').getTime(),
    validate: {
      validator: value => value <= Date.now() - (18 * 365 * 24 * 60 * 60 * 1000), // Users must be at least 18
      message: 'birthdate: {VALUE} is more than maximum allowed value'
    },
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    lowercase: true,
    required: true
  },
  mobilePhone: {
    type: String,
    trim: true,
    validate: {
      validator: value =>
        validator.isMobilePhone(value, 'he-IL') || value === '',
      message: '{VALUE} is not a valid mobile phone number'
    },
    default: ''
  },
  image: {
    type: String,
    trim: true,
    default: null
  },
  about: {
    type: String,
    default: ''
  },
  hobbies: [
    {
      type: Number,
      validate: {
        validator: value => isSupportedHobbieId(value),
        message: '{VALUE} is not a supported hobbie'
      }
    }
  ],
  _publishedApartments: [
    {
      type: String
    }
  ],

  _givenReviews: [
    {
      type: String
    }
  ],
  _interestedApartments: [
    {
      type: String
    }
  ],
  blockers: [{
    type: Number,
    validate: {
      validator: (value) => isSupportedHobbieId(value),
      message: '{VALUE} is not a supported hobbie'
    }
  }],
  email: {
    type: String,
    minlength: 5,
    trim: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: value => validator.isEmail(value),
      message: '{VALUE} is not a valid email'
    },
    required: true
  },
  password: {
    type: String,
    minlength: 6,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  tokens: [
    {
      access: {
        type: String,
        required: true
      },
      token: {
        type: String,
        required: true
      }
    }
  ],
  notifications: [NotificationSchema],
  conversations: [
    {
      _participants: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true,
        validate: {
          validator: (value) => value.length >= 2,
          message: 'a minimum of 2 users for chat is required'
        }
      },
      messages: [PrivateMessageSchema],
    }
  ],
});

/**
 * a middleware function for user.
 * this function is doing some operations before the save function is called
 * on user.
 * before saving a user the function:
 * encrypts the user password, if it was modified.
 */
UserSchema.pre('save', function (next) {
  const user = this;

  if (user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (errr, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

/**
 * find a user with the specified credentials.
 *
 * @param {String} email
 * @param {String} password
 * @returns Promise object.
 */
UserSchema.statics.findByCredentials = function (email, password) {
  const User = this;
  email = email.toLowerCase();

  return User.findOne({ email }).then(user => {
    if (!user) {
      return Promise.reject(invalidCredentials);
    }

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        } else {
          reject(invalidCredentials);
        }
      });
    });
  });
};

/**
 * find a user with the specified auth token string.
 *
 * @param {String} token
 * @returns Promise Object.
 */
UserSchema.statics.findByToken = function (token) {
  const User = this;
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // may fail if token is expired or token is invalid
    return Promise.reject();
  }

  return User.findOne({
    _id: decoded._id,
    'tokens.access': XAUTH,
    'tokens.token': token
  });
};

/**
 * we don't want all of a user properties to be exposed.
 * dues we make sure that the toJSON operation returns only some of
 * its properties.
 *
 * @param {User Object} user
 * @returns Object with the public properties of the user
 */
UserSchema.statics.toJSON = function (user) {
  return _.pick(user, [
    '_id',
    'email',
    'isVerified',
    'firstName',
    'lastName',
    'birthdate',
    'gender',
    'mobilePhone',
    'image',
    'about',
    'hobbies',
    '_publishedApartments',
    '_interestedApartments',
    'notifications'
  ]);
};

/**
 * @author: Alon Talmor
 * @date: 6/5/18
 *
 * checks if all the id recieve is a valid user id,
 *
 * @param {String or Array of String} id - the id to test.
 * @returns Promise Object with the boolean result (true or false).
 */
UserSchema.statics.isValidId = function (id) {
  const User = this;

  const ids = _.castArray(id);
  return User.find({ _id: { $in: ids } })
    .then((users) => {
      if (users.length !== ids.length) {
        return false;
      }
      return true;
    });
};

/**
 * express uses this function when sending an object over HTTP requests.
 *
 * we don't want all of a user properties to be exposed.
 * dues we make sure that the toJSON operation returns only some of
 * its properties.
 *
 * @returns Object with the public properties of the user
 */
UserSchema.methods.toJSON = function () {
  const user = this;

  const userObject = user.toObject();

  return User.toJSON(userObject);
};

/**
 *
 * @param {String} token
 * @returns the ticket with the specified token. if no ticket found returns null.
 */
UserSchema.methods.getTicket = function (token) {
  const user = this;

  return user.tokens.find(t => t.token === token);
};

/**
 * Remove expired tokens from the user's tokens list.
 *
 * @updatedBy: Alon Talmor
 * @date: 18/04/18
 *
 * removed the expiration propery from the user's schema.
 * Now the expiration time is encoded as part of the jwt token.
 * Keep only the tokens that do not have expiration time or
 * have expiration time which has yet to pass.
 *
 * @returns Promsie Object containing the modified user.
 */
UserSchema.methods.removeExpiredTokens = function () {
  const user = this;

  const currentTime = Date.now() / 1000;
  const tokens = user.tokens.filter(t => currentTime < jwt.decode(t.token, process.env.JWT_SECRET).exp);
  user.tokens = tokens;
  return user.save();
};

// /**
//  *
//  * @param {String} token
//  * @returns Promise object with the new expiration time.
//  */
// UserSchema.methods.updateTokenTime = function (token) {
//   const user = this;

//   const newExpiration = ticket.generateNewExpiration();
//   user.getTicket(token).expiration = newExpiration;
//   return user.save().then(() => newExpiration);
// };

/**
 * Generate a new auth token to the user.
 *
 * @updatedBy: Alon Talmor
 * @date: 18/04/18
 *
 * Added XAUTH_EXPIRATION_TIME to be a part of the jwt token
 * instead of a separate property. This saves the need of saving
 * 2 different pieces of data both in back-end & front-end.
 * @returns Promise Object containing the token.
 */
UserSchema.methods.generateAuthenticationToken = function () {
  const user = this;

  const access = XAUTH;
  const token = jwt
    .sign(
      {
        _id: user._id.toHexString(),
        access
      },
      process.env.JWT_SECRET,
      {
        expiresIn: XAUTH_EXPIRATION_TIME
      }
    )
    .toString();

  user.tokens.push({ access, token });

  return user.save().then(() => token);
};

/**
 * @updatedBy: Alon Talmor
 * @date: 18/04/18
 * Register a new user.
 * The registration includes:
 * validation to the data provided
 * encryption of the password
 * saving the user to the db.
 *
 * The registration will fail if:
 * the data provided in not a legal user data (see schema for more details)
 * the email is already in use by other user
 * the encryption of the password has failed.
 *
 * The function returns the saved user (wrapped inside a Promise) on success.
 *
 * @returns Promise Object with holds the registered user.
 */
UserSchema.methods.register = function () {
  const user = this;

  return user.save().catch(error => {
    throw emailInUse;
  });
};

/**
 * calculate the matching score of the two users.
 * the matching is based on common hobbies.
 * each hobbie has a predefined score.
 * every common hobbie adds up to the total matching score.
 *
 * @param {User Object} userToGetMatchingWith
 * @returns matching score of the users.
 */
UserSchema.methods.getMatchingResult = function (userToGetMatchingWith) {
  const user = this;

  return getMatchScore(user.hobbies, userToGetMatchingWith.hobbies);
};

/**
 * sort the users in the array by their matching score comparing to
 * the current user.
 * the matching score is the sum of the scores of the common hobbies.
 *
 * @param {Array} userIds
 * @returns sorted list in ascending order of the users.
 */
UserSchema.methods.getBestMatchingUsers = function (userIds) {
  const user = this;

  return User.find({
    _id: { $in: userIds }
  }).then(users =>
    arrayFunctions.sortArrayASC(
      users,
      curUser => -1 * user.getMatchingResult(curUser)
    )
  );
};

/**
 *
 * @param {any} apartmentId
 * @returns true if the user is the owner of the specified apartment, otherwise false.
 */
UserSchema.methods.isOwner = function (apartmentId) {
  const user = this;

  return (
    arrayFunctions.getIndexOfValue(user._publishedApartments, apartmentId) > -1
  );
};

/**
 *
 * @param {any} reviewID
 * @returns true if the user is the owner of the specified review, otherwise false.
 */
UserSchema.methods.isReviewOwner = function (reviewID) {
  const user = this;

  return arrayFunctions.getIndexOfValue(user._givenReviews, reviewID) > -1;
};

/**
 * remove an apartment from the user's published apartments.
 *
 * @param {String} apartmentId
 * @returns Promise object.
 */
UserSchema.methods.removeApartment = function (apartmentId) {
  const user = this;

  const indexOfVal = arrayFunctions.getIndexOfValue(
    user._publishedApartments,
    apartmentId
  );
  if (indexOfVal > -1) {
    user._publishedApartments.splice(indexOfVal, 1);
  }

  return user.save();
};

/**
 * remove an review from the user's given reviews.
 *
 * @param {String} reviewId
 * @returns Promise object.
 */
UserSchema.methods.removeReview = function (reviewId) {
  const user = this;

  const indexOfVal = arrayFunctions.getIndexOfValue(
    user._givenReviews,
    reviewId
  );
  if (indexOfVal > -1) {
    user._givenReviews.splice(indexOfVal, 1);
  }

  return user.save();
};

/**
 * add a new apartment to the interested apartments list of the user.
 *
 * @param {String} _apartmentID
 * @returns Promise object.
 */
UserSchema.methods.addInterestInApartment = function (_apartmentID) {
  const user = this;

  user._interestedApartments.push(_apartmentID);

  return user.save();
};

/**
 * check if the apartment is being interested by the user.
 *
 * @param {String} _apartmentID
 * @returns true if the user interested, otherwise false.
 */
UserSchema.methods.isInterestedInApartment = function (_apartmentID) {
  const user = this;

  const interestedIDIndex = arrayFunctions.getIndexOfValue(
    user._interestedApartments,
    _apartmentID
  );
  return interestedIDIndex > -1;
};

/**
 * remove an apartment from the user's interested list.
 *
 * @param {String} _apartmentID
 * @returns Promise object.
 */
UserSchema.methods.removeInterestInApartment = function (_apartmentID) {
  const user = this;

  const interestedIDIndex = arrayFunctions.getIndexOfValue(
    user._interestedApartments,
    _apartmentID
  );
  if (interestedIDIndex > -1) {
    user._interestedApartments.splice(interestedIDIndex, 1);
  }

  return user.save();
};

/**
 * @author: Alon Talmor
 * @date: 2/4/18
 *
 * Changing password is not an everyday process. Here, we take extra care when
 * handling with sensitive information.
 * Starting with hashing the new to-be password and comparing it with the old password.
 * If the passwords (old and new) match it means that a user is trying to change his/her password
 * to a password he already has! This is a behaviour which I decided does not make sence.
 * It situation such as, a PasswordResetFailure error is thrown.
 * Otherwise, change the user password to the new one. In Addition, clear the tokens list. This means
 * that after reseting a password the user does not have any open auth relation with the server.
 * It is assumed that the "save" function encrypts the password before saving it in the database.
 * @returns Promise Object which includes the user.
 */
UserSchema.methods.resetPassword = function (newPassword) {
  const user = this;
  return bcrypt.compare(newPassword, user.password).then(passwordsEqual => {
    if (passwordsEqual) {
      throw PasswordResetFailure;
    }
    user.password = newPassword;
    user.tokens = []; // Clear all previous generated tokens list (because password has changed)
    return user.save(); // It is important to use the "save" function here for password encryption
  });
};
/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Adds the given notification to the user's notifications list.
 *
 * @param {Notification} notification: the notification to be added to the current user.
 *
 * @returns {Promise} that resolved once the user document is updated in DB with the new notification.
 */
UserSchema.methods.saveNewNotification = function (notification) {
  const user = this;

  user.notifications.unshift(notification);

  return user.save();
};
/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Adds the given data to an existed notification (i.e. aggregation of notifiications data).
 *
 * @param {ObjectID} _notificationId: the notification id that the data has to be added to.
 * @param {Arry of objectID} newNotifiedObjectIdsArr: the new ids of the objects that were modified that caused the notification to be added.
 * @param {array of objectID} newCreateByIdsArray: the new ids of the users that triggered the notification (who did the action that caused the notification) to be added.
 * @param {Number} newCreationDate: the new date to be kept in the notification structure as the creation date
 *
 * @returns {Promise} that resolved once the user document is updated in DB with the new data of the notification.
 */
UserSchema.methods.saveAggregationDataInNotification = function (
  _notificationId,
  newNotifiedObjectIdsArr,
  newCreateByIdsArray,
  newCreationDate
) {
  const user = this;

  const notificationIndex = arrayFunctions.getIndexOfFirstElementMatchKey(user.notifications, '_id', _notificationId.toString());

  if (notificationIndex < 0) {
    return Promise.reject();
  }

  user.notifications[notificationIndex] = addAggregationDataInNotification(
    user.notifications[notificationIndex],
    newNotifiedObjectIdsArr,
    newCreateByIdsArray,
    newCreationDate
  );

  return user.save();
};
/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Update an existing notification with new data.
 *
 * @param {Array of _notificationId} _notificationsId: the ids of the notifications that the data has to be added to.
 * @param {Array of Notification} newNotifications: the corresponding notifcations with the updated data to be stored.
 *
 * @returns {Promise} that resolved once the user document is updated in DB with the new data of the notifications.
 */
UserSchema.methods.saveUpdatedNotifications = function (
  _notificationsId,
  newNotifications
) {
  const user = this;

  if (_notificationsId.length !== newNotifications.length) {
    return Promise.reject();
  }

  for (let i = 0; i < _notificationsId.length; i++) {  
    const notificationIndex = arrayFunctions.getIndexOfFirstElementMatchKey(user.notifications, '_id', _notificationsId[i].toString());
    if (notificationIndex < 0) {
      continue;
    }

    newNotifications[i]._id = new ObjectID(_notificationsId[i]);
    user.notifications[notificationIndex] = newNotifications[i];
  }

  return user.save();
};
/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Returns the entire notifications list of the user.
 *
 * @returns {array of Notifications} that belongs to the current user
 */
UserSchema.methods.getNotifications = function () {
  const user = this;

  return user.notifications;
};
/**
 *
 * @author: Or Abramovich
 * @date: 04/18
 *
 * Returns the notification with the given ID.
 *
 * @returns {Notification}
 */
UserSchema.methods.getNotificationById = function (_notificationId) {
  const user = this;

  const notificationIndex = arrayFunctions.getIndexOfFirstElementMatchKey(user.notifications, '_id', _notificationId.toString());

  if (notificationIndex < 0) {
    return {};
  }

  return user.notifications[notificationIndex];
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////Conversation Related Functionalities/////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 *
 * @author: Or Abramovich
 * @date: 05/18
 *
 * Saves a new conversation to the user's document for persistency. If conversation exists - messages are added to the conversation
 *
 * @param {Array of ObjectID} _participants: The ids of the users who are part of the conversation. 
 * @param {Array of privateMessage} messages: the messages exchanged in the conversation.
 *
 * @returns {Promise} that resolved once the user document is updated in DB with the new conversation.
 */
UserSchema.methods.inseryOrUpdateConversation = function (_participants, messages) {
  const user = this;

  //Make sure this user is part of the participants:
  if(arrayFunctions.unionArrays(_participants, [new ObjectID(user._id)]).length != _participants.length){
    return Promise.reject();
  }

  //Make sure every message was sent by a participant
  var messagesBelongToConversation = true;
  messages.forEach((message) =>{
    if(!wasPrivateMessageWrittenByParticipants(message, _participants)){
      messagesBelongToConversation = false;
    }
  })

  if(!messagesBelongToConversation){
    return Promise.reject();
  }

  //if conversation exists - messages are added to the conversation
  const conversationIndex = user.getConversationIndexWithParticipants(_participants);
  if(conversationIndex > -1){
      messages.forEach((message) =>{
       user.conversations[conversationIndex].messages.push(message);
     });
  }
  else{
    const newConversation = {
      _participants: _participants,
      messages: messages
    }
    user.conversations.push(newConversation);
  }

  return user.save();
};
/**
 *
 * @author: Or Abramovich
 * @date: 05/18
 *
 * Saves the given message in the given conversation
 *
 * @param {ObjectID} _conversationId: The id of the conversation the message should be saved in
 * @param {privateMessage} message: the message to be added to the conversation.
 *
 * @returns {Promise} that resolved once the user document is updated in DB with the new message.
 */
 
UserSchema.methods.addNewMessageToConversation = function (_conversationId, message) {
  const user = this;

  const conversationIndex = arrayFunctions.getIndexOfFirstElementMatchKey(user.conversations, '_id', _conversationId.toString());
  if(conversationIndex < 0){
    return Promise.reject();
  }

  //Make sure message belongs to the conversation
  if(!wasPrivateMessageWrittenByParticipants(message, user.conversations[conversationIndex]._participants)){
      return Promise.reject();
  }

  user.conversations[conversationIndex].messages.push(message);

  return user.save();
};
/**
 *
 * @author: Or Abramovich
 * @date: 05/18
 *
 * Removes a given conversation from the user document
 *
 * @param {Array of ObjectID} _participants: The ids of the users who are part of the conversation. 
 *
 * @returns {Promise} that resolved once the user document is updated in DB.
 */
 
UserSchema.methods.removeConversation = function (_participants) {
  const user = this;

  const conversationIndex = user.getConversationIndexWithParticipants(_participants);
  if(conversationIndex < 0){
    return Promise.reject();
  }
  
  user.conversations.splice(conversationIndex, 1);

  return user.save();
};
/**
 *
 * @author: Or Abramovich
 * @date: 05/18
 *
 * Check whether there is a conversation with the given participants
 *
 * @param {Array of ObjectID} _participants: The ids of the users who are part of the conversation. 
 *
 * @returns {Boolean} indicating where there is a conversation with the given participants.
 */
 
UserSchema.methods.isConversationWithParticipantsExist = function (_participants) {
  const user = this;

  return user.getConversationIndexWithParticipants(_participants) > -1;
};
/**
 *
 * @author: Or Abramovich
 * @date: 05/18
 *
 * Returns the index of the conversation with the given participants
 *
 * @param {Array of ObjectID} _participants: The ids of the users who are part of the conversation. 
 *
 * @returns {Number} indicating the index of the conversation with the given participants or -1 if not exists.
 */
UserSchema.methods.getConversationIndexWithParticipants = function (_participants) {
  const user = this;

  for(var i=0;i<user.conversations.length;i++){
    var conversation = user.conversations[i];
    if((_participants.length == conversation._participants.length) && 
       (arrayFunctions.unionArrays(conversation._participants, _participants).length == _participants.length))
        return i;
  }
  return -1;
};
/**
 *
 * @author: Or Abramovich
 * @date: 05/18
 *
 * Marks all messages that created bfore the given time as read.
 *
 * @param {Array of ObjectID} _participants: The ids of the users who are part of the conversation. 
 * @param {Number} lastSeenTime: all messages that created before lastSeenTime will be set to read.
 *
 * @returns {Promise} that resolved once the user document is updated in DB.
 */
UserSchema.methods.markConversationMessagesAsReadByTime = function (_participants, lastSeenTime) {
  const user = this;

  const conversationIndex = user.getConversationIndexWithParticipants(_participants);
  if(conversationIndex < 0){
    return Promise.reject();
  }

  for(var i=0;i< user.conversations[conversationIndex].messages.length; i++){
    var message = user.conversations[conversationIndex].messages[i];
    if(getPrivateMessageCreationTime(message) <= lastSeenTime){
      user.conversations[conversationIndex].messages[i] = setPrivateMessageReadState(user.conversations[conversationIndex].messages[i], true);
    }
  }

  return user.save();
};
/**
 *
 * @author: Or Abramovich
 * @date: 05/18
 *
 * Returns the entire message according to the given id
 *
 * @param {Array of ObjectID} _participants: The ids of the users who are part of the conversation. 
 * @param {ObjectID} _messageId: message id to be considered as read
 *
 * @returns {Private Message} object that holds message data or null if such message doesn't exist
 */
UserSchema.methods.getPrivateMessageById = function (_participants, _messageId) {

  const user = this;

  const conversationIndex = user.getConversationIndexWithParticipants(_participants);
  if(conversationIndex < 0){
    return null;
  }

  for(var i=0;i< user.conversations[conversationIndex].messages.length; i++){
    var message = user.conversations[conversationIndex].messages[i];
    if(message._id.equals(_messageId)){
     return message;
    }
  }
  return null;
};

/**
 *
 * @author: Or Abramovich
 * @date: 05/18
 *
 * Marks the given message (and all previous one) as read
 *
 * @param {Array of ObjectID} _participants: The ids of the users who are part of the conversation. 
 * @param {ObjectID} _messageId: message id to be considered as read
 *
 * @returns {Promise} that resolved once the user document is updated in DB.
 */
UserSchema.methods.markMessagesAsReadByLastMessage = function (_participants, _messageId) {
  const user = this;

  var message = user.getPrivateMessageById(_participants, _messageId);

  if(message == null){
    return Promise.reject();
  }

  return user.markConversationMessagesAsReadByTime(_participants, getPrivateMessageCreationTime(message));
};

const User = mongoose.model('User', UserSchema);

module.exports = {
  User
};
