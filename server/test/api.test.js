import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

test("health endpoint reports weather API availability without requiring MongoDB", async (context) => {
  const server = app.listen(0);
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.status, "ok");
});

test("weather query rejects out-of-range coordinates before calling provider", async (context) => {
  const server = app.listen(0);
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${base}/api/weather?latitude=95&longitude=181`);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error.message, /valid latitude and longitude/i);
});

test("location search validates short and oversized input", async (context) => {
  const server = app.listen(0);
  context.after(() => server.close());
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const short = await fetch(`${base}/api/locations/search?q=a`);
  assert.equal(short.status, 400);
  const long = await fetch(`${base}/api/locations/search?q=${"a".repeat(101)}`);
  assert.equal(long.status, 400);
});
