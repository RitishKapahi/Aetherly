import test from "node:test";
import assert from "node:assert/strict";
import { isValidPassword } from "../src/routes/auth.js";

test("registration requires eight characters, a number, and a special character", () => {
  assert.equal(isValidPassword("weath1!?"), true);
  assert.equal(isValidPassword("weather1!"), true);
  assert.equal(isValidPassword("weather!!"), false);
  assert.equal(isValidPassword("weather12"), false);
  assert.equal(isValidPassword("short1!"), false);
});

test("registration rejects passwords that exceed bcrypt's UTF-8 byte limit", () => {
  assert.equal(isValidPassword(`${"a".repeat(69)}1!`), true);
  assert.equal(isValidPassword(`${"a".repeat(71)}1!`), false);
  assert.equal(isValidPassword(`${"é".repeat(35)}1!`), true);
  assert.equal(isValidPassword(`${"é".repeat(36)}1!`), false);
});
