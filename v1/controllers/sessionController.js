const User = require('../models/User.js');
const Session = require('../models/Session.js');
const { clearActiveCard, getActiveCardId } = require('./scanController.js');

const wheelCircumference = 2.1; // meters
const MET = 6.8;

const startSession = async (req, res) => {
  const { cardId } = req.body;
  if (!cardId) return res.status(400).json({ message: 'cardId is required' });

  try {
    const user = await User.findOne({ cardId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const dateNow = new Date();
    const newSession = new Session(
      {
        userId: user._id,
        startTime: dateNow,
        endTime: null,
        status: 'on going',
      }
    );
    await newSession.save();

    return res.status(201).json({ message: 'Session started', sessionId: newSession._id });
  } catch (err) {
    console.error('❌ Error in startSession:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const endSession = async (req, res) => {
  const { cardId, tickCount } = req.body;

  if (!cardId || tickCount === undefined) {
    return res.status(400).json({ message: 'cardId and tickCount are required' });
  }

  const activeCard = getActiveCardId();
  console.log('🔒 Verifying session owner...');
  console.log('Active card in system:', activeCard);
  console.log('Incoming card trying to end:', cardId);

  if (!activeCard || activeCard !== cardId) {
    return res.status(403).json({ message: 'Unauthorized card. Only session owner can end the session.' });
  }

  try {
    const user = await User.findOne({ cardId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const session = await Session.findOne({ userId: user._id, endTime: null }).sort({ startTime: -1 });
    if (!session) return res.status(404).json({ message: 'No active session found' });

    const endTime = new Date();
    const durationMinutes = (endTime - session.startTime) / 60000;
    const durationHours = durationMinutes / 60;

    const distanceInMeters = tickCount * wheelCircumference;
    const distanceInKm = distanceInMeters / 1000;
    const avgSpeedKmh = parseFloat((distanceInKm / durationHours).toFixed(2));

    // Kalori dengan gender-based multiplier
    let caloriesMultiplier = 1;
    if (user.gender === 2) { // perempuan
      caloriesMultiplier = 0.95;
    }

    const calories = parseFloat(((MET * 3.5 * user.weight * caloriesMultiplier) / 200 * durationMinutes).toFixed(2));

    session.tickCount = tickCount;
    session.distance = distanceInMeters;
    session.calories = calories;
    session.avgSpeed = avgSpeedKmh;
    session.endTime = endTime;
    session.status = 'done';

    await session.save();
    clearActiveCard();

    return res.status(200).json({
      message: 'Session ended',
      sessionId: session._id,
      tickCount,
      distance: distanceInMeters,
      calories,
      avgSpeedKmh,
      startTime: session.startTime,
      endTime,
    });
  } catch (err) {
    console.error('❌ Error in endSession:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const checkUserExistence = async (req, res) => {
  try {
    const { cardId } = req.body;
    if (!cardId) return res.status(400).json({ message: 'cardId is required' });

    const user = await User.findOne({ cardId });
    return res.json({ userExists: !!user });
  } catch (err) {
    console.error('❌ Error in checkUserExistence:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getLatestActiveSession = async (req, res) => {
  try {
    const latest = await Session.findOne({ endTime: null }).sort({ startTime: -1 });
    if (!latest) return res.status(404).json({ message: 'No active session found' });

    const user = await User.findById(latest.userId);
    if (!user) return res.status(404).json({ message: 'User not found for session' });

    return res.json({
      cardId: user.cardId,
      userExists: true,
      startTime: latest.startTime
    });
  } catch (err) {
    console.error('❌ Error in getLatestActiveSession:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getSessionHistory = async (req, res) => {
  const { cardId } = req.params;

  try {
    const user = await User.findOne({ cardId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const sessions = await Session.find({ userId: user._id }).sort({ startTime: -1 });
    return res.json({ cardId, totalSessions: sessions.length, sessions });
  } catch (err) {
    console.error('❌ Error in getSessionHistory:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getLatestSesion = async (req, res) => {
  try {
    const { cardId } = req.params;
    if (!cardId) return res.status(400).json({ message: 'cardId is required' });
    const user = await User.findOne({ cardId });

    const getLatestSession = await Session.findOne(
      {
        userId: user._id,
        endTime: { $ne: null },
        status: 'done'
      }
    ).sort({ startTime: -1 });
    return res.status(200).json(getLatestSession);
  } catch (error) {
    console.error('❌ Error in getLatestSesion:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  startSession,
  endSession,
  checkUserExistence,
  getLatestActiveSession,
  getSessionHistory,
  getLatestSesion
};
