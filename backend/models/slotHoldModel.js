import mongoose, { Schema } from "mongoose";

const slotHoldSchema = new Schema(
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

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const slotHoldModel =
  mongoose.models.slotHold || mongoose.model("slotHold", slotHoldSchema);

export default slotHoldModel;
