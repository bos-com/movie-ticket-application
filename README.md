# MovieFlex (Node.js + React + Java Mailer)

A movie ticket system built on your existing Node/Express app, extended with a React SPA:
- JSON API under `/api` for React
- React SPA (Vite + React Router + Bootstrap)
- Admin CRUD, user authentication via session, booking with seat validation, and simple payment flag

## Tech stack
- Backend: Node.js, Express, Mongoose, express-session, connect-flash, express-validator
- Mailer: Java 17, Spring Boot (Web, Mail, Validation, Actuator)
- Frontend: React (Vite), React Router, Bootstrap 5 (CDN)
- Database: MongoDB

## Prerequisites
- Node.js 18+
- Java 17+
- Maven 3.9+
- MongoDB running locally or a connection string

## Install the prerequisites
- **Node.js 18+ (includes npm)**
  - Download: https://nodejs.org/
  - Verify: `node -v` and `npm -v`
- **Git**
  - Download: https://git-scm.com/downloads
  - Verify: `git --version`
- **MongoDB Community Server**
  - Download: https://www.mongodb.com/try/download/community
  - Start service (Windows Services) or run `mongod`
  - Optional GUI: MongoDB Compass https://www.mongodb.com/products/compass
- **Java 17 (for mailer service only)**
  - Download: https://adoptium.net/
  - Verify: `java -version`
- **Maven 3.9+ (for mailer service only)**
  - Download: https://maven.apache.org/download.cgi
  - Verify: `mvn -v`

## Environment variables
Create `.env` in project root:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/movieticket_real
SESSION_SECRET=change-this-session-secret
JWT_SECRET=supersecretkey123
# Optional: require a code to create admin accounts during registration
ADMIN_SECRET=your_admin_setup_code

# Frontend CORS origin(s) (comma-separated supported)
FRONTEND_ORIGIN=http://localhost:5173,http://localhost:5174

# Java mailer service
MAILER_URL=http://localhost:8081
MAILER_TOKEN=change-this-mailer-token
```

## Install dependencies
From project root `movie-ticket-system/`:
```
npm install
```
Then for the frontend React app:
```
cd frontend-react
npm install
```

## Seed the database (optional)
To preload some movies for testing:
```
node seedMovies.js
```

## Run the app

### Start Java mailer (Spring Boot)
```
# In backend-java/mailer-service
# Windows PowerShell example
$env:SERVICE_TOKEN="change-this-mailer-token"; mvn spring-boot:run
# Service: http://localhost:8081
```

### Development (separate servers)
- **Backend (API + static images)**
```
# In project root
npm run dev
# Server: http://localhost:5000
```
- **Frontend (React dev server)**
```
# In frontend-react/
npm run dev
# React: http://localhost:5173
```
React calls the Node API at `http://localhost:5000/api` and uses cookies for session auth (CORS enabled with credentials). Ensure your `.env` `FRONTEND_ORIGIN` includes the React dev URL.
Node also exposes a proxy to the Java mailer under `http://localhost:5000/mailer/...` when `MAILER_URL` is configured.

### Optional: Run both dev servers concurrently
```
npm run dev:all
```

## Push to GitHub
1. Create a new repo on GitHub (no README/license/gitignore).
2. In the project root, run:

3. Recommended `.gitignore` (do not commit secrets or dependencies):
```
node_modules/
frontend-react/node_modules/
.env
*.log
dist/
frontend-react/dist/
```

## First-time usage
1. Open React at `http://localhost:5173`.
2. Register a user. To register as admin, check "Register as admin" and provide `ADMIN_SECRET` if configured.
3. As admin, add movies (title, poster filename, seats, show time, optional genre/duration/price).
4. As a user, open a movie, select an available seat, and book. Then optionally "Pay" to mark the ticket as paid.

## API summary (Node JSON API)
- Auth
  - POST `/api/auth/register`
  - POST `/api/auth/login`
  - POST `/api/auth/logout`
  - GET `/api/auth/me`
- Movies
  - GET `/api/movies`
  - GET `/api/movies/:id`
  - POST `/api/movies` (admin)
  - PUT `/api/movies/:id` (admin)
  - DELETE `/api/movies/:id` (admin)
- Booking/Tickets
  - POST `/api/movies/:id/book` (logged-in)
  - POST `/api/tickets/:id/pay` (logged-in, owner)
  - GET `/api/tickets/me` (logged-in)

When paying a ticket, the Node backend will best-effort call the Java mailer endpoint `POST /api/email/ticket` to send a confirmation email. It includes `Authorization: Bearer <MAILER_TOKEN>` if configured.

## Models
- `models/Movie.js`
  - `title`, `poster`, `totalSeats`, `bookedSeats:[Number]`, `showTime`, `genre?`, `duration?`, `price?`
- `models/Ticket.js`
  - `movie` (ref), `seat:Number`, `userId:String`, `paid:Boolean`, `bookedAt:Date`
- `models/User.js`
  - `name`, `email` (unique), `password` (hash), `isAdmin:Boolean`

## React pages (mapped from EJS)
- `Home` (list/search, admin controls)
- `Login`, `Register`
- `Movie Detail` (seat grid + booking + pay)
- `Admin` (table with add/edit/delete)
- `Add/Edit Movie` (form)
- `Dashboard` (my tickets)

## Assets
Place poster images in the Node public folder:
- `public/images/<poster-file>`
React dev references: `http://localhost:5000/images/<poster-file>`

## Folder structure
```
movie-ticket-system/
  index.js
  routes/
    api.js          # JSON API used by React
  models/
    Movie.js
    Ticket.js
    User.js
  public/
    images/
    css/
  backend-java/
    mailer-service/   # Spring Boot mailer (port 8081)
  frontend-react/
    index.html
    vite.config.js
    package.json
    src/
      api.js
      App.jsx
      main.jsx
      state/AuthContext.jsx
      pages/*.jsx
```

## Troubleshooting
- CORS/Session: Ensure `index.js` has `app.use(cors({ origin: 'http://localhost:5173', credentials: true }))` and React `fetch` uses `credentials: 'include'` (configured in `src/api.js`).
- Mongo connection: verify `MONGO_URI` in `.env` and that Mongo is running.
- Admin creation: set `ADMIN_SECRET` in `.env` and provide it when registering as admin.
- Images not loading: ensure poster filenames exist in `public/images/`.
- Java mailer unreachable: confirm `MAILER_URL` is correct and the Spring service is running on `server.port`.
- Token mismatch: set Node `.env` `MAILER_TOKEN` and Java `SERVICE_TOKEN`/`service.token` to the same value.
- SMTP/email not sent: configure `spring.mail.*` properties and use provider-specific app passwords.

