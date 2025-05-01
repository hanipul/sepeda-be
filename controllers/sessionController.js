const User = require('../models/User.js');
const Session = require('../models/Session.js');

const wheelCircumference = 2.1; // meter per putaran sepeda statis
const MET = 6.8; // MET sedang bersepeda (12–13.9 mph menurut ACSM)

// ===== MULAI SESI =====
const startSession = async (req, res) => {
  const { cardId } = req.body;
  if (!cardId) return res.status(400).json({ message: 'cardId is required' });
  console.log('Received cardId:', cardId);

  try {
    const user = await User.findOne({ cardId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Hentikan sesi sebelumnya jika belum diakhiri (prevent looping)
    await Session.updateMany(
      { userId: user._id, endTime: { $exists: false } },
      { $set: { endTime: new Date() } }
    );

    const existingSession = await Session.findOne({ userId: user._id, endTime: null });
    if (existingSession) {
      return res.status(200).json({ message: 'Session already running', sessionId: existingSession._id });
    }

    const session = new Session({
      userId: user._id,
      startTime: new Date()
    });

    await session.save();
    res.status(201).json({ message: 'Session started', sessionId: session._id });
  } catch (err) {
    console.error('Error in startSession:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== AKHIRI SESI =====
const endSession = async (req, res) => {
  const { cardId, tickCount } = req.body;

  try {
    const user = await User.findOne({ cardId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const session = await Session.findOne({
      userId: user._id,
      endTime: { $exists: false }
    }).sort({ startTime: -1 });

    if (!session) return res.status(404).json({ message: 'No active session found' });

    const endTime = new Date();
    const durationMinutes = (endTime - session.startTime) / 60000;
    const durationHours = durationMinutes / 60;

    const distanceInMeters = tickCount * wheelCircumference;
    const distanceInKm = distanceInMeters / 1000;
    const avgSpeedKmh = parseFloat((distanceInKm / durationHours).toFixed(2));

    const calories = parseFloat(((MET * 3.5 * user.weight) / 200 * durationMinutes).toFixed(3));

    session.tickCount = tickCount;
    session.distance = distanceInMeters;
    session.calories = calories;
    session.endTime = endTime;

    await session.save();

    console.log("\uD83D\uDCCF Distance (m):", distanceInMeters);
    console.log("\uD83D\uDD25 Calories burned:", calories);

    res.status(200).json({
      message: 'Session ended',
      sessionId: session._id,
      tickCount,
      distance: distanceInMeters,
      calories,
      avgSpeedKmh,
      startTime: session.startTime,
      endTime
    });
  } catch (err) {
    console.error('Error in endSession:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ===== CEK SESI AKTIF UNTUK POLLING =====
const getLatestActiveSession = async (req, res) => {
  try {
    const latest = await Session.findOne({ endTime: null }).sort({ startTime: -1 });
    if (!latest) return res.status(404).json({ message: 'No active session found' });

    const user = await User.findById(latest.userId);
    if (!user) return res.status(404).json({ message: 'User not found for session' });

    res.json({ cardId: user.cardId, userExists: true, startTime: latest.startTime });
  } catch (err) {
    console.error('Error in getLatestActiveSession:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== CEK USER SAAT SCAN =====
const checkUserExistence = async (req, res) => {
  try {
    const { cardId } = req.body;
    if (!cardId) return res.status(400).json({ message: 'cardId is required' });

    const user = await User.findOne({ cardId });
    res.json({ userExists: !!user });
  } catch (err) {
    console.error('Error in checkUserExistence:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== HISTORI SESI =====
const getSessionHistory = async (req, res) => {
  const { cardId } = req.params;

  try {
    const user = await User.findOne({ cardId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const sessions = await Session.find({ userId: user._id }).sort({ startTime: -1 });
    res.json({ cardId, totalSessions: sessions.length, sessions });
  } catch (err) {
    console.error('Error in getSessionHistory:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  checkUserExistence,
  getLatestActiveSession,
  getSessionHistory,
  endSession,
  startSession
};
