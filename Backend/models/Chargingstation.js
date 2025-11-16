const mongoose = require('mongoose');

const chargingStationSchema = new mongoose.Schema({
    chargerType: {
        type: String,
        required: true
    },
    stationName: {
        type: String,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Define model for charging station
const ChargingStation = mongoose.model('ChargingStation', chargingStationSchema);

module.exports = ChargingStation;
