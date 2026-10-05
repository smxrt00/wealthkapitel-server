require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path"); // Required for serving static files
const userRoute = require("./routes/userRoute");
const paymentRoutes = require("./routes/paymentRoutes");
const investmentRoutes = require("./routes/investmentRoutes");
const withDrawRoutes = require("./routes/withdrawRoutes");
const errorHandler = require("./middleware/errorMiddleware");
const seedPlans = require("./utils/seedInvestmentPlans");
const countriesRoutes = require("./routes/countriesRoutes");
// const visitorRoutes = require("./routes/visitorRoutes");


const app = express();
let databaseConnection;

const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (!databaseConnection) {
    databaseConnection = mongoose
      .connect(process.env.MONGO_DB_URL)
      .then(async () => {
        console.log("Database connected");
        await seedPlans();
      })
      .catch((error) => {
        databaseConnection = null;
        throw error;
      });
  }

  await databaseConnection;
};

// Middlewares
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(bodyParser.json());

// Serve the uploads directory as
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const frontendOrigin = process.env.FRONTEND_URL
  ? new URL(process.env.FRONTEND_URL).origin
  : null;

app.use(
  cors({
    origin: [
      frontendOrigin,
      "https://wealthkapitel.com",
      "https://www.wealthkapitel.com",
      "http://localhost:5173",
      "https://backend.wealthkapitel.com",
    ].filter(Boolean),
    credentials: true,
  })
);

app.use("/api", async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

// Routes
app.use("/api/users", userRoute);
app.use("/api/payments", paymentRoutes);
app.use("/api/invest", investmentRoutes);
app.use("/api/withDraw", withDrawRoutes);
app.use("/api", countriesRoutes);
// app.use("/api/visitors", visitorRoutes);


app.get("/", (req, res) => {
  res.send("Home Page");
});

// Error Handler
app.use(errorHandler);

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 9009;
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
}
