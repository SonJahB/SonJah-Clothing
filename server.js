const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_FILE = path.join(ROOT, "data", "products.json");
const PORT = Number(process.env.PORT || 3000);
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const CORS_ORIGINS = new Set((process.env.CORS_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean));
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".json": "application/json; charset=utf-8"
};

async function readProducts() {
  return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
}

async function writeProducts(products) {
  const temporaryFile = `${DATA_FILE}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(products, null, 2)}\n`);
  await fs.rename(temporaryFile, DATA_FILE);
}

function sendJson(response, status, data) {
  response.writeHead(status, { ...response.getHeaders(), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(data));
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error("Request body is too large.");
  }
  return JSON.parse(body);
}

function isValidCatalogue(products) {
  const categories = new Set(["shirts", "pants", "accessories"]);
  return Array.isArray(products) && products.length <= 1000 && products.every((item) =>
    item && typeof item.id === "string" && typeof item.name === "string" && item.name.trim() &&
    typeof item.description === "string" && Number.isFinite(item.price) && item.price >= 0 &&
    categories.has(item.category) && typeof item.image === "string" &&
    ["available", "sold-out"].includes(item.availability)
  );
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      const origin = request.headers.origin;
      if (origin) {
        const forwardedProtocol = request.headers["x-forwarded-proto"]?.split(",")[0].trim();
        const protocol = forwardedProtocol || (request.socket.encrypted ? "https" : "http");
        const sameOrigin = origin === `${protocol}://${request.headers.host}`;
        if (!sameOrigin && !CORS_ORIGINS.has(origin)) {
          return sendJson(response, 403, { error: "This website origin is not allowed by the backend CORS_ORIGINS setting." });
        }
        response.setHeader("Access-Control-Allow-Origin", origin);
        response.setHeader("Vary", "Origin");
      }
      if (url.pathname === "/api/products" && request.method === "OPTIONS") {
        response.writeHead(204, {
          ...response.getHeaders(),
          "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        });
        return response.end();
      }
    }
    if (url.pathname === "/api/products" && request.method === "GET") {
      return sendJson(response, 200, await readProducts());
    }
    if (url.pathname === "/api/products" && request.method === "PUT") {
      if (!ADMIN_API_KEY) return sendJson(response, 503, { error: "Set ADMIN_API_KEY before enabling catalogue edits." });
      if (request.headers.authorization !== `Bearer ${ADMIN_API_KEY}`) return sendJson(response, 401, { error: "A valid admin API key is required." });
      const products = await readBody(request);
      if (!isValidCatalogue(products)) return sendJson(response, 400, { error: "The catalogue data is invalid." });
      await writeProducts(products);
      return sendJson(response, 200, products);
    }
    if (url.pathname.startsWith("/api/")) return sendJson(response, 404, { error: "API route not found." });
    if (request.method !== "GET" && request.method !== "HEAD") return sendJson(response, 405, { error: "Method not allowed." });

    const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = path.resolve(PUBLIC_DIR, `.${requestedPath}`);
    if (!filePath.startsWith(`${PUBLIC_DIR}${path.sep}`)) return sendJson(response, 403, { error: "Forbidden." });
    const contents = await fs.readFile(filePath);
    response.writeHead(200, { "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream" });
    response.end(request.method === "HEAD" ? undefined : contents);
  } catch (error) {
    const status = error instanceof SyntaxError ? 400 : error.code === "ENOENT" ? 404 : 500;
    sendJson(response, status, { error: status === 500 ? "The server could not complete the request." : error.message });
    if (status === 500) console.error(error);
  }
});

server.listen(PORT, process.env.HOST || "0.0.0.0", () => {
  console.log(`SonJah Clothing server running on http://localhost:${PORT}`);
  if (!ADMIN_API_KEY) console.warn("Catalogue edits are disabled. Set ADMIN_API_KEY to enable them.");
});
