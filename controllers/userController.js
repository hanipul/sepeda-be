const User = require('../models/User');

exports.createUser = async (req, res) => {
  const { cardId, name, weight, gender } = req.body;

  // Validasi input: pastikan semua field diisi
  if (!cardId || !name || !weight || !gender) {
    return res.status(400).json({ message: 'cardId, name, weight, and gender are required' });
  }

  // Validasi gender: harus 1 (laki-laki) atau 2 (perempuan)
  if (gender !== "1" && gender !== "2") {
    return res.status(400).json({ message: 'Gender must be 1 (male) or 2 (female)' });
  }

  try {
    // Periksa apakah cardId sudah ada di database
    const existing = await User.findOne({ cardId });
    if (existing) {
      return res.status(409).json({ message: 'cardId already exists' });
    }

    // Membuat pengguna baru
    const newUser = new User({ cardId, name, weight, gender });
    await newUser.save();

    return res.status(201).json({
      message: 'User created successfully',
      userId: newUser._id,
      cardId,
      name,
      weight,
      gender
    });
  } catch (err) {
    console.error('❌ Error creating user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getUserByCardId = async (req, res) => {
  try {
    const user = await User.findOne({ cardId: req.params.cardId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (err) {
    console.error('❌ Error fetching user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateWeight = async (req, res) => {
  const { weight } = req.body;
  const { cardId } = req.params;

  // Validasi berat badan
  if (!weight || isNaN(weight) || weight <= 0) {
    return res.status(400).json({ message: 'Invalid weight value' });
  }

  try {
    const user = await User.findOne({ cardId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update berat badan
    user.weight = weight;
    await user.save();

    return res.json({ message: 'Weight updated successfully', newWeight: weight });
  } catch (err) {
    console.error('❌ Error updating weight:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
