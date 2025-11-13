const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  poster: { type: String, required: true },
  totalSeats: { type: Number, required: true }, // was "seats"
  bookedSeats: { type: [Number], default: [] },
  showTime: { type: String, required: true },
  genre: { type: String },
  duration: { type: String },
  price: { type: Number },
  // New fields for engagement and sorting
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] }, // store user IDs to prevent duplicate likes
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Movie', MovieSchema);
