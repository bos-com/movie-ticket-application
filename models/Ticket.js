const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  seat: { type: Number, required: true },
  userId: { type: String, required: true },
  paid: { type: Boolean, default: false },
  bookedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);
