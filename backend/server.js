import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import userRouter from "./routes/userRoute.js";
import therapistRouter from "./routes/therapistRoute.js";

// App Config

const app = express();
const port = process.env.PORT || 4000;
connectDB();

// Middlewares

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://wysa-assignment-murex.vercel.app/",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
    credentials: true,
  }),
);

// API Endpoints
app.use("/api/user", userRouter);
app.use("/api/therapist", therapistRouter);

app.get("/", (req, res) => {
  res.send("API WORKING NICE");
});

app.listen(port, () => console.log("Server Started", port));
