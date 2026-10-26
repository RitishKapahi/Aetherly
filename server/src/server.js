import "dotenv/config";
import app from "./app.js";
import { connectDatabase, isDatabaseConfigured } from "./config/database.js";

const port = Number(process.env.PORT) || 4000;
if (isDatabaseConfigured()) {
  connectDatabase().then(() => console.log("MongoDB connected.")).catch((error) => console.error("MongoDB connection failed; weather endpoints remain available:", error.message));
}
app.listen(port, () => console.log(`Aetherly API listening on http://localhost:${port}`));
