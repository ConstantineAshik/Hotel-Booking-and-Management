import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

if (existsSync(".env")) throw new Error(".env already exists; use your existing database configuration.");
const password = randomBytes(32).toString("hex");
execFileSync("docker", ["run", "--detach", "--name", "booking-postgres", "--publish", "127.0.0.1:55432:5432",
  "--env", "POSTGRES_USER=hotel", "--env", `POSTGRES_PASSWORD=${password}`, "--env", "POSTGRES_DB=hotel",
  "--volume", "booking-postgres-data:/var/lib/postgresql/data", "postgres:17-alpine"], { stdio: "pipe" });
writeFileSync(".env", `DATABASE_URL="postgresql://hotel:${password}@localhost:55432/hotel"\nAPP_URL="http://localhost:3000"\nSETUP_TOKEN="${randomBytes(32).toString("hex")}"\nSESSION_SECRET="${randomBytes(32).toString("hex")}"\n`);
console.log("Local database started on localhost:55432; generated credentials saved to ignored .env.");
