import { useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
  ParticipantTile,
  useTracks
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

type Server = {
  id: string;
  name: string;
  channels: { id: string; name: string; type: "TEXT" | "VOICE" }[];
};

export function App() {
  const [username, setUsername] = useState("Leandro");
  const [server, setServer] = useState<Server | null>(null);
  const [serverId, setServerId] = useState("");
  const [room, setRoom] = useState<{ token: string; url: string; name: string } | null>(null);
  const [status, setStatus] = useState("");

  async function createServer() {
  setStatus("Criando usuário...");

  try {
    const registerResponse = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: `${username}-${Date.now()}`,
        email: `${Date.now()}@local.test`,
        password: "dev-password"
      })
    });

    const user = await registerResponse.json();

    if (!registerResponse.ok || !user.user?.id) {
      setStatus(user.error || "Não foi possível criar o usuário.");
      return;
    }

    setStatus("Criando servidor...");

    const serverResponse = await fetch(`${API}/servers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Meu Grupo",
        ownerId: user.user.id
      })
    });

    const created = await serverResponse.json();

    if (!serverResponse.ok || !created.id) {
      setStatus(created.error || "Não foi possível criar o servidor.");
      return;
    }

    setServer(created);
    setStatus("Servidor criado.");
  } catch (error) {
    console.error(error);
    setStatus("Erro de conexão com a API.");
  }
}
async function joinServer() {
  if (!serverId.trim()) {
    setStatus("Informe o ID do servidor.");
    return;
  }

  setStatus("Criando usuário...");

  try {
    const registerResponse = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: `${username}-${Date.now()}`,
        email: `${Date.now()}@local.test`,
        password: "dev-password"
      })
    });

    const user = await registerResponse.json();

    if (!registerResponse.ok || !user.user?.id) {
      setStatus(user.error || "Não foi possível criar o usuário.");
      return;
    }

    setStatus("Entrando no servidor...");

    const response = await fetch(
      `${API}/servers/${serverId.trim()}/join`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.user.id
        })
      }
    );

    const joinedServer = await response.json();

    if (!response.ok || !joinedServer.id) {
      setStatus(
        joinedServer.error || "Não foi possível entrar no servidor."
      );
      return;
    }

    setServer(joinedServer);
    setStatus("Você entrou no servidor.");
  } catch (error) {
    console.error(error);
    setStatus("Erro de conexão com a API.");
  }
}

  async function enterVoice(channelId: string) {
  if (!server) return;

  const result = await fetch(`${API}/livekit/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: username,
      channelId
    })
  }).then(r => r.json());

  if (result.token) {
    setRoom({
      token: result.token,
      url: result.url,
      name: result.roomName
    });
  } else {
    console.error("Erro ao entrar na sala:", result);
    setStatus(result.error || "Não foi possível entrar na sala.");
  }
}
  if (room) {
    return (
      <LiveKitRoom
        token={room.token}
        serverUrl={room.url}
        connect
        audio
        video={false}
        onDisconnected={() => setRoom(null)}
        className="room"
      >
        <VoiceRoom />
        <RoomAudioRenderer />
        <ControlBar variation="minimal" controls={{ microphone: true, camera: false, screenShare: true }} />
      </LiveKitRoom>
    );
  }

  return (
    <main className="app">
      <section className="card">
        <h1>Discord MVP</h1>
        <p>React + Node.js + PostgreSQL + LiveKit</p>

        <label>
          Seu nome
          <input value={username} onChange={e => setUsername(e.target.value)} />
        </label>

        {!server ? (
  <>
    <button onClick={createServer}>
      Criar meu primeiro servidor
    </button>

    <div className="join-server">
      <p>Ou entre em um servidor existente:</p>

      <input
        value={serverId}
        onChange={e => setServerId(e.target.value)}
        placeholder="ID do servidor"
      />

      <button onClick={joinServer}>
        Entrar no servidor
      </button>
    </div>
  </>
) : (
          <>
            <h2>{server.name}</h2>
            <p>
  ID do servidor:
  <code>{server.id}</code>
</p>
            <div className="channels">
              {server.channels.map(channel => (
                <button
                   key={channel.id}
                     disabled={channel.type !== "VOICE"}
                        onClick={() => enterVoice(channel.id)}
>
  {channel.type === "VOICE" ? "🔊" : "#"} {channel.name}
</button>
              ))}
            </div>
          </>
        )}

        <small>{status}</small>
      </section>
    </main>
  );
}

function VoiceRoom() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false }
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="voice-room">
      <h2>Sala de voz</h2>
      <GridLayout tracks={tracks} className="video-grid">
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}