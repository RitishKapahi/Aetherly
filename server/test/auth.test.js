import test from "node:test";
import assert from "node:assert/strict";
import { isValidPassword } from "../src/routes/auth.js";

test("password policy respects bcrypt's UTF-8 byte limit", () => {
  assert.equal(isValidPassword("a".repeat(10)), true);
  assert.equal(isValidPassword("a".repeat(72)), true);
  assert.equal(isValidPassword("a".repeat(73)), false);
  assert.equal(isValidPassword("é".repeat(37)), false);
  assert.equal(isValidPassword("short"), false);
});
