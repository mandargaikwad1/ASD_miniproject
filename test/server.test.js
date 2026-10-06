import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "../src/server.js";

let server;
let baseUrl;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("home page serves the online quiz interface", async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(await response.text(), /Submit answers/);
});

test("health endpoint reports that the service is ready", async () => {
  const response = await fetch(`${baseUrl}/healthz`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("public quiz questions do not disclose correct answers", async () => {
  const response = await fetch(`${baseUrl}/api/quiz`);
  const quiz = await response.json();
  assert.equal(response.status, 200);
  assert.equal(quiz.questions.length, 5);
  assert.ok(quiz.questions.every((question) =>
    question.id && question.text && question.options.length === 4 &&
    !Object.hasOwn(question, "correctOptionId") &&
    !Object.hasOwn(question, "explanation")
  ));
});

test("submission is graded on the server and returns explanations", async () => {
  const response = await fetch(`${baseUrl}/api/quiz/submit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ answers: { q1: "b", q2: "a", q3: "b" } })
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.score, 2);
  assert.equal(result.total, 5);
  assert.equal(result.percentage, 40);
  assert.equal(result.results.length, 5);
  assert.equal(result.results[0].isCorrect, true);
  assert.equal(result.results[1].isCorrect, false);
  assert.equal(result.results[3].isCorrect, false);
  assert.ok(result.results[0].explanation);
});

test("invalid quiz answers receive a client error", async () => {
  for (const body of [null, {}, { answers: { unknown: "a" } }, { answers: { q1: "unknown" } }]) {
    const response = await fetch(`${baseUrl}/api/quiz/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    assert.equal(response.status, 400);
    assert.ok((await response.json()).error);
  }
});

test("malformed JSON receives a client error", async () => {
  const response = await fetch(`${baseUrl}/api/quiz/submit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{"
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Request body must be valid JSON" });
});

test("unknown routes return not found", async () => {
  const response = await fetch(`${baseUrl}/api/tasks`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Not found" });
});
