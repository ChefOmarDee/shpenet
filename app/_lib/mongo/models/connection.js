import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    lat: {
        type: Number,
        required: true,
    },
    long: {
        type: Number,
        required: true,
    },
    title: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    projectId: {
      type: String,
      required: true,
      unique: true,
    },
    uid: {
      type: String,
      required: true,
    },
    wid: {
      type: String,
      required: false,
    },
    cost: {
        type: mongoose.Decimal128,
        default: 0,
    },
    donated: {
      type: mongoose.Decimal128,
      default: 0,
    },
    status: {
      type: String,
      enum: ["open", "in progress", "closed"],
      required: true,
    },
    pictureUrl: {
      type: String,
      default: "",
    },
    tag: {
      type: String,
      enum: ["environmental", "infrastructure damage", "infrastructure addition"],
      required: true,
    },
  },
  { collection: "connections" }
);

export const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);