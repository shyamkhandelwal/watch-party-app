const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingInterval: 5000,
  pingTimeout: 5000
});

app.use(express.static(path.join(__dirname, 'public')));

// Curated Open-Source Movie Catalog (Google Cloud / Blender Open Movies)
const MOVIES = [
  {
    id: 'm1',
    title: 'Big Buck Bunny',
    category: 'Animation',
    year: 2008,
    duration: '9m 56s',
    rating: 4.8,
    director: 'Sacha Goedegebure',
    tags: ['comedy', 'forest', 'rabbit', 'blender', 'family'],
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumb: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=600&q=80',
    desc: 'A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.'
  },
  {
    id: 'm2',
    title: 'Sintel',
    category: 'Fantasy',
    year: 2010,
    duration: '14m 48s',
    rating: 4.9,
    director: 'Colin Levy',
    tags: ['dragon', 'quest', 'action', 'fantasy', 'epic'],
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    desc: 'A lonely young woman, Sintel, helps and befriends a dragon, whom she calls Scales. But when he is kidnapped by an adult dragon, Sintel decides to embark on a dangerous quest.'
  },
  {
    id: 'm3',
    title: 'Tears of Steel',
    category: 'Sci-Fi',
    year: 2012,
    duration: '12m 14s',
    rating: 4.7,
    director: 'Ian Hubert',
    tags: ['cyberpunk', 'robots', 'future', 'amsterdam', 'vfx'],
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumb: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=600&q=80',
    desc: 'In an apocalyptic future, a group of soldiers and scientists gather at the Oude Kerk in Amsterdam to stage a desperate event to save the world from destructive robots.'
  },
  {
    id: 'm4',
    title: 'Elephants Dream',
    category: 'Sci-Fi',
    year: 2006,
    duration: '10m 53s',
    rating: 4.5,
    director: 'Bassam Kurdali',
    tags: ['surreal', 'machine', 'abstract', 'experimental'],
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumb: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    desc: 'Friends Proog and Emo journey inside the folds of a seemingly infinite Machine, exploring the dark and twisted complex of wires, gears, and cogs.'
  },
  {
    id: 'm5',
    title: 'For Bigger Blazes',
    category: 'Action',
    year: 2015,
    duration: '0m 15s',
    rating: 4.3,
    director: 'Google Chrome Lab',
    tags: ['short', 'fire', 'promo', 'fast'],
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumb: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    desc: 'High-octane short showcase testing rapid framerate changes and vibrant color sync across distributed devices.'
  },
  {
    id: 'm6',
    title: 'For Bigger Escapes',
    category: 'Adventure',
    year: 2016,
    duration: '0m 15s',
    rating: 4.6,
    director: 'Google Chrome Lab',
    tags: ['nature', 'mountains', 'travel', 'cinematic'],
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
    desc: 'Breathtaking aerial cinematography designed for testing low-latency synchronized multi-screen playback.'
  },
  {
    id: 'm7',
    title: 'We Are Going On Bullrun',
    category: 'Documentary',
    year: 2014,
    duration: '0m 47s',
    rating: 4.4,
    director: 'Garage419',
    tags: ['cars', 'racing', 'rally', 'automotive'],
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    thumb: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
    desc: 'Follow the automotive rally preparation as teams gear up for the annual cross-country Bullrun event.'
  },
  {
    id: 'm8',
    title: 'Subaru Outback Street And Dirt',
    category: 'Adventure',
    year: 2017,
    duration: '0m 59s',
    rating: 4.5,
    director: 'Garage419',
    tags: ['offroad', 'cars', 'dirt', 'outdoors'],
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
    thumb: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
    desc: 'All-terrain exploration testing vehicle resilience across rugged mountain passes and city streets.'
  }
];

// In-Memory Authoritative Room State Store
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getEffectivePosition(playback) {
  if (!playback.isPlaying) return playback.position;
  const elapsedSec = (Date.now() - playback.lastUpdated) / 1000;
  return playback.position + elapsedSec;
}

function serializeRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    lightsOut: room.lightsOut,
    playback: {
      ...room.playback,
      position: getEffectivePosition(room.playback),
      serverTime: Date.now()
    },
    users: Array.from(room.users.values()),
    playlist: room.playlist,
    polls: room.polls,
    chat: room.chat.slice(-60)
  };
}

app.get('/api/movies', (req, res) => {
  res.json(MOVIES);
});

io.on('connection', (socket) => {
  let currentRoomCode = null;
  let currentUserId = null;

  // NTP-style Clock Sync & RTT Measurement
  socket.on('ping_check', (clientPayload, callback) => {
    if (typeof callback === 'function') {
      callback({
        serverTime: Date.now(),
        clientSendTime: clientPayload?.clientSendTime || Date.now()
      });
    }
  });

  // Create or Join Room (Supports seamless Reconnection via persistent userId)
  socket.on('join_room', ({ roomCode, username, userId }, callback) => {
    const cleanName = (username || 'Guest').trim().slice(0, 24) || 'Guest';
    let code = (roomCode || '').trim().toUpperCase();

    if (!code) {
      code = generateRoomCode();
    }

    if (!rooms.has(code)) {
      rooms.set(code, {
        code,
        hostId: userId,
        lightsOut: false,
        playback: {
          movieId: MOVIES[0].id,
          url: MOVIES[0].url,
          title: MOVIES[0].title,
          isPlaying: false,
          position: 0,
          lastUpdated: Date.now(),
          seq: 1
        },
        users: new Map(),
        playlist: [MOVIES[0], MOVIES[1], MOVIES[2]],
        polls: [],
        chat: []
      });
    }

    const room = rooms.get(code);
    currentRoomCode = code;
    currentUserId = userId;
    socket.join(code);

    const isReconnecting = room.users.has(userId);
    const existingUser = room.users.get(userId);

    // If room had no active host, assign this user
    const activeUsers = Array.from(room.users.values()).filter(u => u.online);
    if (activeUsers.length === 0) {
      room.hostId = userId;
    }

    room.users.set(userId, {
      userId,
      socketId: socket.id,
      username: cleanName,
      online: true,
      joinedAt: existingUser ? existingUser.joinedAt : Date.now(),
      rtt: 0
    });

    const sysMsg = {
      id: 'sys_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      system: true,
      text: isReconnecting
        ? `${cleanName} reconnected to the party.`
        : `${cleanName} joined the watch party!`,
      timestamp: Date.now()
    };
    room.chat.push(sysMsg);

    const stateSnapshot = serializeRoom(room);

    if (typeof callback === 'function') {
      callback({ ok: true, room: stateSnapshot });
    }

    socket.to(code).emit('room_users_updated', {
      users: stateSnapshot.users,
      hostId: room.hostId,
      systemMessage: sysMsg
    });
  });

  // Playback Controls (Play, Pause, Seek, Change Video) with Monotonic Sequence Numbers
  socket.on('playback_action', (payload) => {
    if (!currentRoomCode || !rooms.has(currentRoomCode)) return;
    const room = rooms.get(currentRoomCode);
    const now = Date.now();

    room.playback.seq += 1;

    if (payload.type === 'PLAY') {
      room.playback.isPlaying = true;
      room.playback.position = typeof payload.position === 'number' ? payload.position : getEffectivePosition(room.playback);
      room.playback.lastUpdated = now;
    } else if (payload.type === 'PAUSE') {
      room.playback.isPlaying = false;
      room.playback.position = typeof payload.position === 'number' ? payload.position : getEffectivePosition(room.playback);
      room.playback.lastUpdated = now;
    } else if (payload.type === 'SEEK') {
      room.playback.position = Math.max(0, Number(payload.position) || 0);
      room.playback.lastUpdated = now;
    } else if (payload.type === 'CHANGE_MEDIA') {
      room.playback.movieId = payload.movieId || 'custom';
      room.playback.url = payload.url;
      room.playback.title = payload.title || 'Custom Stream';
      room.playback.position = 0;
      room.playback.isPlaying = true;
      room.playback.lastUpdated = now;
    }

    const syncPacket = {
      ...room.playback,
      actionType: payload.type,
      actorId: currentUserId,
      actorName: room.users.get(currentUserId)?.username || 'Participant',
      originTimestamp: payload.originTimestamp || now,
      serverTimestamp: now
    };

    io.to(currentRoomCode).emit('playback_sync', syncPacket);
  });

  // Periodic Host Heartbeat for Drift Correction
  socket.on('host_heartbeat', (payload) => {
    if (!currentRoomCode || !rooms.has(currentRoomCode)) return;
    const room = rooms.get(currentRoomCode);
    if (room.hostId !== currentUserId) return;

    const now = Date.now();
    if (typeof payload.position === 'number') {
      room.playback.position = payload.position;
      room.playback.isPlaying = Boolean(payload.isPlaying);
      room.playback.lastUpdated = now;
    }

    socket.to(currentRoomCode).emit('drift_beacon', {
      position: room.playback.position,
      isPlaying: room.playback.isPlaying,
      seq: room.playback.seq,
      serverTimestamp: now,
      originTimestamp: payload.originTimestamp || now
    });
  });

  // Report Client Telemetry (RTT)
  socket.on('report_telemetry', ({ rtt }) => {
    if (!currentRoomCode || !rooms.has(currentRoomCode)) return;
    const room = rooms.get(currentRoomCode);
    const u = room.users.get(currentUserId);
    if (u) {
      u.rtt = Math.round(rtt || 0);
    }
  });

  // Live Chat
  socket.on('chat_message', ({ text }) => {
    if (!currentRoomCode || !rooms.has(currentRoomCode)) return;
    const cleanText = (text || '').trim().slice(0, 500);
    if (!cleanText) return;

    const room = rooms.get(currentRoomCode);
    const sender = room.users.get(currentUserId);
    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      userId: currentUserId,
      username: sender ? sender.username : 'Guest',
      text: cleanText,
      timestamp: Date.now()
    };

    room.chat.push(msg);
    if (room.chat.length > 100) room.chat.shift();
    io.to(currentRoomCode).emit('chat_message', msg);
  });

  // Floating Emoji Reactions + Fun Sound Cue
  socket.on('emoji_reaction', ({ emoji, videoTime }) => {
    if (!currentRoomCode || !rooms.has(currentRoomCode)) return;
    const room = rooms.get(currentRoomCode);
    const sender = room.users.get(currentUserId);
    io.to(currentRoomCode).emit('emoji_reaction', {
      id: 'rx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      emoji,
      videoTime: videoTime || 0,
      userId: currentUserId,
      username: sender ? sender.username : 'Guest',
      timestamp: Date.now()
    });
  });

  // Shared Playlist Operations (Add, Remove, Upvote, Play Next)
  socket.on('playlist_action', (payload) => {
    if (!currentRoomCode || !rooms.has(currentRoomCode)) return;
    const room = rooms.get(currentRoomCode);

    if (payload.type === 'ADD') {
      const exists = room.playlist.some(item => item.url === payload.item.url);
      if (!exists) {
        room.playlist.push({
          ...payload.item,
          addedBy: room.users.get(currentUserId)?.username || 'User',
          votes: 1
        });
      }
    } else if (payload.type === 'REMOVE') {
      room.playlist = room.playlist.filter(item => item.id !== payload.itemId);
    } else if (payload.type === 'UPVOTE') {
      const target = room.playlist.find(item => item.id === payload.itemId);
      if (target) {
        target.votes = (target.votes || 1) + 1;
        room.playlist.sort((a, b) => (b.votes || 1) - (a.votes || 1));
      }
    }

    io.to(currentRoomCode).emit('playlist_updated', room.playlist);
  });

  // Group Polls (Create & Vote)
  socket.on('poll_action', (payload) => {
    if (!currentRoomCode || !rooms.has(currentRoomCode)) return;
    const room = rooms.get(currentRoomCode);

    if (payload.type === 'CREATE') {
      const poll = {
        id: 'poll_' + Date.now(),
        question: payload.question.trim().slice(0, 120),
        creator: room.users.get(currentUserId)?.username || 'Host',
        options: (payload.options || []).map((opt, idx) => ({
          id: idx,
          text: opt.trim().slice(0, 60),
          voters: []
        })),
        createdAt: Date.now()
      };
      room.polls.unshift(poll);
    } else if (payload.type === 'VOTE') {
      const poll = room.polls.find(p => p.id === payload.pollId);
      if (poll) {
        poll.options.forEach(opt => {
          opt.voters = opt.voters.filter(v => v !== currentUserId);
        });
        const chosen = poll.options.find(o => o.id === payload.optionId);
        if (chosen) chosen.voters.push(currentUserId);
      }
    }

    io.to(currentRoomCode).emit('polls_updated', room.polls);
  });

  // Host Transfer
  socket.on('transfer_host', ({ targetUserId }) => {
    if (!currentRoomCode || !rooms.has(currentRoomCode)) return;
    const room = rooms.get(currentRoomCode);
    if (room.hostId !== currentUserId) return; // Only current host can manually transfer
    if (!room.users.has(targetUserId)) return;

    room.hostId = targetUserId;
    const newHostName = room.users.get(targetUserId).username;
    const sysMsg = {
      id: 'sys_' + Date.now(),
      system: true,
      text: `👑 Host controls transferred to ${newHostName}.`,
      timestamp: Date.now()
    };
    room.chat.push(sysMsg);

    io.to(currentRoomCode).emit('host_transferred', {
      hostId: room.hostId,
      users: Array.from(room.users.values()),
      systemMessage: sysMsg
    });
  });

  // Bonus Creative Feature: Synchronized Cinema Lights Out Mode
  socket.on('toggle_lights_out', () => {
    if (!currentRoomCode || !rooms.has(currentRoomCode)) return;
    const room = rooms.get(currentRoomCode);
    room.lightsOut = !room.lightsOut;
    io.to(currentRoomCode).emit('lights_out_toggled', {
      lightsOut: room.lightsOut,
      actor: room.users.get(currentUserId)?.username || 'Someone'
    });
  });

  // Handle Disconnections & Automatic Host Failover
  socket.on('disconnect', () => {
    if (!currentRoomCode || !rooms.has(currentRoomCode)) return;
    const room = rooms.get(currentRoomCode);
    const user = room.users.get(currentUserId);

    if (user) {
      user.online = false;

      // If host disconnected, failover to oldest online participant
      if (room.hostId === currentUserId) {
        const remainingOnline = Array.from(room.users.values())
          .filter(u => u.online)
          .sort((a, b) => a.joinedAt - b.joinedAt);

        if (remainingOnline.length > 0) {
          room.hostId = remainingOnline[0].userId;
          const failoverMsg = {
            id: 'sys_' + Date.now(),
            system: true,
            text: `⚡ ${user.username} disconnected. ${remainingOnline[0].username} is now the Host.`,
            timestamp: Date.now()
          };
          room.chat.push(failoverMsg);
        }
      }

      io.to(currentRoomCode).emit('room_users_updated', {
        users: Array.from(room.users.values()),
        hostId: room.hostId
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🎬 SyncStream Watch Party Server running on http://localhost:${PORT}`);
  console.log(`📊 Run 'npm run benchmark' in another terminal to verify p95 latency & 10+ user concurrency.\n`);
});
