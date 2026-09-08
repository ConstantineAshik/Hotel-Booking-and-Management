import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
const root = process.env.MEDIA_ROOT || join(process.cwd(), ".uploads");
function safePath(key: string) {
  if (!/^[a-f0-9-]{36}\.webp$/.test(key)) throw new Error("Invalid media key");
  return join(/* turbopackIgnore: true */ root, key);
}
export const localStorage = {
  async put(key: string, bytes: Uint8Array) { await mkdir(root, { recursive: true }); await writeFile(safePath(key), bytes, { flag: "wx" }); },
  async read(key: string) { return readFile(/* turbopackIgnore: true */ safePath(key)); },
  async delete(key: string) { await unlink(safePath(key)); },
};
