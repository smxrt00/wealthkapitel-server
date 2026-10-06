require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const userRoute = require("./routes/userRoute");
const paymentRoutes = require("./routes/paymentRoutes");
const investmentRoutes = require("./routes/investmentRoutes");
const withDrawRoutes = require("./routes/withdrawRoutes");
const countriesRoutes = require("./routes/countriesRoutes");
const errorHandler = require("./middleware/errorMiddleware");
const seedPlans = require("./utils/seedInvestmentPlans");
// const visitorRoutes = require("./routes/visitorRoutes");

const app = express();

/* ---------- Database (cached for serverless) ---------- */

const cache = global.__mongoCache || (global.__mongoCache = {
  promise: null,
  seeded: false,
});

const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (!process.env.MONGO_DB_URL) {
    throw new Error("MONGO_DB_URL is not set in the environment");
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(process.env.MONGO_DB_URL, {
        serverSelectionTimeoutMS: 8000,
        bufferCommands: false,
      })
      .then(() => console.log("Database connected"))
      .catch((error) => {
        cache.promise = null;
        throw error;
      });
  }

  await cache.promise;

  // Seed once per instance. A seeding failure must never block requests.
  if (!cache.seeded) {
    cache.seeded = true;
    try {
      await seedPlans();
    } catch (error) {
      cache.seeded = false;
      console.error("Seeding failed:", error.message);
    }
  }
};

/* ---------- Middlewares ---------- */

app.set("trust proxy", 1);

let frontendOrigin = null;
try {
  frontendOrigin = new URL(process.env.FRONTEND_URL).origin;
} catch {
  console.warn("FRONTEND_URL is missing or invalid");
}

app.use(
  cors({
    origin: [
      frontendOrigin,
      "https://wealthkapitel.com",
      "https://www.wealthkapitel.com",
      "https://backend.wealthkapitel.com",
      "http://localhost:5173",
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Works only for files committed with your code. Runtime uploads will not persist on Vercel.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ---------- Database gate for API routes ---------- */

app.use("/api", async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    console.error("Database connection error:", error.message);
    res.status(503).json({ message: "Service temporarily unavailable" });
  }
});

/* ---------- Routes ---------- */

app.use("/api/users", userRoute);
app.use("/api/payments", paymentRoutes);
app.use("/api/invest", investmentRoutes);
app.use("/api/withDraw", withDrawRoutes);
app.use("/api", countriesRoutes);
// app.use("/api/visitors", visitorRoutes);

app.get("/", (req, res) => {
  res.send("Home Page");
});

/* ---------- Error handler ---------- */

app.use(errorHandler);

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 9009;
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}