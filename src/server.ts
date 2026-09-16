import "dotenv/config";
import app from "./app.js";
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Savorly API running on http://localhost:${PORT}`);
});