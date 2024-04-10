const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors')

const app = express();

const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb+srv://josephpeterjece2021:AJ9Hg6xTtQBUCoGr@cluster1.xaacunv.mongodb.net/EVproject?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// User model
const User = require('./models/userschema');
const ChargingStations = require('./models/Chargingstation')
const Booking = require('./models/BookingSchema');
// Middleware
app.use(bodyParser.json());
app.use(cors())
// Login route
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        // Save the user to the database
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

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
        const token = jwt.sign({ email: user.email, username: user.username }, 'secretkey');

        res.status(200).json({ message: 'Login successful', token ,user});
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create a new charging station
app.post('/api/chargingstations', async (req, res) => {
    try {
        const { chargerType, latitude, longitude } = req.body;
        console.log(req.body)
        const chargingStation = new ChargingStations({ chargerType, latitude, longitude });
        await chargingStation.save();
        res.status(201).json(chargingStation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Routes
app.get('/api/chargingstations', async (req, res) => {
    try {
      const chargingStations = await ChargingStations.find();
      res.json(chargingStations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/bookings', async (req, res) => {
    try {
      // Assuming request body contains necessary data for booking
      const { user, location, nearestLocation, carType, carNumber, chargingSlot } = req.body;
      
      // Create a new booking instance
      const booking = new Booking({
        user,
        location,
        nearestLocation,
        carType,
        carNumber,
        chargingSlot,
      });

      // Save the booking to the database
      await booking.save();
  
      res.status(201).json(booking); // Return the created booking
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
// GET route to fetch bookings for a specific user
app.get('/api/bookings/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const bookings = await Booking.find({ user: userId });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
