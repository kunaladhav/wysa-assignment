import recurringSeriesModel from "../models/recurringSeriesModel.js";
import appointmentModel from "../models/appointmentModel.js";
import slotHoldModel from "../models/slotHoldModel.js";

const createRecurringSeries = async (req, res) => {
  try {
    const patientId = req.user.id;

    const { therapistId, startDate, endDate, startTime, endTime, frequency } =
      req.body;

    if (
      !therapistId ||
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime ||
      !frequency
    ) {
      return res.json({
        success: false,
        message: "Missing required fields",
      });
    }

    const allowedFrequencies = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"];

    if (!allowedFrequencies.includes(frequency)) {
      return res.json({
        success: false,
        message: "Invalid recurrence frequency",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.json({
        success: false,
        message: "Invalid startDate or endDate",
      });
    }

    if (start > end) {
      return res.json({
        success: false,
        message: "startDate cannot be after endDate",
      });
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.json({
        success: false,
        message: "Time must be in HH:mm format",
      });
    }

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (startMinutes >= endMinutes) {
      return res.json({
        success: false,
        message: "startTime must be before endTime",
      });
    }

    const dayOfWeek =
      frequency === "WEEKLY" || frequency === "BIWEEKLY"
        ? start.getDay()
        : null;

    const recurringSeries = await recurringSeriesModel.create({
      patientId,
      therapistId,
      frequency,
      startDate: start,
      endDate: end,
      startTime,
      endTime,
      dayOfWeek,
    });

    res.json({
      success: true,
      message: "Recurring series created successfully",
      recurringSeries,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Generate appointments for a recurring series

const generateRecurringAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { seriesId } = req.body;

    if (!seriesId) {
      return res.json({
        success: false,
        message: "seriesId is required",
      });
    }

    // Find the recurring series
    const series = await recurringSeriesModel.findOne({
      _id: seriesId,
      patientId,
      status: "active",
    });

    if (!series) {
      return res.json({
        success: false,
        message: "Recurring series not found",
      });
    }

    const appointments = [];
    const conflicts = [];

    let currentDate = new Date(series.startDate);
    const endDate = new Date(series.endDate);

    while (currentDate <= endDate) {
      let shouldCreate = false;

      // Determine whether this date is an occurrence
      if (series.frequency === "DAILY") {
        shouldCreate = true;
      }

      if (series.frequency === "WEEKLY") {
        shouldCreate = currentDate.getDay() === series.dayOfWeek;
      }

      if (series.frequency === "BIWEEKLY") {
        const daysDifference = Math.floor(
          (currentDate - series.startDate) / (1000 * 60 * 60 * 24),
        );

        shouldCreate =
          currentDate.getDay() === series.dayOfWeek &&
          daysDifference % 14 === 0;
      }

      if (series.frequency === "MONTHLY") {
        shouldCreate = currentDate.getDate() === series.startDate.getDate();
      }

      if (shouldCreate) {
        const dateString = currentDate.toISOString().split("T")[0];

        const startTime = new Date(`${dateString}T${series.startTime}:00.000Z`);

        const endTime = new Date(`${dateString}T${series.endTime}:00.000Z`);

        const bookingKey = `${series.therapistId}_${startTime.toISOString()}_${endTime.toISOString()}`;

        // Check whether appointment already exists
        const existingAppointment = await appointmentModel.findOne({
          bookingKey,
          status: { $ne: "cancelled" },
        });

        if (existingAppointment) {
          conflicts.push({
            startTime,
            endTime,
            reason: "Already booked",
          });
        } else {
          // Check whether another patient currently holds the slot
          const activeHold = await slotHoldModel.findOne({
            therapistId: series.therapistId,
            startTime,
            endTime,
            expiresAt: { $gt: new Date() },
          });

          if (activeHold && activeHold.patientId.toString() !== patientId) {
            conflicts.push({
              startTime,
              endTime,
              reason: "Slot is actively held by another patient",
            });
          } else {
            const idempotencyKey = `${series._id}_${startTime.toISOString()}`;

            // Check idempotency
            const existingByIdempotency = await appointmentModel.findOne({
              idempotencyKey,
            });

            if (existingByIdempotency) {
              appointments.push(existingByIdempotency);
            } else {
              const appointment = await appointmentModel.create({
                patientId: series.patientId,
                therapistId: series.therapistId,
                startTime,
                endTime,
                status: "scheduled",
                recurringSeriesId: series._id,
                idempotencyKey,
                bookingKey,
              });

              appointments.push(appointment);
            }
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      message: "Recurring appointments processed",
      appointments,
      conflicts,
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

export { createRecurringSeries, generateRecurringAppointments };
