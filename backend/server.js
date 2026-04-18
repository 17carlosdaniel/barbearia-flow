import cors from "cors";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, "data", "auth-db.json");

const PORT = Number(process.env.AUTH_API_PORT ?? 4000);
const JWT_ACCESS_SECRET = process.env.AUTH_JWT_ACCESS_SECRET ?? "dev_access_secret_change_me";
const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.AUTH_ACCESS_TOKEN_TTL_SECONDS ?? 60 * 15);
const REFRESH_TOKEN_TTL_SECONDS = Number(process.env.AUTH_REFRESH_TOKEN_TTL_SECONDS ?? 60 * 60 * 24 * 7);
const APP_ORIGIN = process.env.AUTH_APP_ORIGIN ?? "http://localhost:8080";

/**
 * @typedef {{
 * id: string;
 * email: string;
 * passwordHash: string;
 * role: "cliente" | "barbeiro";
 * metadata: Record<string, unknown>;
 * createdAt: string;
 * }} AuthUserRecord
 *
 * @typedef {{
 * token: string;
 * userId: string;
 * expiresAt: number;
 * revoked: boolean;
 * createdAt: string;
 * revokedAt?: string;
 * }} RefreshTokenRecord
 *
 * @typedef {{
 * users: AuthUserRecord[];
 * refreshTokens: RefreshTokenRecord[];
 * }} AuthDb
 */

/** @returns {Promise<AuthDb>} */
async function readDb() {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      refreshTokens: Array.isArray(parsed.refreshTokens) ? parsed.refreshTokens : [],
    };
  } catch {
    return { users: [], refreshTokens: [] };
  }
}

/** @param {AuthDb} db */
async function writeDb(db) {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

/** @param {AuthUserRecord} user */
function mapUserToAuthPayload(user) {
  return {
    id: user.id,
    email: user.email,
    user_metadata: {
      role: user.role,
      ...user.metadata,
    },
  };
}

/** @param {AuthUserRecord} user */
function createSessionPayload(user) {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
  );

  const refreshToken = `${randomUUID()}_${randomBytes(24).toString("hex")}`;
  const expiresAt = Math.floor(Date.now() / 1000) + REFRESH_TOKEN_TTL_SECONDS;
  const accessExpiresAt = Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS;

  return {
    session: {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: accessExpiresAt,
      token_type: "bearer",
      user: mapUserToAuthPayload(user),
    },
    refreshRecord: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
      revoked: false,
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
function requireAccessToken(req, res, next) {
  const header = req.header("authorization") ?? req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Token de acesso ausente." });
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.auth = decoded;
    return next();
  } catch {
    return res.status(401).json({ success: false, error: "Token de acesso inválido ou expirado." });
  }
}

const app = express();
app.use(cors({ origin: APP_ORIGIN, credentials: true }));
app.use(express.json());

app.post("/api/register", async (req, res) => {
  const { email, password, metadata } = req.body ?? {};

  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ success: false, error: "Informe um e-mail válido." });
  }
  if (typeof password !== "string" || password.trim().length < 8) {
    return res.status(400).json({ success: false, error: "A senha deve ter no mínimo 8 caracteres." });
  }

  const db = await readDb();
  if (db.users.some((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ success: false, error: "Este e-mail já está cadastrado." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const role = metadata?.role === "barbeiro" ? "barbeiro" : "cliente";
  const user = {
    id: randomUUID(),
    email: normalizedEmail,
    passwordHash,
    role,
    metadata: typeof metadata === "object" && metadata ? metadata : {},
    createdAt: new Date().toISOString(),
  };

  const { session, refreshRecord } = createSessionPayload(user);
  db.users.push(user);
  db.refreshTokens.push(refreshRecord);
  await writeDb(db);

  return res.status(201).json({
    success: true,
    user: mapUserToAuthPayload(user),
    session,
  });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail || typeof password !== "string") {
    return res.status(400).json({ success: false, error: "E-mail e senha são obrigatórios." });
  }

  const db = await readDb();
  const user = db.users.find((u) => u.email === normalizedEmail);
  if (!user) {
    return res.status(401).json({ success: false, error: "E-mail ou senha incorretos." });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ success: false, error: "E-mail ou senha incorretos." });
  }

  const { session, refreshRecord } = createSessionPayload(user);
  db.refreshTokens.push(refreshRecord);
  await writeDb(db);

  return res.status(200).json({
    success: true,
    user: mapUserToAuthPayload(user),
    session,
  });
});

app.post("/api/logout", async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (typeof refreshToken !== "string" || !refreshToken.trim()) {
    return res.status(400).json({ success: false, error: "Refresh token obrigatório." });
  }

  const db = await readDb();
  const current = db.refreshTokens.find((t) => t.token === refreshToken.trim() && !t.revoked);
  if (!current) {
    return res.status(200).json({ success: true, message: "Token já inválido." });
  }

  current.revoked = true;
  current.revokedAt = new Date().toISOString();
  await writeDb(db);
  return res.status(200).json({ success: true, message: "Sessão encerrada com sucesso." });
});

app.post("/api/refresh", async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (typeof refreshToken !== "string" || !refreshToken.trim()) {
    return res.status(400).json({ success: false, error: "Refresh token obrigatório." });
  }

  const db = await readDb();
  const current = db.refreshTokens.find((t) => t.token === refreshToken.trim() && !t.revoked);
  if (!current) {
    return res.status(401).json({ success: false, error: "Refresh token inválido." });
  }
  if (current.expiresAt <= Math.floor(Date.now() / 1000)) {
    current.revoked = true;
    current.revokedAt = new Date().toISOString();
    await writeDb(db);
    return res.status(401).json({ success: false, error: "Refresh token expirado." });
  }

  const user = db.users.find((u) => u.id === current.userId);
  if (!user) {
    return res.status(401).json({ success: false, error: "Usuário da sessão não encontrado." });
  }

  current.revoked = true;
  current.revokedAt = new Date().toISOString();
  const { session, refreshRecord } = createSessionPayload(user);
  db.refreshTokens.push(refreshRecord);
  await writeDb(db);

  return res.status(200).json({
    success: true,
    user: mapUserToAuthPayload(user),
    session,
  });
});

app.get("/api/me", requireAccessToken, async (req, res) => {
  const userId = typeof req.auth?.sub === "string" ? req.auth.sub : "";
  if (!userId) {
    return res.status(401).json({ success: false, error: "Token inválido." });
  }

  const db = await readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(401).json({ success: false, error: "Usuário não autenticado." });
  }

  return res.status(200).json({
    success: true,
    user: mapUserToAuthPayload(user),
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[auth-api] running on http://localhost:${PORT}`);
});

