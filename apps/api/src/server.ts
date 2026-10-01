import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient, ChannelType } from "@prisma/client";
import { AccessToken } from "livekit-server-sdk";

const app = express();
const prisma = new PrismaClient();

const allowedOrigins = [
  "http://localhost:5173",
  "https://discord-mvp-leandro-2026.web.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origem não permitida pelo CORS"));
    }
  })
);
app.use(express.json());

const port = Number(process.env.PORT ?? 3001);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "discord-mvp-api" });
});

app.post("/auth/register", async (req, res) => {
  const { username, email, password } = req.body ?? {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email e password são obrigatórios" });
  }

  try {
    const user = await prisma.user.create({
      data: { username, email, password }
    });
    return res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch {
    return res.status(409).json({ error: "Usuário ou e-mail já cadastrado" });
  }
});

app.post("/servers", async (req, res) => {
  const { name, ownerId } = req.body ?? {};
  if (!name || !ownerId) return res.status(400).json({ error: "name e ownerId são obrigatórios" });

  try {
    const server = await prisma.server.create({
      data: {
        name,
        ownerId,
        memberships: { create: { userId: ownerId, role: "OWNER" } },
        channels: {
          create: [
            { name: "geral", type: ChannelType.TEXT },
            { name: "Geral", type: ChannelType.VOICE }
          ]
        }
      },
      include: { channels: true }
    });
    return res.status(201).json(server);
  } catch {
    return res.status(400).json({ error: "Não foi possível criar o servidor" });
  }
});

app.get("/servers/:serverId", async (req, res) => {
  const server = await prisma.server.findUnique({
    where: { id: req.params.serverId },
    include: { channels: true }
  });
  if (!server) return res.status(404).json({ error: "Servidor não encontrado" });
  return res.json(server);
});

app.post("/livekit/token", async (req, res) => {
  const { identity, channelId } = req.body ?? {};

  if (!identity || !channelId) {
    return res.status(400).json({
      error: "identity e channelId são obrigatórios"
    });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({
      error: "LIVEKIT_API_KEY/SECRET não configurados"
    });
  }

  // Cada canal de voz possui uma sala LiveKit própria
  const roomName = `channel-${channelId}`;

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    name: identity,
    ttl: "1h"
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true
  });

  return res.json({
    token: await token.toJwt(),
    url: process.env.LIVEKIT_URL,
    roomName
  });
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});