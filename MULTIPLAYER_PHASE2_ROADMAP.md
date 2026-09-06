# 🌐 Multiplayer Architecture & Phase 2 Roadmap

This document serves as the permanent specification and architectural roadmap for **Multiplayer Games** in ForStore / Cafe Game Store.

---

## 📌 Phase 1 Status ($0 Infrastructure Cost)

To keep operating costs at **$0 / month** for today's MVP production launch, all external real-time WebSocket servers have been deferred to Phase 2.

### Zero-Cost Multiplayer Possibilities for Phase 1:
If multiplayer is desired in Phase 1 without adding any server or infrastructure costs, it can be implemented via **Same-Device 2-Player Tabletop Mode**:
- **How it Works**: The phone or tablet sits flat on the table between two people. Player 1 controls the bottom half, Player 2 controls the top half (mirrored 180°).
- **Infrastructure Cost**: **$0.00** (100% client-side Canvas physics and Web Audio API; zero server requests).
- **Latency**: **0 ms** (exact same physical glass screen).
- **Target Games**:
  1. 🏒 **Neon Air Hockey 2P**: Dual touch paddles, real-time puck bouncing, first to 5 goals.
  2. ⚡ **Tap War / Tug-of-War 2P**: Frantic head-to-head tapping duel pushing an energy bar to the opponent's side.
  3. 🎯 **Reaction Slap 2P**: First person to tap when the color or shape matches wins the round.

---

## 🚀 Phase 2 Specification: Real-Time Device-to-Device Multiplayer

When moving into Phase 2, the following architecture will be deployed for device-to-device and venue-wide competition:

### 1. Technology Stack
- **Real-Time Engine**: [PartyKit](https://partykit.io) (Cloudflare Workers WebSockets) or a lightweight Node.js `ws` / `Socket.io` microservice.
- **Connection Model**: Ephemeral WebSocket rooms keyed by 4-digit PINs (`ROOM_PIN`).
- **Data Protocol**: Lightweight JSON/ArrayBuffer binary payloads (< 30 bytes per game tick).
- **Bandwidth Consumption**: ~5 KB to 15 KB per minute per active player.

### 2. Matchmaking Flows
1. **Friend / Family Challenge (1v1)**:
   - Player 1 taps "Challenge Friend" $\rightarrow$ Screen displays 4-digit PIN (e.g. `8421`) and a scannable QR code.
   - Player 2 scans Player 1's phone camera or enters `8421`.
   - Both devices sync instantly into a private room.
2. **Venue-Wide Stranger Matchmaking**:
   - Customer toggles "Find Opponent at [Store Name]".
   - The venue room pairs any two waiting customers anonymously for a quick 60-second duel.
3. **Venue-Wide Trivia / Party Lobby (Kahoot-Style)**:
   - Every 5–10 minutes, a venue-wide speed quiz or prediction poll launches.
   - All tables can join the same lobby and compete for the venue crown.

### 3. Core Phase 2 Game Modes
1. 🏎️ **Live Ghost Racing**:
   - Both players play an endless seed (*Helix Drop*, *Sky Hopper*, or *Tower Stack*).
   - Each player sees a semi-transparent ghost avatar of the opponent with a live progress bar (`YOU: 450m ⚡ vs ⚡ OPPONENT: 420m`).
   - Completely immune to network lag spikes through client interpolation (lerping).
2. 🏓 **Direct Real-Time Air Hockey & Pong**:
   - Shared physics simulation with client prediction and server reconciliation.

---

## 💰 Phase 2 Infrastructure Cost Estimates

| Tier | Concurrent Connected Players | Technology | Estimated Monthly Cost |
|---|---|---|---|
| **Free / Starter** | Up to 100 concurrent rooms | PartyKit Free Tier / Cloudflare Workers | **$0 / month** |
| **Growth Tier** | 1,000 – 5,000 concurrent players | Cloudflare Paid ($5) or Railway Node container | **$5 – $15 / month** |
| **Scale Tier** | 50,000+ concurrent players across 100s of venues | Distributed Edge WebSockets | **~$30 – $50 / month** |

---

*Preserved for Phase 2 implementation. Reference this file when initiating real-time multiplayer development.*
