import express from "express";
import {
  getProfile,
  loginUser,
  registerUser,
  updateProfile,
  bookAppointment,
  listAppointments,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/multer.js";
import {
  createSlotHold,
  getActiveSlotHold,
  confirmSlotHold,
} from "../controllers/slotHoldController.js";
import {
  createRecurringSeries,
  generateRecurringAppointments,
} from "../controllers/recurringController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

userRouter.get("/get-profile", authUser, getProfile);

userRouter.post(
  "/update-profile",
  upload.single("image"),
  authUser,
  updateProfile,
);
userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/appointments", authUser, listAppointments);
userRouter.post("/cancel-appointment", authUser, cancelAppointment);
userRouter.post("/payment-razorpay", authUser, paymentRazorpay);
userRouter.post("/verify-razorpay", authUser, verifyRazorpay);

userRouter.post("/hold-slot", authUser, createSlotHold);
userRouter.get("/active-hold", authUser, getActiveSlotHold);
userRouter.post("/confirm-slot", authUser, confirmSlotHold);

userRouter.post("/recurring-series", authUser, createRecurringSeries);
userRouter.post(
  "/generate-recurring-appointments",
  authUser,
  generateRecurringAppointments,
);

export default userRouter;
