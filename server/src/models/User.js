import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  country: { type: String, default: "", trim: true, maxlength: 80 },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  timezone: { type: String, default: "UTC", maxlength: 80 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  favorites: { type: [favoriteSchema], default: [] },
  preferences: {
    unit: { type: String, enum: ["celsius", "fahrenheit"], default: "celsius" },
    theme: { type: String, enum: ["light", "dark"], default: "light" },
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
