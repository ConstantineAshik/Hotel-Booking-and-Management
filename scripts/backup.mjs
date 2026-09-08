import "dotenv/config";
import { postgresEnvironment } from "./postgres-environment.mjs";
import { spawn } from "node:child_process";
import { cp, mkdir, writeFile } from "node:fs/promises";
import { resolve, join, dirname, relative, isAbsolute } from "node:path";

function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { env: postgresEnvironment(databaseUrl), stdio: "inherit", shell: false, windowsHide: true });
    child.once("error", reject);
    child.once("exit", code => code === 0 ? resolveRun() : reject(new Error(`${command} exited with code ${code}`)));
  });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const requested = process.argv[2];
const stamp = new Date().toISOString().replaceAll(":", "-").replace(".", "-");
const destination = resolve(requested || join("backups", stamp));
const mediaRelative = relative(resolve(".uploads"), destination);
if (!mediaRelative || (!mediaRelative.startsWith("..") && !isAbsolute(mediaRelative))) throw new Error("Backup destination must be outside .uploads.");
await mkdir(dirname(destination), { recursive: true });
await mkdir(destination, { recursive: false });
await run("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", `--file=${join(destination, "database.dump")}`]);
await mkdir(join(destination, "media"));
await cp(resolve(".uploads"), join(destination, "media"), { recursive: true, force: false }).catch(error => {
  if (error?.code !== "ENOENT") throw error;
});
await writeFile(join(destination, "manifest.json"), JSON.stringify({ format: 1, createdAt: new Date().toISOString(), includes: ["database.dump", "media/"] }, null, 2));
console.log(`Backup created at ${destination}`);
