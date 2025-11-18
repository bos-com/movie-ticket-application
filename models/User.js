const mongoose = require('mongoose');
// initial of the user models 
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }, 
  following: { type: [String], default: [] },
});

module.exports = mongoose.model('User', userSchema);
