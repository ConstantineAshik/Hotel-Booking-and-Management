import "dotenv/config";
import { spawnSync } from "node:child_process";
const url = new URL(process.env.DATABASE_URL);
if (url.hostname !== "localhost" || url.port !== "55432") throw new Error("This helper only targets the isolated local database.");
url.pathname = "/hotel_test";
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", "tests/database/*.test.ts"], {
  stdio: "inherit", env: { ...process.env, TEST_DATABASE_URL: url.toString() },
});
process.exit(result.status ?? 1);
