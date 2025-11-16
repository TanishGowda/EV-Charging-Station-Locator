require('dotenv').config();  // Load environment variables from .env

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
// const twilio=require('twilio') 

const app = express();
const port = 3000;

// Twilio credentials
// const accountSid = 'AC2b8741279231b0ae4163e1f0e783332c';
// const authToken = '6a4c37f16a2574fee43ce57c24ada562';
// const twilioPhoneNumber = '+13203890939';

// const client = twilio(accountSid, authToken);

// Connect to MongoDB using environment variable
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// User model
const User = require('./models/userschema');
const ChargingStation = require('./models/Chargingstation');
const Booking = require('./models/BookingSchema');

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Register route
app.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, contactNumber } = req.body;

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            contactNumber
        });

        // Save the user to the database
        await newUser.save();

        // Send SMS to user's contactNumber using Twilio
        // client.messages.create({
        //     body: 'Thank you for Registering, Welcome to VoltSpot',
        //     from: twilioPhoneNumber,
        //     to: contactNumber
        // });

        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Login route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the password is correct
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ email: user.email, firstName: user.firstName, lastName: user.lastName }, 'secretkey');

        res.status(200).json({ message: 'Login successful', token, user });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create a new charging station
app.post('/api/chargingstations', async (req, res) => {
    try {
        const { chargerType, stationName, latitude, longitude } = req.body;
        const chargingStation = new ChargingStation({ chargerType, stationName, latitude, longitude });
        await chargingStation.save();
        res.status(201).json(chargingStation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a charging station by name
app.delete('/api/chargingstations/:name', async (req, res) => {
    const stationName = req.params.name;

    try {
        // Find the charging station by name and delete it
        const deletedStation = await ChargingStation.findOneAndDelete({ stationName });

        if (!deletedStation) {
            // If station with the provided name is not found
            return res.status(404).json({ error: 'Charging station not found' });
        }

        res.status(200).json({ message: 'Charging station deleted successfully' });
    } catch (error) {
        console.error('Error deleting charging station:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET route to fetch all charging stations
app.get('/api/chargingstations', async (req, res) => {
    try {
        const chargingStations = await ChargingStation.find();
        res.json(chargingStations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new booking
app.post('/api/bookings', async (req, res) => {
    try {
        const { user, location, nearestLocation, stationName, carType, carNumber, chargingSlot, contactNumber } = req.body;

        // Create a new booking instance
        const booking = new Booking({
            user,
            location,
            nearestLocation,
            stationName,
            carType,
            carNumber,
            chargingSlot,
        });

        // Save the booking to the database
        await booking.save();

        // Send SMS to user's contactNumber using Twilio
        // const message = `Thank you for using Refuel EV!\nStation: ${stationName}\nVehicle Number: ${carNumber}\nCharging Slot: ${chargingSlot}\nGoogle Maps Link: https://www.google.com/maps?q=${nearestLocation.coordinates[0]},${nearestLocation.coordinates[1]}`;

        // client.messages.create({
        //     body: message,
        //     from: twilioPhoneNumber,
        //     to: "+919686612481"
        // })
        // .then(() => {
        //     console.log("Twilio message sent successfully.");
        // })
        // .catch((error) => {
        //     console.error("Error sending Twilio message:", error);
        // });

        res.status(201).json(booking); // Return the created booking
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a booking by ID
app.delete('/api/bookings/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Find the booking by ID and delete it
        const deletedBooking = await Booking.findByIdAndDelete(id);

        if (!deletedBooking) {
            // If booking with the provided ID is not found
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET route to fetch bookings for a specific user
app.get('/api/bookings/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const bookings = await Booking.find({ user: userId }).sort({ bookingDateTime: -1 });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET route to check availability of a charging slot
app.get('/checkavailability', async (req, res) => {
    const { stationName, chargingSlot } = req.query;

    try {
        const existingBooking = await Booking.findOne({ stationName, chargingSlot });
        if (existingBooking) {
            res.status(201).json({ message: 'Slot already booked', booking: existingBooking });
        } else {
            res.status(200).json({ message: 'Slot available' });
        }
    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/allbookings', async (req, res) => {
    const { stationName, chargingSlot } = req.query;
    console.log(req.query)
    try {
      const existingBooking = await Booking.findOne({ stationName, chargingSlot });
      console.log(existingBooking)
      if (existingBooking) {
        res.status(201).json({ message: 'Slot already booked', booking: existingBooking });
      } else { 
        res.status(200).json({ message: 'Slot available' });  
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/users/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // If user is found, send the user details as response
      res.json(user);
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
});

// Update user profile route
app.put('/api/users/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const { firstName, lastName, email, contactNumber } = req.body;
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      user.firstName = firstName;
      user.lastName = lastName;
      user.email = email;
      user.contactNumber = contactNumber;
  
      await user.save();
  
      res.status(200).json({ message: 'User profile updated successfully', user });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
