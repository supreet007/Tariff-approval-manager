import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AppError,
  Roles
} from "./domain.js";
import {
  approveTariff,
  loadStore,
  createContract,
  createTariff,
  getCurrentUser,
  getDashboard,
  listContracts,
  listTariffs,
  rejectTariff,
  submitTariff,
  updateTariff,
  deleteContract
} from "./store.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "..", "public");
const store = loadStore();

export function createAppServer(appStore = store) {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, url, appStore);
        return;
      }
      await serveStatic(res, url.pathname);
    } catch (error) {
      sendError(res, error);
    }
  });
}

async function handleApi(req, res, url, appStore) {
  const user = getCurrentUser(appStore, req.headers["x-user-id"]);
  const method = req.method ?? "GET";

  if (method === "GET" && url.pathname === "/api/users") {
    return sendJson(res, { users: appStore.users });
  }

  if (method === "GET" && url.pathname === "/api/contracts") {
    return sendJson(res, { contracts: listContracts(appStore, user) });
  }

  if (method === "POST" && url.pathname === "/api/contracts") {
    return sendJson(res, { contract: createContract(appStore, user, await readBody(req)) }, 201);
  }

  if ( method==="DELETE" && /^\/api\/contracts\/[^/]+$/.test(url.pathname)){
    const id=url.pathname.split("/")[3]
    deleteContract( appStore,user,id)
    return sendJson(
    res,
    {success:true}
    )
  }

  if (method === "GET" && url.pathname === "/api/tariffs") {
    return sendJson(res, {
      tariffs: listTariffs(appStore, user, {
        status: url.searchParams.get("status"),
        contractId: url.searchParams.get("contractId")
      })
    });
  }

  if (method === "POST" && /^\/api\/contracts\/[^/]+\/tariffs$/.test(url.pathname)) {
    const contractId = url.pathname.split("/")[3];
    return sendJson(res, { tariff: createTariff(appStore, user, contractId, await readBody(req)) }, 201);
  }

  if (method === "PATCH" && /^\/api\/tariffs\/[^/]+$/.test(url.pathname)) {
    const tariffId = url.pathname.split("/")[3];
    return sendJson(res, { tariff: updateTariff(appStore, user, tariffId, await readBody(req)) });
  }

  if (method === "POST" && /^\/api\/tariffs\/[^/]+\/submit$/.test(url.pathname)) {
    const tariffId = url.pathname.split("/")[3];
    return sendJson(res, { tariff: submitTariff(appStore, user, tariffId) });
  }

  if (method === "POST" && /^\/api\/tariffs\/[^/]+\/approve$/.test(url.pathname)) {
    const tariffId = url.pathname.split("/")[3];
    return sendJson(res, { tariff: approveTariff(appStore, user, tariffId) });
  }

  if (method === "POST" && /^\/api\/tariffs\/[^/]+\/reject$/.test(url.pathname)) {
    const tariffId = url.pathname.split("/")[3];
    const body = await readBody(req);
    return sendJson(res, { tariff: rejectTariff(appStore, user, tariffId, body.reason) });
  }

  if (method === "GET" && url.pathname === "/api/dashboard") {
    return sendJson(res, { dashboard: getDashboard(appStore, user) });
  }

  throw new AppError(404, "Route not found.");

  
}

async function serveStatic(res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = join(publicDir, safePath);
  if (!filePath.startsWith(publicDir)) {
    throw new AppError(403, "Forbidden.");
  }
  const file = await readFile(filePath);
  res.writeHead(200, { "content-type": mimeType(filePath) });
  res.end(file);
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new AppError(400, "Request body must be valid JSON.");
  }
}

function sendJson(res, body, status = 200) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function sendError(res, error) {
  const isAppError = error instanceof AppError;
  const status = isAppError ? error.status : 500;
  const message = isAppError ? error.message : "Unexpected server error.";
  if (!isAppError) console.error(error);
  sendJson(res, { error: message }, status);
}

function mimeType(filePath) {
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8"
  }[extname(filePath)] ?? "application/octet-stream";
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.env.PORT ?? 3000);
  createAppServer().listen(port, () => {
    console.log(`Tariff Approval Manager running at http://localhost:${port}`);
    console.log(`Use ${Roles.CREATOR}, ${Roles.APPROVER}, or ${Roles.VIEWER} from the role selector.`);
  });
}
