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

test("health endpoint reports that the service is ready", async () => {
  const response = await fetch(`${baseUrl}/healthz`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("tasks can be created, listed, and deleted", async () => {
  const createResponse = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Learn CI/CD" })
  });

  assert.equal(createResponse.status, 201);
  const { task } = await createResponse.json();
  assert.equal(task.title, "Learn CI/CD");
  assert.ok(task.id);
  assert.ok(task.createdAt);

  const listResponse = await fetch(`${baseUrl}/api/tasks`);
  assert.deepEqual(await listResponse.json(), { tasks: [task] });

  const deleteResponse = await fetch(`${baseUrl}/api/tasks/${task.id}`, { method: "DELETE" });
  assert.equal(deleteResponse.status, 204);

  const emptyListResponse = await fetch(`${baseUrl}/api/tasks`);
  assert.deepEqual(await emptyListResponse.json(), { tasks: [] });
});

test("invalid task input receives a useful client error", async () => {
  for (const body of [{ title: "   " }, null, { title: "x".repeat(121) }]) {
    const response = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /title must be/);
  }
});

test("malformed JSON receives a client error", async () => {
  const response = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{"
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Request body must be valid JSON" });
});
