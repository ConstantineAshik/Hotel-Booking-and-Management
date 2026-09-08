import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, token, digest, tokenMatches } from "../src/server/crypto.js";
test("password hashes are salted and verify only the right password", async () => {
  const password = "a long test passphrase";
  const a = await hashPassword(password), b = await hashPassword(password);
  assert.notEqual(a, b);
  assert.equal(await verifyPassword(password, a), true);
  assert.equal(await verifyPassword("wrong", a), false);
  assert.equal(await verifyPassword(password, "invalid"), false);
});
test("session/reset tokens are unpredictable and stored as digests", () => {
  const a = token(), b = token();
  assert.equal(a.length, 64);
  assert.notEqual(a, b);
  assert.notEqual(digest(a), a);
  assert.equal(tokenMatches(a, a), true);
  assert.equal(tokenMatches(a, b), false);
});
