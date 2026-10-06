import { randomUUID } from "node:crypto";
import { createServer as createHttpServer } from "node:http";
import { pathToFileURL } from "node:url";

const maxBodyBytes = 1024 * 1024;

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      const error = new Error("Request body is too large");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON");
    error.statusCode = 400;
    throw error;
  }
}

export function createServer() {
  const tasks = [];

  return createHttpServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");

    try {
      if (request.method === "GET" && url.pathname === "/healthz") {
        sendJson(response, 200, { status: "ok" });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/tasks") {
        sendJson(response, 200, { tasks });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/tasks") {
        const body = await readJson(request);
        if (body === null || typeof body !== "object" || typeof body.title !== "string" ||
            !body.title.trim() || body.title.trim().length > 120) {
          sendJson(response, 400, { error: "title must be a non-empty string of at most 120 characters" });
          return;
        }

        const task = {
          id: randomUUID(),
          title: body.title.trim(),
          createdAt: new Date().toISOString()
        };
        tasks.push(task);
        sendJson(response, 201, { task });
        return;
      }

      const taskMatch = url.pathname.match(/^\/api\/tasks\/([0-9a-f-]+)$/i);
      if (request.method === "DELETE" && taskMatch) {
        const taskIndex = tasks.findIndex((task) => task.id === taskMatch[1]);
        if (taskIndex === -1) {
          sendJson(response, 404, { error: "Task not found" });
          return;
        }

        tasks.splice(taskIndex, 1);
        response.writeHead(204);
        response.end();
        return;
      }

      sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      if (error.statusCode === 400 || error.statusCode === 413) {
        sendJson(response, error.statusCode, { error: error.message });
        return;
      }

      console.error("Request failed:", error);
      sendJson(response, 500, { error: "Internal server error" });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3000);
  const server = createServer();
  server.listen(port, "0.0.0.0", () => {
    console.log(`Task API listening on port ${port}`);
  });
}
