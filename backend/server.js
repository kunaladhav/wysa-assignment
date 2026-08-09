import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";
import therapistRouter from "./routes/therapistRoute.js";

// App Config

const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// Middlewares

app.use(express.json());
app.use(
  cors({
    origin: [
      "https://prescripto-gamma-three.vercel.app",
      "https://prescripto-oug2.vercel.app",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
    credentials: true,
  }),
);

// API Endpoints
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
app.use("/api/therapist", therapistRouter);

app.get("/", (req, res) => {
  res.send("API WORKING NICE");
});

app.listen(port, () => console.log("Server Started", port));
