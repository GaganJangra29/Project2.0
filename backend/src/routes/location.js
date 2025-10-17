const express = require('express');
const { auth, isDriver } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Update user's current location
router.post('/update', auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    req.user.currentLocation = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    
    await req.user.save();
    
    res.json({
      location: req.user.currentLocation
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get nearby drivers
router.get('/nearby-drivers', auth, async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 5000 } = req.query; // maxDistance in meters

    const nearbyDrivers = await User.find({
      role: 'driver',
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).select('name currentLocation');

    res.json({ drivers: nearbyDrivers });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get driver's current location
router.get('/driver/:driverId', auth, async (req, res) => {
  try {
    const driver = await User.findOne({
      _id: req.params.driverId,
      role: 'driver'
    }).select('name currentLocation');

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({ driver });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;