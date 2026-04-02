const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const downloadRoutes = require("./routes/downloadRoutes");
const historyRoutes = require("./routes/historyRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const browserRoutes = require("./routes/browserRoutes");
const eventsRoutes = require("./routes/eventsRoutes");
const { notFoundHandler } = require("./middlewares/notFoundHandler");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === "null") {
        callback(null, true);
        return;
      }

      const allowed =
        origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");

      callback(allowed ? null : new Error("Origin não permitida"), allowed);
    },
    credentials: false
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/health", healthRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/downloads", downloadRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/browser", browserRoutes);
app.use("/api/events", eventsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
