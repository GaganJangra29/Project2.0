const express = require('express');
const { auth, isDriver } = require('../middleware/auth');
const Ride = require('../models/Ride');

const router = express.Router();

// Create new ride request
router.post('/request', auth, async (req, res) => {
  try {
    const {
      pickupLocation,
      destinationLocation,
      pickupAddress,
      destinationAddress,
      price
    } = req.body;

    const ride = new Ride({
      user: req.user._id,
      pickup: {
        type: 'Point',
        coordinates: [pickupLocation.longitude, pickupLocation.latitude],
        address: pickupAddress
      },
      destination: {
        type: 'Point',
        coordinates: [destinationLocation.longitude, destinationLocation.latitude],
        address: destinationAddress
      },
      price
    });

    await ride.save();
    
    // Emit socket event for new ride request
    req.app.get('io').emit('newRide', { ride });

    res.status(201).json({ ride });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Accept ride (driver only)
router.post('/accept/:rideId', [auth, isDriver], async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'pending') {
      return res.status(400).json({ message: 'Ride already accepted or completed' });
    }

    ride.driver = req.user._id;
    ride.status = 'accepted';
    await ride.save();

    // Notify user that ride was accepted
    req.app.get('io').to(ride.user.toString()).emit('rideAccepted', { ride });

    res.json({ ride });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update ride status
router.patch('/:rideId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const ride = await Ride.findById(req.params.rideId);
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Verify user is either the rider or the driver
    if (ride.user.toString() !== req.user._id.toString() && 
        ride.driver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    ride.status = status;
    await ride.save();

    // Notify both user and driver about status change
    req.app.get('io').to(ride.user.toString()).emit('rideStatusUpdated', { ride });
    if (ride.driver) {
      req.app.get('io').to(ride.driver.toString()).emit('rideStatusUpdated', { ride });
    }

    res.json({ ride });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user's ride history
router.get('/history', auth, async (req, res) => {
  try {
    const rides = await Ride.find({
      $or: [
        { user: req.user._id },
        { driver: req.user._id }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('user', 'name')
    .populate('driver', 'name');

    res.json({ rides });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get active ride
router.get('/active', auth, async (req, res) => {
  try {
    const ride = await Ride.findOne({
      $or: [
        { user: req.user._id },
        { driver: req.user._id }
      ],
      status: { $in: ['accepted', 'in-progress'] }
    })
    .populate('user', 'name')
    .populate('driver', 'name');

    res.json({ ride });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;