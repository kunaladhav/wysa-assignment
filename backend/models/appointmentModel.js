import mongoose, { Schema } from "mongoose";

const appointmentSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    therapistId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "completed", "no_show", "cancelled"],
      default: "scheduled",
      required: true,
    },

    recurringSeriesId: {
      type: Schema.Types.ObjectId,
      ref: "recurringSeries",
      default: null,
    },

    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    bookingKey: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

appointmentSchema.index(
  { bookingKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["scheduled", "completed", "no_show"] },
    },
  },
);

const appointmentModel =
  mongoose.models.appointment ||
  mongoose.model("appointment", appointmentSchema);

export default appointmentModel;
