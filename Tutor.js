// basic-crud-server/models/Tutor.js
const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
  tutorName: { type: String, required: true },
  photo: { type: String, required: true },
  subject: { type: String, required: true },
  availableDays: { type: [String], required: true },
  timeSlot: { type: String, required: true },
  hourlyFee: { type: Number, required: true },
  totalSlot: { type: Number, required: true },
  sessionDate: { type: Date, required: true },
  institution: { type: String, required: true },
  experience: { type: String, required: true },
  location: { type: String, required: true },
  teachingMode: { type: String, required: true },
  userEmail: { type: String, required: true }
});

module.exports = mongoose.model('Tutor', tutorSchema);