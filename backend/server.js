const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const connectDB = require("./config/database");

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://raftlabs-om27.onrender.com",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Backend API" });
});

// Import routes
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");

app.use("/api/v1/menus", menuRoutes);
app.use("/api/v1/orders", orderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: err.message,
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown - clear all timers
process.on("SIGTERM", () => {
  console.log("SIGTERM received, clearing timers...");
  const AutoStatusUpdater = require("./utils/autoStatusUpdater");
  AutoStatusUpdater.clearAllTimers();
  server.close(() => {
    console.log("Process terminated");
  });
});

module.exports = app;
