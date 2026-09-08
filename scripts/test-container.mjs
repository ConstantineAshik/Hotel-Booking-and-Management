import "dotenv/config";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";

const suffix = randomBytes(6).toString("hex");
const name = `hotel_container_${suffix}`;
const container = `hotel-qa-${suffix}`;
const url = new URL(process.env.DATABASE_URL);
if (url.hostname !== "localhost" || url.port !== "55432") throw new Error("Use the isolated local PostgreSQL instance.");
url.hostname = "host.docker.internal";
url.pathname = `/${name}`;
const env = { ...process.env, DATABASE_URL: url.href, APP_URL: "http://localhost:3002", SESSION_SECRET: randomBytes(32).toString("hex"), EMAIL_API_KEY: "", EMAIL_FROM: "" };
const docker = args => execFileSync("docker", args, { env, stdio: "pipe", windowsHide: true }).toString();
const args = ["--env", "DATABASE_URL", "--env", "APP_URL", "--env", "SESSION_SECRET", "--env", "EMAIL_API_KEY", "--env", "EMAIL_FROM"];
docker(["exec", "booking-postgres", "createdb", "-U", "hotel", name]);
try {
  docker(["run", "--rm", ...args, "hotel-booking-platform:qa", "./node_modules/.bin/prisma", "migrate", "deploy"]);
  console.log("PASS: container migrations");
  docker(["run", "--rm", ...args, "hotel-booking-platform:qa", "./node_modules/.bin/tsx", "scripts/worker.ts", "--once"]);
  console.log("PASS: container worker");
  docker(["run", "--detach", "--name", container, "--publish", "127.0.0.1:3002:3000", ...args, "hotel-booking-platform:qa"]);
  let healthy = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { const response = await fetch("http://localhost:3002/api/health"); if(response.ok) { assert.deepEqual(await response.json(), {status:"ok"}); healthy = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(healthy, "Container becomes healthy");
  const page = await fetch("http://localhost:3002/setup");
  assert.equal(page.status, 200);
  assert.ok((await page.text()).includes("Create my hotel"));
  console.log("PASS: standalone container health and setup page");
} finally {
  try { docker(["rm", "--force", container]); } catch {}
  docker(["exec", "booking-postgres", "dropdb", "--force", "-U", "hotel", name]);
}
