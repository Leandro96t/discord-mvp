# Discord MVP — React + Node.js + PostgreSQL + Prisma + LiveKit

MVP inicial de uma plataforma de comunidades com:
- cadastro/login
- criação de servidor
- canal de voz
- token LiveKit
- microfone
- compartilhamento de tela
- PostgreSQL via Prisma

## Requisitos
- Node.js 20+
- Docker Desktop
- navegador com WebRTC (Chrome/Edge/Firefox)

## 1. Instalar dependências

```bash
npm install
```

## 2. Subir PostgreSQL e LiveKit

```bash
docker compose up -d
```

## 3. Configurar API

Crie `apps/api/.env` baseado em `apps/api/.env.example`.

Para o LiveKit local em modo dev, use:
- LIVEKIT_URL=ws://localhost:7880
- LIVEKIT_API_KEY=devkey
- LIVEKIT_API_SECRET=secret

## 4. Criar banco

```bash
npm run db:generate
npm run db:push
```

## 5. Rodar

```bash
npm run dev
```

Frontend:
http://localhost:5173

API:
http://localhost:3001

LiveKit:
ws://localhost:7880

## Observação
O LiveKit em `--dev` é apropriado para desenvolvimento local. Para produção, use chaves próprias, HTTPS/WSS e uma infraestrutura LiveKit devidamente configurada.
