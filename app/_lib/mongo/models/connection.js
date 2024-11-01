const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(

  {
    UID: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      required: false,
    },
    linkedinUrl: {
      type: String,
      required: false,
    },
    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    position: {
      type: String,
      required: false,
    },
    companyName: {
      type: String,
      required: false,
    },
    companyURL: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      maxlength: 200,
    },
    remindTime: {
      type: Date,
      required: true,
      default: () => {
        const currentTime = new Date();

        currentTime.setHours(currentTime.getHours()); // Example: remindTime = current time + 1 hour

        return currentTime;
      },
    },
    reminded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

// Compound index on reminded and UID for efficient retrieval of unreminded entries by connection
connectionSchema.index({ reminded: 1, UID: 1 });

// Optional index on remindTime for time-based queries in the cron job
connectionSchema.index({ remindTime: 1 });

export const Connection = mongoose.models.Connection || mongoose.model("Connection", connectionSchema);