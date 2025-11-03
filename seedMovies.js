require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");

    // Clear existing movies (already dropped, but safe)
    await Movie.deleteMany({});

    const movies = [
      { title: "Avatar: The Way of Water", poster: "avatar.jpg", totalSeats: 100, showTime: "6:00 PM" },
      { title: "Frozen II", poster: "frozen.jpg", totalSeats: 80, showTime: "3:00 PM" },
      { title: "Avengers: Endgame", poster: "avengers.jpg", totalSeats: 120, showTime: "8:00 PM" },
      { title: "The Batman", poster: "batman.jpg", totalSeats: 90, showTime: "7:00 PM" },
      { title: "Inception", poster: "inception.jpg", totalSeats: 110, showTime: "5:00 PM" },
      { title: "Interstellar", poster: "interstellar.jpg", totalSeats: 100, showTime: "9:00 PM" },
      { title: "Spider-Man: No Way Home", poster: "spiderman.webp", totalSeats: 95, showTime: "4:00 PM" },
      { title: "Black Panther: Wakanda Forever", poster: "black panther.jpg", totalSeats: 105, showTime: "6:30 PM" },
    ];

    await Movie.insertMany(movies);
    console.log("✅ Movies seeded successfully");

    process.exit();
  })
  .catch(err => console.log("❌ MongoDB connection error:", err));
