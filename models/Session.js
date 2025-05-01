const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    require: false,
    default: null
  },
  tickCount: {
    type: Number,
    require: false,
    default: 0
  },
  distance:{
    type: Number,
    require: false,
    default: 0
  },
  calories: {
    type: Number,
    require: false,
    default: 0
  }
}, { timestamps: true });

const session = mongoose.model('Session', sessionSchema);

module.exports=session;