const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  poster: { type: String, required: true },
  totalSeats: { type: Number, required: true }, // was "seats"
  bookedSeats: { type: [Number], default: [] },
  showTime: { type: String, required: true },
  genre: { type: String },
  duration: { type: String },
  price: { type: Number }
});

module.exports = mongoose.model('Movie', MovieSchema);
