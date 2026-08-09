import mongoose, { Schema } from "mongoose";

const recurringSeriesSchema = new Schema(
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

    frequency: {
      type: String,
      enum: ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    dayOfWeek: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

const recurringSeriesModel =
  mongoose.models.recurringSeries ||
  mongoose.model("recurringSeries", recurringSeriesSchema);

export default recurringSeriesModel;
