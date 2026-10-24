require("dotenv").config();
const express = require("express");
const { connectDB } = require("./config/db");

const dataRoutes = require("./routes/dataRoutes");
const webRoutes = require("./routes/webRoutes");

const app = express();

// Enable CORS for company website integration
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-Id");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// API health and info endpoint
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Deific Digital AI Assistant Backend API",
    voice: "English only (no conversion required)",
    endpoints: {
      start: "POST /web/start",
      chat: "POST /web/chat",
      tts: "POST /web/tts",
      stt: "POST /web/stt",
      leads: "GET /api/leads",
      conversations: "GET /api/conversations",
      messages: "GET /api/messages",
    },
  });
});

app.use("/api", dataRoutes);
app.use("/web", webRoutes);

const PORT = process.env.PORT || 8787;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] AI Receptionist API listening on port ${PORT}`);
      console.log(`[server] Ready for company website integration: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[server] Failed to start:", err);
    process.exit(1);
  });
