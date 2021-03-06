
const ERR_INVALID_CREDENTIALS   = 101010;
const ERR_EMAIL_IN_USE          = 110000;
const INVALID_LOCATION          = 110100;
const UNKNOWN_ERROR             = 111111;
const UNCONFIRMED_USER          = 100000;
const PASSWORD_RESET_FAILURE    = 500000;
const MULTI_RATING              = 600000;
const IMAGE_UPLOAD_FAILURE      = 666000;

const APARTMENT_NOT_FOUND       = 160000;

const GROUP_CREATION_FAILURE    = 160001;
const GROUP_NOT_FOUND           = 160002;
const GROUP_MEMBER_NOT_FOUND    = 160003;
const GROUP_SIGN_FAILURE        = 160004;
const GROUP_INVALID_SINGER      = 160005;

const USER_NOT_FOUND            = 170000;
const USER_UPDATE_FAILURE       = 170001;

const Error = function (code, message) {
  return {
    code,
    message
  };
};

module.exports = {
  invalidCredentials: Error(ERR_INVALID_CREDENTIALS, 'Invalid credentials.'),
  emailInUse: Error(ERR_EMAIL_IN_USE, 'Email already in use.'),
  invalidLocation: Error(INVALID_LOCATION, 'Couldn\'t find location.'),
  unknownError: Error(UNKNOWN_ERROR, 'Unknown error occurred.'),
  unconfirmedUser: Error(UNCONFIRMED_USER, 'Account is not verified.'),
  PasswordResetFailure: Error(PASSWORD_RESET_FAILURE, 'Couldn\'t complete the reset password action.'),
  multiRating: Error(MULTI_RATING, 'User tried to rate 2 adjacent locations.'),
  imageUploadFailure: Error(IMAGE_UPLOAD_FAILURE, 'Error occurred while trying to upload images.'),
  apartmentNotFound: Error(APARTMENT_NOT_FOUND, 'The apartment was not found.'),
  groupCreationFailed: Error(GROUP_CREATION_FAILURE, 'Couldn\'t create new group for the apartment.'),
  groupNotFound: Error(GROUP_NOT_FOUND, 'The group was not found.'),
  groupMemberNotFound: Error(GROUP_MEMBER_NOT_FOUND, 'The group member was not found.'),
  groupSignFailure: Error(GROUP_SIGN_FAILURE, 'Group cannot be signed.'),
  groupInvalidSigner: Error(GROUP_INVALID_SINGER, 'Group must be signed by the apartment\'s owner.'),
  userNotFound: Error(USER_NOT_FOUND, 'The user was not found.'),
  userUpdateFailure: Error(USER_UPDATE_FAILURE, 'Failed to update user.')
};