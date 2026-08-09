import slotHoldModel from "../models/slotHoldModel.js";
import appointmentModel from "../models/appointmentModel.js";

const createSlotHold = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { therapistId, startTime, endTime } = req.body;

    if (!therapistId || !startTime || !endTime) {
      return res.json({
        success: false,
        message: "Missing required fields",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.json({
        success: false,
        message: "Invalid startTime or endTime",
      });
    }

    if (start >= end) {
      return res.json({
        success: false,
        message: "Invalid appointment time",
      });
    }

    const now = new Date();

    // Check whether this slot is already actively held
    const existingHold = await slotHoldModel.findOne({
      therapistId,
      startTime: start,
      endTime: end,
      expiresAt: { $gt: now },
    });

    if (existingHold) {
      return res.json({
        success: false,
        message: "Slot is currently held by another patient",
      });
    }

    const expiresAt = new Date(Date.now() + 60 * 1000);

    const hold = await slotHoldModel.create({
      patientId,
      therapistId,
      startTime: start,
      endTime: end,
      expiresAt,
    });

    res.json({
      success: true,
      message: "Slot held successfully",
      hold,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

const getActiveSlotHold = async (req, res) => {
  try {
    const patientId = req.user.id;
    const now = new Date();

    const hold = await slotHoldModel.findOne({
      patientId,
      expiresAt: { $gt: now },
    });

    if (!hold) {
      return res.json({
        success: true,
        hold: null,
      });
    }

    const remainingSeconds = Math.max(
      0,
      Math.floor((hold.expiresAt.getTime() - Date.now()) / 1000),
    );

    res.json({
      success: true,
      hold,
      remainingSeconds,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

const confirmSlotHold = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { holdId, idempotencyKey } = req.body;

    if (!holdId || !idempotencyKey) {
      return res.json({
        success: false,
        message: "holdId and idempotencyKey are required",
      });
    }

    // Check whether this request was already processed
    const existingAppointment = await appointmentModel.findOne({
      idempotencyKey,
    });

    if (existingAppointment) {
      return res.json({
        success: true,
        message: "Appointment already created",
        appointment: existingAppointment,
      });
    }

    // Find an active hold belonging to this patient
    const hold = await slotHoldModel.findOne({
      _id: holdId,
      patientId,
      expiresAt: { $gt: new Date() },
    });

    if (!hold) {
      return res.json({
        success: false,
        message: "Hold does not exist, has expired, or is not yours",
      });
    }

    // Create a unique identity for this therapist/time slot
    const bookingKey = `${hold.therapistId}_${hold.startTime.toISOString()}_${hold.endTime.toISOString()}`;

    try {
      const appointment = await appointmentModel.create({
        patientId: hold.patientId,
        therapistId: hold.therapistId,
        startTime: hold.startTime,
        endTime: hold.endTime,
        status: "scheduled",
        recurringSeriesId: null,
        idempotencyKey,
        bookingKey,
      });

      // Consume the hold after successful booking
      await slotHoldModel.findByIdAndDelete(hold._id);

      return res.json({
        success: true,
        message: "Appointment booked successfully",
        appointment,
      });
    } catch (error) {
      // MongoDB duplicate-key error
      if (error.code === 11000) {
        return res.json({
          success: false,
          message: "Slot is no longer available",
        });
      }

      throw error;
    }
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

export { createSlotHold, getActiveSlotHold, confirmSlotHold };
