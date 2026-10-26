import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import User from "../models/User.js";
import { connectDatabase } from "../config/database.js";

const router = Router();
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false });
const COOKIE = "aetherly_session";

export function isValidPassword(password) {
  return typeof password === "string" && password.length >= 10 && Buffer.byteLength(password, "utf8") <= 72;
}

function credentialsAvailable(res) {
  if (!process.env.MONGODB_URI) {
    res.status(503).json({ error: { message: "Account sync needs a MongoDB connection. Local preferences remain available." } });
    return false;
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    res.status(503).json({ error: { message: "Set JWT_SECRET to a random secret of at least 32 characters to enable accounts." } });
    return false;
  }
  return true;
}

export async function requireUser(req, res, next) {
  const token = req.cookies?.[COOKIE];
  if (!token) return res.status(401).json({ error: { message: "Sign in to sync your saved places." } });
  if (!credentialsAvailable(res)) return;
  try {
    await connectDatabase();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: { message: "Your session has expired. Please sign in again." } });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ error: { message: "Your session has expired. Please sign in again." } });
    }
    next(error);
  }
}

function setSession(res, userId) {
  const token = jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { expiresIn: "14d" });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 14 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function publicUser(user) {
  return {
    email: user.email,
    favorites: user.favorites.map((item) => item.toObject ? item.toObject() : item),
    preferences: user.preferences,
  };
}

router.post("/register", authLimit, async (req, res, next) => {
  if (!credentialsAvailable(res)) return;
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return res.status(400).json({ error: { message: "Enter a valid email address." } });
  if (!isValidPassword(password)) return res.status(400).json({ error: { message: "Use a password with at least 10 characters and no more than 72 UTF-8 bytes." } });
  try {
    await connectDatabase();
    if (await User.exists({ email })) return res.status(409).json({ error: { message: "An account with this email already exists." } });
    const user = await User.create({ email, passwordHash: await bcrypt.hash(password, 12) });
    setSession(res, user._id);
    res.status(201).json({ data: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: { message: "An account with this email already exists." } });
    next(error);
  }
});

router.post("/login", authLimit, async (req, res, next) => {
  if (!credentialsAvailable(res)) return;
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  if (!isValidPassword(password)) return res.status(401).json({ error: { message: "Email or password is incorrect." } });
  try {
    await connectDatabase();
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: { message: "Email or password is incorrect." } });
    setSession(res, user._id);
    res.json({ data: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  res.status(204).end();
});

router.get("/me", async (req, res, next) => {
  const token = req.cookies?.[COOKIE];
  if (!token || !process.env.MONGODB_URI || !process.env.JWT_SECRET) return res.json({ data: { authenticated: false } });
  try {
    await connectDatabase();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.json({ data: { authenticated: false } });
    res.json({ data: { authenticated: true, ...publicUser(user) } });
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") return res.json({ data: { authenticated: false } });
    next(error);
  }
});

export default router;
