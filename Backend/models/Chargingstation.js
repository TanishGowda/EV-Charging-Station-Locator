const mongoose = require('mongoose');


const chargingStationSchema = new mongoose.Schema({
    chargerType: String,
    latitude: Number,
    longitude: Number,
    createdAt: { type: Date, default: Date.now }
});

// Define model for charging station
const ChargingStation = mongoose.model('ChargingStation', chargingStationSchema);

module.exports = ChargingStation;