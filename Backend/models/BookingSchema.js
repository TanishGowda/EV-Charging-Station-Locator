const mongoose = require('mongoose');

// Define the booking schema
const bookingSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  nearestLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }, 
  stationName: {
    type: String,
    required: true
  },
  carType: {
    type: String,
    required: true
  },
  carNumber: {
    type: String,
    required: true
  },
  chargingSlot: {
    type: String, 
    required: true
  },
  bookingDateTime: {
    type: Date,
    default: Date.now // Automatically set the date and time of booking
  }
}, { timestamps: true });


// Create the Booking model
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
