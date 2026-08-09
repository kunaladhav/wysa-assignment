import mongoose, { Schema } from "mongoose";

const therapistScheduleSchema = new Schema(
  {
    therapistId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    dayOfWeek: {
      type: String,
      enum: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ],
      required: true,
    },

    windows: [
      {
        startTime: {
          type: String,
          required: true,
        },

        endTime: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const therapistScheduleModel =
  mongoose.models.therapistSchedule ||
  mongoose.model("therapistSchedule", therapistScheduleSchema);

export default therapistScheduleModel;
