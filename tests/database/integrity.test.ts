import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { readFile, readdir } from "node:fs/promises";

// Every run uses its own schema; no existing tables or records are changed.
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("TEST_DATABASE_URL must point to a dedicated test database.");
const schema = `test_${randomUUID().replaceAll("-", "")}`;
const admin = new pg.Pool({ connectionString: url });
const db = new pg.Pool({ connectionString: url, options: `-c search_path=${schema}`, max: 5 });
const p = randomUUID(), other = randomUUID(), rt = randomUUID(), unit = randomUUID(), block = randomUUID();

before(async () => {
  await admin.query(`CREATE SCHEMA "${schema}"`);
  for (const migration of (await readdir("prisma/migrations", { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()) {
    await db.query(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  }
  await db.query('INSERT INTO "Property" (id,slug,name,currency,timezone) VALUES ($1::uuid, $1::text, $1::text, $2, $3), ($4::uuid, $4::text, $4::text, $2, $3)', [p, "USD", "UTC", other]);
  await db.query('INSERT INTO "RoomType" (id,"propertyId",slug,name,description,"maxAdults","maxGuests","basePrice") VALUES ($1::uuid,$2,$1::text,$1::text,$1::text,2,2,100)', [rt,p]);
  await db.query('INSERT INTO "RoomUnit" (id,"propertyId","roomTypeId",number) VALUES ($1::uuid,$2,$3,$1::text)', [unit,p,rt]);
  await db.query('INSERT INTO "AvailabilityBlock" (id,"propertyId",start,"end",reason,kind) VALUES ($1,$2,$3,$4,$5,$6)', [block,p,"2027-01-01","2027-02-01","Test","MAINTENANCE"]);
});
after(async () => {
  await db.end();
  await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
  await admin.end();
});

test("migration creates all domain tables", async () => {
  const result = await db.query('SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema=$1', [schema]);
  assert.ok(result.rows[0].count >= 40);
});
test("simultaneous allocations cannot claim the same room night", async () => {
  const insert = () => db.query('INSERT INTO "InventoryNight" ("unitId","propertyId",date,"blockId") VALUES ($1,$2,$3,$4)', [unit,p,"2027-01-04",block]);
  const results = await Promise.allSettled([insert(), insert()]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  const rejected = results.find(r => r.status === "rejected") as PromiseRejectedResult;
  assert.equal(rejected.reason.code, "23505");
});
test("cross-property allocation is rejected by foreign key", async () => {
  await assert.rejects(db.query('INSERT INTO "InventoryNight" ("unitId","propertyId",date,"blockId") VALUES ($1,$2,$3,$4)', [unit,other,"2027-01-05",block]), { code: "23503" });
});
test("ownerless and out-of-range nights cannot be inserted", async () => {
  await assert.rejects(db.query('INSERT INTO "InventoryNight" ("unitId","propertyId",date) VALUES ($1,$2,$3)', [unit,p,"2027-01-06"]), { code: "23514" });
  await assert.rejects(db.query('INSERT INTO "InventoryNight" ("unitId","propertyId",date,"blockId") VALUES ($1,$2,$3,$4)', [unit,p,"2027-02-01",block]), { code: "23514" });
});
test("a conflict rolls back every night of a multi-night allocation", async () => {
  const conn = await db.connect();
  try {
    await conn.query("BEGIN");
    await conn.query('INSERT INTO "InventoryNight" ("unitId","propertyId",date,"blockId") VALUES ($1,$2,$3,$4)', [unit,p,"2027-01-03",block]);
    await assert.rejects(conn.query('INSERT INTO "InventoryNight" ("unitId","propertyId",date,"blockId") VALUES ($1,$2,$3,$4)', [unit,p,"2027-01-04",block]), { code: "23505" });
    await conn.query("ROLLBACK");
  } finally { conn.release(); }
  const result = await db.query('SELECT 1 FROM "InventoryNight" WHERE "unitId"=$1 AND date=$2', [unit,"2027-01-03"]);
  assert.equal(result.rowCount, 0);
});
test("negative rates fail at the database boundary", async () => {
  await assert.rejects(db.query('UPDATE "RoomType" SET "basePrice"=-1 WHERE id=$1', [rt]), { code: "23514" });
});
test("custom roles cannot be assigned across properties",async()=>{
 const role=randomUUID(),user=randomUUID();
 await db.query('INSERT INTO "Role" (id,name,"propertyId") VALUES ($1,$2,$3)',[role,"Scoped test role",p]);
 await db.query('INSERT INTO "User" (id,email,name,"passwordHash") VALUES ($1,$2,$3,$4)',[user,`${user}@example.invalid`,"Test staff","not-a-login-hash"]);
 await assert.rejects(db.query('INSERT INTO "Membership" ("propertyId","userId","roleId") VALUES ($1,$2,$3)',[other,user,role]),{code:"23514"});
 await db.query('INSERT INTO "Membership" ("propertyId","userId","roleId") VALUES ($1,$2,$3)',[p,user,role]);
});

