const User = require('../models/User.js');
const Session = require('../models/Session.js');
const { clearActiveCard, getActiveCardId } = require('./scanController');

const wheelCircumference = 2.1; // meters
const MET = 6.8;

// Fungsi untuk memulai sesi
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

// Fungsi untuk mengakhiri sesi
const endSession = async (req, res) => {
    const { cardId, tickCount } = req.body;

    if (!cardId || tickCount === undefined) {
        return res.status(400).json({ message: 'cardId and tickCount are required' });
    }

    const activeCard = getActiveCardId(); // Pastikan ini mendapatkan ID kartu yang benar
    if (!activeCard || activeCard !== cardId) {
        return res.status(403).json({ message: 'Unauthorized card. Only session owner can end the session.' });
    }

    try {
        const user = await User.findOne({ cardId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const session = await Session.findOne({ userId: user._id, endTime: null }).sort({ startTime: -1 });
        if (!session) return res.status(404).json({ message: 'No active session found' });

        const endTime = new Date();
        session.endTime = endTime;  // Update endTime
        session.status = 'done';    // Update status
        session.tickCount = tickCount;

        await session.save();
        clearActiveCard(); // Pastikan sesi aktif dihapus setelah selesai

        return res.status(200).json({
            message: 'Session ended',
            sessionId: session._id,
            tickCount,
            distance: session.distance,
            calories: session.calories,
            avgSpeed: session.avgSpeed,
            startTime: session.startTime,
            endTime,
        });
    } catch (err) {
        console.error('❌ Error in endSession:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Fungsi untuk memeriksa keberadaan pengguna berdasarkan cardId
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

// Fungsi untuk mendapatkan sesi aktif terbaru
const getLatestActiveSession = async (req, res) => {
    try {
        const latest = await Session.findOne({ endTime: null }).sort({ startTime: -1 });
        if (!latest) {
            return res.status(404).json({ message: 'No active session found' });
        }
        const user = await User.findById(latest.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found for session' });
        }
        res.json({
            cardId: user.cardId,
            userExists: true,
            startTime: latest.startTime
        });
    } catch (err) {
        console.error('❌ Error in getLatestActiveSession:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};



// Fungsi untuk mendapatkan sesi berdasarkan cardId
const getSessionHistory = async (req, res) => {
    const { cardId } = req.params;
    if (!cardId) return res.status(400).json({ message: 'cardId is required' });

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

// Fungsi untuk mendapatkan sesi terbaru berdasarkan cardId
const getLatestSession = async (req, res) => {
  const { cardId } = req.params;
  if (!cardId) return res.status(400).json({ message: 'cardId is required' });

  try {
    const user = await User.findOne({ cardId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const session = await Session.findOne({ userId: user._id, endTime: { $ne: null } }).sort({ startTime: -1 });
    if (!session) return res.status(404).json({ message: 'No completed session found for this user' });

    return res.status(200).json(session);
  } catch (error) {
    console.error('❌ Error in getLatestSession:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  startSession,
  endSession,
  checkUserExistence,
  getLatestActiveSession,
  getSessionHistory,
  getLatestSession
};
