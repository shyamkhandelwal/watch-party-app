# 🎬 SyncStream — Real-Time Synchronized Watch Party

A low-latency, multi-user watch-party web application built with **Node.js, Express, Socket.IO, and HTML5/Tailwind CSS**. Multiple participants can join rooms via invite links or room codes, watch movies in tight synchronization, discover movies via fuzzy search, react with floating emojis, vote on group polls, and manage shared playlists.

---

## ✨ Features & Core Requirements Checklist

- **Room Creation & Invite Links:** Instant 6-character room codes and shareable `?room=CODE` invite URLs.
- **Sub-250ms Synchronized Playback:** Authoritative state machine syncing `PLAY`, `PAUSE`, `SEEK`, and media switching across all connected clients using monotonic sequence numbers (`seq`).
- **Two-Tier Playback Drift Detection & Correction:**
  - **Tier 1 (120ms – 500ms drift):** Smooth **Playback Rate Modulation** (`1.05x` or `0.95x` speed adjustment) that eliminates drift without jarring audio/visual stutters.
  - **Tier 2 (> 500ms drift):** Immediate hard time-snap (`video.currentTime = expectedTime`) guaranteeing post-correction drift $\le 500\text{ ms}$.
- **Movie Discovery & Fuzzy Search:** Built-in subsequence + token scoring fuzzy search engine with category and rating filters.
- **Multi-User Interactivity:** Live room chat, physics-animated floating emoji reactions, up-votable shared playlists, real-time group polls, and manual/automatic host transfer.
- **Creative Bonus Features:**
  - **💡 Synchronized Cinema Lights Out Mode:** Dim non-video UI panels across all participants' screens simultaneously.
  - **📊 Live Telemetry HUD:** On-screen developer overlay displaying real-time Network RTT, last propagation latency, rolling p95 latency, and instantaneous playback drift.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the Watch Party server
npm start
