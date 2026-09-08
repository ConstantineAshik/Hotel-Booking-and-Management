import "dotenv/config";
import { postgresEnvironment } from "./postgres-environment.mjs";
import { spawn } from "node:child_process";
import { access, cp, readFile, rename } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve, join } from "node:path";

function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { env: postgresEnvironment(databaseUrl), stdio: "inherit", shell: false, windowsHide: true });
    child.once("error", reject);
    child.once("exit", code => code === 0 ? resolveRun() : reject(new Error(`${command} exited with code ${code}`)));
  });
}

const sourceArg = process.argv[2];
if (!sourceArg || !process.argv.includes("--confirm=RESTORE")) throw new Error("Usage: npm run restore -- <backup-directory> --confirm=RESTORE");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const source = resolve(sourceArg);
const dump = join(source, "database.dump");
const manifest = JSON.parse(await readFile(join(source, "manifest.json"), "utf8"));
if (manifest?.format !== 1) throw new Error("Unsupported or invalid backup manifest.");
await access(dump);
const media = join(source, "media");
await access(media);
const target = resolve(".uploads");
const suffix = randomUUID();
const staged = resolve(`.uploads-restore-${suffix}`);
const previous = resolve(`.uploads-before-restore-${suffix}`);
await cp(media, staged, { recursive: true, force: false, errorOnExist: true });
await run("pg_restore", ["--single-transaction", "--exit-on-error", "--clean", "--if-exists", "--no-owner", "--no-privileges", `--dbname=${postgresEnvironment(databaseUrl).PGDATABASE}`, dump]);
let retained = false;
try { await rename(target, previous); retained = true; } catch (error) { if (error?.code !== "ENOENT") throw error; }
try { await rename(staged, target); } catch (error) {
  if (retained) await rename(previous, target);
  throw error;
}
if (retained) console.log(`Previous media retained at ${previous}. Remove it only after verification.`);
console.log(`Restore completed from ${source}`);
