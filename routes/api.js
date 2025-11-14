const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Movie = require('../models/Movie');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();

// Helpers
function isLoggedIn(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ message: 'Not authenticated' });
}
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin only' });
}

// Upload config
const uploadDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '_');
    const name = `${base}_${Date.now()}${ext.toLowerCase()}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// Follow: toggle follow for current user; store on User.following
router.post('/movies/:id/follow', isLoggedIn, async (req, res) => {
  try {
    const uid = req.session.user.id
    const user = await User.findById(uid)
    if (!user) return res.status(401).json({ message: 'Not authenticated' })
    const id = String(req.params.id)
    const has = (user.following || []).includes(id)
    user.following = has ? user.following.filter(x => String(x) !== id)
                         : [ ...(user.following || []), id ]
    await user.save()
    return res.json({ following: user.following })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: 'Server error' })
  }
})

// Get current user's following list
router.get('/me/following', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id)
    if (!user) return res.status(401).json({ message: 'Not authenticated' })
    return res.json({ following: user.following || [] })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: 'Server error' })
  }
})

// Auth API
router.post('/auth/register',
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input data' });

    const { name, email, password, isAdmin, adminCode } = req.body;
    try {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email already registered' });

      let makeAdmin = false;
      if (isAdmin === true || isAdmin === 'on') {
        if (process.env.ADMIN_SECRET) {
          if (!adminCode || adminCode !== process.env.ADMIN_SECRET)
            return res.status(403).json({ message: 'Invalid admin code' });
          makeAdmin = true;
        } else {
          makeAdmin = true; // fallback if no ADMIN_SECRET set
        }
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashed, isAdmin: makeAdmin });
      return res.json({ message: 'Registered', user: { id: user._id, name: user.name, role: user.isAdmin ? 'admin' : 'user' } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    req.session.user = { id: user._id.toString(), name: user.name, role: user.isAdmin ? 'admin' : 'user' };
    return res.json({ message: 'Logged in', user: req.session.user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

router.get('/auth/me', (req, res) => {
  return res.json({ user: req.session.user || null });
});

// Movies API (public read)
router.get('/movies', async (req, res) => {
  const list = await Movie.find();
  res.json(list);
});

router.get('/movies/:id', async (req, res) => {
  // Increment views when a movie detail is fetched
  const m = await Movie.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  );
  if (!m) return res.status(404).json({ message: 'Not found' });
  res.json(m);
});

// Admin CRUD
router.post('/movies', isAdmin, async (req, res) => {
  try {
    const m = await Movie.create(req.body);
    res.status(201).json(m);
  } catch (e) {
    console.error(e); res.status(400).json({ message: 'Invalid movie data' });
  }
});

router.put('/movies/:id', isAdmin, async (req, res) => {
  try {
    const m = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!m) return res.status(404).json({ message: 'Not found' });
    res.json(m);
  } catch (e) {
    console.error(e); res.status(400).json({ message: 'Invalid movie data' });
  }
});

router.delete('/movies/:id', isAdmin, async (req, res) => {
  try {
    const m = await Movie.findByIdAndDelete(req.params.id);
    if (!m) return res.status(404).json({ message: 'Not found' });
    res.status(204).end();
  } catch (e) {
    console.error(e); res.status(400).json({ message: 'Invalid request' });
  }
});

// Poster upload (admin only)
router.post('/upload', isAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const filename = req.file.filename;
  return res.json({ filename, url: `/images/${filename}` });
});

// Likes: toggle like for current user
router.post('/movies/:id/like', isLoggedIn, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const m = await Movie.findById(req.params.id);
    if (!m) return res.status(404).json({ message: 'Movie not found' });
    const has = (m.likedBy || []).includes(String(userId));
    if (has) {
      m.likedBy = m.likedBy.filter(x => String(x) !== String(userId));
      m.likes = Math.max(0, Number(m.likes || 0) - 1);
    } else {
      m.likedBy = [...(m.likedBy || []), String(userId)];
      m.likes = Number(m.likes || 0) + 1;
    }
    await m.save();
    res.json({ id: m._id, likes: m.likes, liked: !has });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Booking and tickets
router.post('/movies/:id/book', isLoggedIn, async (req, res) => {
  const seat = Number(req.body.seat)
  if (!seat || seat <= 0) return res.status(400).json({ message: 'Invalid seat' });
  const movie = await Movie.findById(req.params.id)
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  if (seat > Number(movie.totalSeats || 0)) return res.status(400).json({ message: 'Seat out of range' });

  // Atomic reserve: only push seat if it's not already booked
  const updated = await Movie.findOneAndUpdate(
    { _id: req.params.id, bookedSeats: { $ne: seat } },
    { $push: { bookedSeats: seat } },
    { new: true }
  )
  if (!updated) {
    return res.status(400).json({ message: 'Seat already booked' })
  }

  const ticket = await Ticket.create({ movie: updated._id, seat, userId: req.session.user.id, paid: false });
  res.json({ id: ticket._id, movieId: updated._id, seat: ticket.seat, paid: ticket.paid, bookedAt: ticket.bookedAt });
});

router.post('/tickets/:id/pay', isLoggedIn, async (req, res) => {
  const t = await Ticket.findById(req.params.id).populate('movie');
  if (!t) return res.status(404).json({ message: 'Ticket not found' });
  if (t.userId !== req.session.user.id) return res.status(403).json({ message: 'Forbidden' });
  t.paid = true;
  await t.save();
  // Send email via embedded Java service (best-effort)
  try {
    const user = await User.findById(req.session.user.id);
    const mailerUrl = process.env.MAILER_URL || 'http://localhost:8081';
    const subject = `Your MovieFlex Ticket · ${t.movie?.title || ''}`.trim();
    const content = [
      `Hi ${req.session.user.name || ''},`,
      '',
      `Thank you for your purchase on MovieFlex. Here are your ticket details:`,
      `Movie: ${t.movie?.title}`,
      `Seat: ${t.seat}`,
      `Booked at: ${new Date(t.bookedAt).toLocaleString()}`,
      '',
      `Enjoy the show!`,
    ].join('\n');
    if (user?.email) {
      const headers = { 'Content-Type': 'application/json' };
      if (process.env.MAILER_TOKEN) headers['Authorization'] = `Bearer ${process.env.MAILER_TOKEN}`;
      await fetch(`${mailerUrl}/api/email/ticket`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ to: user.email, subject, content })
      }).catch(() => {});
    }
  } catch (e) { console.error('Email send failed:', e?.message || e); }

  res.json({ id: t._id, movieId: t.movie?._id, seat: t.seat, paid: t.paid, bookedAt: t.bookedAt });
});

router.get('/tickets/me', isLoggedIn, async (req, res) => {
  const list = await Ticket.find({ userId: req.session.user.id }).populate('movie');
  res.json(list.map(t => ({ id: t._id, movieId: t.movie?._id, movieTitle: t.movie?.title, seat: t.seat, paid: t.paid, bookedAt: t.bookedAt })));
});

module.exports = router;
