// Servidor local mínimo (sin instalar nada): node servidor.mjs  ->  http://localhost:8080
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL(".", import.meta.url));
const puerto = Number(process.env.PORT) || 8080;
const tipos = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

createServer(async (req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const archivo = normalize(join(raiz, ruta.endsWith("/") ? ruta + "index.html" : ruta));
  if (!archivo.startsWith(raiz)) { res.writeHead(403).end(); return; }
  try {
    const datos = await readFile(archivo);
    res.writeHead(200, { "Content-Type": tipos[extname(archivo)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(datos);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("No encontrado");
  }
}).listen(puerto, () => console.log(`W&M Consultorio Dental en http://localhost:${puerto}  (Ctrl+C para detener)`));
