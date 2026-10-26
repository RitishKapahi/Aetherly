import { Router } from "express";
import { requireUser } from "./auth.js";

const router = Router();
router.use(requireUser);

router.get("/favorites", (req, res) => res.json({ data: req.user.favorites }));

router.post("/favorites", async (req, res, next) => {
  const city = req.body?.city;
  const latitude = Number(city?.latitude);
  const longitude = Number(city?.longitude);
  const name = String(city?.name ?? "").trim();
  const id = String(city?.id ?? "").trim();
  if (!id || id.length > 100 || !name || name.length > 80 || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: { message: "Choose a valid location to save." } });
  }
  if (req.user.favorites.length >= 40 && !req.user.favorites.some((item) => item.id === id)) {
    return res.status(409).json({ error: { message: "You can save up to 40 places." } });
  }
  try {
    if (!req.user.favorites.some((item) => item.id === id)) {
      req.user.favorites.push({ id, name, country: String(city.country ?? "").slice(0, 80), latitude, longitude, timezone: String(city.timezone ?? "UTC").slice(0, 80) });
      await req.user.save();
    }
    res.status(201).json({ data: req.user.favorites });
  } catch (error) { next(error); }
});

router.delete("/favorites/:id", async (req, res, next) => {
  try {
    req.user.favorites = req.user.favorites.filter((item) => item.id !== req.params.id);
    await req.user.save();
    res.json({ data: req.user.favorites });
  } catch (error) { next(error); }
});

router.get("/preferences", (req, res) => res.json({ data: req.user.preferences }));
router.put("/preferences", async (req, res, next) => {
  const { unit, theme } = req.body ?? {};
  if ((unit !== undefined && !["celsius", "fahrenheit"].includes(unit)) || (theme !== undefined && !["light", "dark"].includes(theme))) {
    return res.status(400).json({ error: { message: "Preferences contain an unsupported value." } });
  }
  try {
    if (unit) req.user.preferences.unit = unit;
    if (theme) req.user.preferences.theme = theme;
    await req.user.save();
    res.json({ data: req.user.preferences });
  } catch (error) { next(error); }
});

export default router;
