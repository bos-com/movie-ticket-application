const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
require('dotenv').config();
const { createProxyMiddleware } = require('http-proxy-middleware');

const Movie = require('./models/Movie'); // ✅ import Movie model once at the top
const apiRoutes = require('./routes/api');

const app = express();

// (EJS disabled) React will handle views

// Middleware
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static poster images
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Session & flash setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'secretkey',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

// ✅ Make flash messages and user available in all EJS views
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.user = req.session.user || null; 
  next();
});

// Proxy GET requests for movies to Java movie-service (port 8081 by default)
const movieServiceTarget = process.env.MOVIE_SERVICE_URL || 'http://localhost:8082';
const moviesFilter = (pathname, req) => {
  // Disabled: let Node's /api/movies routes handle reads instead of proxying to Java service
  return false;
};
app.use(createProxyMiddleware(moviesFilter, {
  target: movieServiceTarget,
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  logLevel: 'silent',
  onProxyRes(proxyRes) {
    // Remove any CORS headers from the proxied response; let our cors() middleware set them
    delete proxyRes.headers['access-control-allow-origin'];
    delete proxyRes.headers['access-control-allow-credentials'];
    delete proxyRes.headers['access-control-allow-headers'];
    delete proxyRes.headers['access-control-allow-methods'];
  }
}));

// Routes
app.use('/api', apiRoutes); // JSON API for React/clients

// Proxy Java mailer service so frontend can call via Node origin if needed
if (process.env.MAILER_URL) {
  app.use('/mailer', createProxyMiddleware({
    target: process.env.MAILER_URL,
    changeOrigin: true,
    pathRewrite: { '^/mailer': '' },
    logLevel: 'silent'
  }));
}

// Static file serving removed; React app should be served separately

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

