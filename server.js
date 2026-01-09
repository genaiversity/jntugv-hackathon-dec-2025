import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTANT: Render uses its own PORT
const PORT = process.env.PORT || 3000;

// MIME types
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".map": "application/octet-stream",
  ".ts": "application/typescript"
};

// Serve from dist if available (React build)
const distDir = path.join(__dirname, "dist");
const baseDir = fs.existsSync(distDir) ? distDir : __dirname;

const server = http.createServer((req, res) => {
  try {
    let reqPath = decodeURIComponent(req.url.split("?")[0]);

    // Default route
    if (reqPath === "/") reqPath = "/index.html";

    let filePath = path.join(baseDir, reqPath);

    // If file does NOT exist → fallback to index.html (IMPORTANT for React)
    if (!fs.existsSync(filePath)) {
      filePath = path.join(baseDir, "index.html");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mime[ext] || "application/octet-stream";

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("500 - Server Error");
        return;
      }
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    });

  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("500 - Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;
