import express from "express";
import {
  createTherapist,
  createSchedule,
  getSchedule,
  getAvailability,
  updateAppointmentStatus,
  getTherapists,
  getTherapistAppointments,
  updateSchedule,
} from "../controllers/therapistController.js";
import authUser from "../middlewares/authUser.js";

const therapistRouter = express.Router();

therapistRouter.post("/create", createTherapist);
therapistRouter.post("/schedule", authUser, createSchedule);
therapistRouter.get("/schedule", authUser, getSchedule);
therapistRouter.get("/:therapistId/availability", getAvailability);
therapistRouter.patch("/appointment-status", authUser, updateAppointmentStatus);
therapistRouter.get("/list", getTherapists);
therapistRouter.get("/appointments", authUser, getTherapistAppointments);
therapistRouter.patch("/schedule", authUser, updateSchedule);
export default therapistRouter;
