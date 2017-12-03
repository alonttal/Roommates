
const {ObjectID} = require('mongodb');

const {ApartmentAd} = require('../../server/models/apartmentAd');

const apartment1 = {
    _createdBy: new ObjectID(),
    createdAt: new Date(),
    price: 1000,
    //_interested:
    enteranceDate: new Date(),
    location : {
        address : {
            city: "Haifa",
            street: "Gilboa",
            number: 35
            //apartmentNumber: 
        },
        geolocation: [35.017253, 32.784037]
    },
    numberOfRooms: 4,
    floor: 2,
    totalFloors: 4,
    //area: 
    //images: 
    //description: 
    //tags: 
    requiredNumberOfRoommates: 2,
    currentlyNumberOfRoomates: 1
    //comments
};

const apartment2 = {
    _createdBy: new ObjectID(),
    createdAt: new Date(),
    price: 1000,
    //_interested:
    enteranceDate: new Date(),
    location : {
        address : {
            city: "Tel-Aviv",
            street: "Rothschild",
            number: 23
            //apartmentNumber: 
        },
        geolocation: [34.775313, 32.065887]
    },
    numberOfRooms: 3,
    floor: 1,
    totalFloors: 5,
    //area: 
    //images: 
    //description: 
    //tags: 
    requiredNumberOfRoommates: 1,
    currentlyNumberOfRoomates: 1
    //comments
};


const apartments = [
	apartment1,
	apartment2
];

const coords = {
	andalusiaSpain: [-3.222444, 37.916345],
	technionIsrael: [35.020568, 32.776515]
};

var populateApartments = (done) => {
		ApartmentAd.remove({})
		.then(ApartmentAd.create(apartments))
		.then(done())
		.catch(done);
};

module.exports = {
	apartments,
	coords,
	populateApartments,
};