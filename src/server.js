import { readFile } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { pathToFileURL } from "node:url";
import { getPublicQuiz, gradeQuiz, quiz } from "./quiz.js";

const maxBodyBytes = 1024 * 1024;
const indexPageUrl = new URL("../public/index.html", import.meta.url);

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

function validateAnswers(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body) ||
      body.answers === null || typeof body.answers !== "object" || Array.isArray(body.answers)) {
    return "answers must be an object mapping question IDs to option IDs";
  }

  const questionById = new Map(quiz.questions.map((question) => [question.id, question]));
  for (const [questionId, optionId] of Object.entries(body.answers)) {
    const question = questionById.get(questionId);
    if (!question || typeof optionId !== "string" ||
        !question.options.some((option) => option.id === optionId)) {
      return `Invalid question or option: ${questionId}`;
    }
  }

  return null;
}

export function createServer() {
  return createHttpServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");

    try {
      if (request.method === "GET" && url.pathname === "/") {
        const page = await readFile(indexPageUrl);
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        response.end(page);
        return;
      }

      if (request.method === "GET" && url.pathname === "/healthz") {
        sendJson(response, 200, { status: "ok" });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/quiz") {
        sendJson(response, 200, getPublicQuiz());
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/quiz/submit") {
        const body = await readJson(request);
        const validationError = validateAnswers(body);
        if (validationError) {
          sendJson(response, 400, { error: validationError });
          return;
        }

        const results = gradeQuiz(body.answers);
        const score = results.filter((result) => result.isCorrect).length;
        sendJson(response, 200, {
          score,
          total: quiz.questions.length,
          percentage: Math.round((score / quiz.questions.length) * 100),
          results
        });
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
    console.log(`Quiz application listening on port ${port}`);
  });
}
