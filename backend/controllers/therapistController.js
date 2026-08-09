import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import therapistScheduleModel from "../models/therapistScheduleModel.js";
import slotHoldModel from "../models/slotHoldModel.js";
import appointmentModel from "../models/appointmentModel.js";

// --------------------------------------------------
// Default Therapist Schedule
// --------------------------------------------------

const defaultSchedule = [
  {
    dayOfWeek: "MONDAY",
    windows: [
      { startTime: "10:00", endTime: "10:30" },
      { startTime: "13:30", endTime: "14:00" },
      { startTime: "14:30", endTime: "15:00" },
      { startTime: "15:30", endTime: "16:30" },
    ],
  },
  {
    dayOfWeek: "TUESDAY",
    windows: [
      { startTime: "16:30", endTime: "17:30" },
      { startTime: "17:00", endTime: "17:30" },
      { startTime: "17:30", endTime: "18:00" },
    ],
  },
  {
    dayOfWeek: "THURSDAY",
    windows: [
      { startTime: "13:30", endTime: "14:00" },
      { startTime: "14:00", endTime: "14:30" },
      { startTime: "14:30", endTime: "15:00" },
      { startTime: "15:30", endTime: "16:30" },
    ],
  },
  {
    dayOfWeek: "FRIDAY",
    windows: [
      { startTime: "10:00", endTime: "10:30" },
      { startTime: "13:30", endTime: "14:00" },
      { startTime: "14:30", endTime: "15:00" },
      { startTime: "15:30", endTime: "16:30" },
    ],
  },
];

// --------------------------------------------------
// Create Therapist Account
// --------------------------------------------------

const createTherapist = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.json({
        success: false,
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const therapistData = {
      name,
      email,
      password: hashedPassword,
      role: "THERAPIST",
    };

    const therapist = new userModel(therapistData);

    await therapist.save();

    // Create the predefined weekly schedule
    await therapistScheduleModel.insertMany(
      defaultSchedule.map((schedule) => ({
        therapistId: therapist._id,
        dayOfWeek: schedule.dayOfWeek,
        windows: schedule.windows,
      })),
    );

    res.json({
      success: true,
      message: "Therapist created successfully",
      therapist,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// Create Therapist Schedule
// --------------------------------------------------

const createSchedule = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { dayOfWeek, windows } = req.body;

    if (req.user.role !== "THERAPIST") {
      return res.json({
        success: false,
        message: "Only therapists can create schedules",
      });
    }

    if (!dayOfWeek || !windows || windows.length === 0) {
      return res.json({
        success: false,
        message: "Day and availability windows are required",
      });
    }

    const schedule = new therapistScheduleModel({
      therapistId,
      dayOfWeek,
      windows,
    });

    await schedule.save();

    res.json({
      success: true,
      message: "Schedule created successfully",
      schedule,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// Get Therapist Schedule
// --------------------------------------------------

const getSchedule = async (req, res) => {
  try {
    const therapistId = req.user.id;

    if (req.user.role !== "THERAPIST") {
      return res.json({
        success: false,
        message: "Only therapists can view therapist schedules",
      });
    }

    const schedule = await therapistScheduleModel.find({
      therapistId,
    });

    res.json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// Get Therapist Availability
// --------------------------------------------------

const getAvailability = async (req, res) => {
  try {
    const { therapistId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.json({
        success: false,
        message: "Date is required",
      });
    }

    // Validate requested date
    const requestedDate = new Date(date);

    if (isNaN(requestedDate.getTime())) {
      return res.json({
        success: false,
        message: "Invalid date",
      });
    }

    // Convert date to day of week
    const days = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];

    const dayOfWeek = days[requestedDate.getDay()];

    // Find therapist schedule
    const schedule = await therapistScheduleModel.findOne({
      therapistId,
      dayOfWeek,
    });

    if (!schedule) {
      return res.json({
        success: true,
        date,
        dayOfWeek,
        slots: [],
      });
    }

    // Create date boundaries
    const dateStart = new Date(`${date}T00:00:00`);
    const dateEnd = new Date(`${date}T23:59:59.999`);

    // Find existing appointments
    const appointments = await appointmentModel.find({
      therapistId,

      startTime: {
        $lt: dateEnd,
      },

      endTime: {
        $gt: dateStart,
      },

      status: {
        $in: ["scheduled", "completed", "no_show"],
      },
    });

    // Find active holds
    const activeHolds = await slotHoldModel.find({
      therapistId,

      expiresAt: {
        $gt: new Date(),
      },

      startTime: {
        $lt: dateEnd,
      },

      endTime: {
        $gt: dateStart,
      },
    });

    // Remove unavailable windows
    const availableSlots = schedule.windows.filter((window) => {
      const windowStart = new Date(`${date}T${window.startTime}:00`);

      const windowEnd = new Date(`${date}T${window.endTime}:00`);

      // Existing appointment conflict
      const appointmentConflict = appointments.some(
        (appointment) =>
          windowStart < appointment.endTime &&
          windowEnd > appointment.startTime,
      );

      if (appointmentConflict) {
        return false;
      }

      // Active hold conflict
      const holdConflict = activeHolds.some(
        (hold) => windowStart < hold.endTime && windowEnd > hold.startTime,
      );

      if (holdConflict) {
        return false;
      }

      return true;
    });

    res.json({
      success: true,
      date,
      dayOfWeek,
      slots: availableSlots,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// Update Appointment Status
// --------------------------------------------------

const updateAppointmentStatus = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { appointmentId, status } = req.body;

    const allowedStatuses = ["completed", "no_show", "cancelled"];

    if (!appointmentId || !status) {
      return res.json({
        success: false,
        message: "appointmentId and status are required",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.json({
        success: false,
        message: "Invalid appointment status",
      });
    }

    const appointment = await appointmentModel.findOne({
      _id: appointmentId,
      therapistId,
    });

    if (!appointment) {
      return res.json({
        success: false,
        message: "Appointment not found or unauthorized",
      });
    }

    // Prevent changing an already finalized appointment
    if (
      appointment.status === "completed" ||
      appointment.status === "no_show" ||
      appointment.status === "cancelled"
    ) {
      return res.json({
        success: false,
        message: "Appointment status can no longer be changed",
      });
    }

    const now = new Date();

    // Therapist can update status only during the appointment window
    if (now < appointment.startTime || now > appointment.endTime) {
      return res.json({
        success: false,
        message:
          "Appointment status can only be updated during the appointment window",
      });
    }

    appointment.status = status;

    await appointment.save();

    res.json({
      success: true,
      message: "Appointment status updated successfully",
      appointment,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------------------------------------
// Get All Therapists
// --------------------------------------------------

const getTherapists = async (req, res) => {
  try {
    const therapists = await userModel
      .find({ role: "THERAPIST" })
      .select("-password");

    res.json({
      success: true,
      therapists,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

const getTherapistAppointments = async (req, res) => {
  try {
    const therapistId = req.user.id;

    if (req.user.role !== "THERAPIST") {
      return res.json({
        success: false,
        message: "Only therapists can view appointments",
      });
    }

    const appointments = await appointmentModel
      .find({ therapistId })
      .populate("patientId", "name email")
      .sort({ startTime: 1 });

    res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { dayOfWeek, windows } = req.body;

    // Only therapists can update schedules
    if (req.user.role !== "THERAPIST") {
      return res.json({
        success: false,
        message: "Only therapists can update schedules",
      });
    }

    // Validate required fields
    if (!dayOfWeek || !Array.isArray(windows)) {
      return res.json({
        success: false,
        message: "Day and availability windows are required",
      });
    }

    // Validate day
    const validDays = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];

    if (!validDays.includes(dayOfWeek)) {
      return res.json({
        success: false,
        message: "Invalid day of week",
      });
    }

    // Validate windows
    for (const window of windows) {
      if (!window.startTime || !window.endTime) {
        return res.json({
          success: false,
          message: "Each window must have a start and end time",
        });
      }

      if (window.startTime >= window.endTime) {
        return res.json({
          success: false,
          message: "Window end time must be after start time",
        });
      }
    }

    // Find existing schedule
    const schedule = await therapistScheduleModel.findOneAndUpdate(
      {
        therapistId,
        dayOfWeek,
      },
      {
        $set: {
          windows,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    res.json({
      success: true,
      message: "Schedule updated successfully",
      schedule,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createTherapist,
  createSchedule,
  getSchedule,
  getAvailability,
  updateAppointmentStatus,
  getTherapists,
  getTherapistAppointments,
  updateSchedule,
};
