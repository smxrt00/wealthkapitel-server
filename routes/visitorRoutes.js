// const express = require("express");
// const router = express.Router();
// const sendEmail = require("../utils/sendEmail");

// router.post("/all", async (req, res) => {
//   try {
//     const { page } = req.body;
//     const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress; // 👈 get IP directly
//     const adminEmail = process.env.ADMIN_EMAIL;

//     await sendEmail(
//       "🚨 New Visitor Alert",
//       adminEmail,
//       process.env.EMAIL_USER,
//       process.env.EMAIL_USER,
//       "visitorAlert", // 👈 must match visitorAlert.handlebars
//       "Admin",
//       null,
//       null,
//       null,
//       null,
//       null,
//       null,
//       null,
//       {
//         page,
//         ip,
//         date: new Date().toLocaleString(),
//       }
//     );

//     res.status(200).json({ message: "Visitor notification sent" });
//     console.log("Visitor logged:", {
//       page,
//       ip,
//       date: new Date().toLocaleString(),
//     });
//   } catch (err) {
//     console.error("Visitor notification error:", err);
//     res.status(500).json({ error: "Failed to notify admin" });
//   }
// });

// module.exports = router;





const express = require("express");
const axios = require("axios"); // 👈 install axios if not already: npm i axios
const router = express.Router();
const sendEmail = require("../utils/sendEmail");

router.post("/all", async (req, res) => {
  try {
    const { page } = req.body;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Fetch location info from ip-api
    let location = "Unknown";
    try {
      const { data } = await axios.get(`http://ip-api.com/json/${ip}`);
      if (data && data.status === "success") {
        location = `${data.city}, ${data.regionName}, ${data.country}`;
      }
    } catch (locErr) {
      console.error("Location lookup failed:", locErr.message);
    }

    const adminEmail = process.env.ADMIN_EMAIL;

    await sendEmail(
      "🚨 New Visitor Alert",
      adminEmail,
      process.env.EMAIL_USER,
      process.env.EMAIL_USER,
      "visitorAlert", // template
      "Admin",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      {
        page,
        ip,
        location, // 👈 add location
        date: new Date().toLocaleString(),
      }
    );

    res.status(200).json({ message: "Visitor notification sent" });
    console.log("Visitor logged:", {
      page,
      ip,
      location,
      date: new Date().toLocaleString(),
    });
  } catch (err) {
    console.error("Visitor notification error:", err);
    res.status(500).json({ error: "Failed to notify admin" });
  }
});

module.exports = router;
