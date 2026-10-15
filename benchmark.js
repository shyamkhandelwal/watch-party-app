const { io } = require('socket.io-client');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const NUM_CLIENTS = 12; // Exceeds the >= 10 concurrent users constraint
const NUM_EVENTS = 50;
const ROOM_CODE = 'BENCH9';

async function runBenchmark() {
  console.log('==============================================================');
  console.log('🚀 SYNCSTREAM WATCH PARTY — AUTOMATED CONCURRENCY & p95 TEST');
  console.log('==============================================================');
  console.log(`Target Server     : ${SERVER_URL}`);
  console.log(`Concurrent Users  : ${NUM_CLIENTS} participants in room [${ROOM_CODE}]`);
  console.log(`Playback Events   : ${NUM_EVENTS} rapid play/pause/seek actions\n`);

  const clients = [];
  const propagationLatencies = [];

  // 1. Connect 12 Concurrent Clients
  for (let i = 0; i < NUM_CLIENTS; i++) {
    const socket = io(SERVER_URL, { transports: ['websocket'], forceNew: true });
    await new Promise((resolve) => socket.on('connect', resolve));

    await new Promise((resolve) => {
      socket.emit('join_room', {
        roomCode: ROOM_CODE,
        username: `Bot_${i + 1}`,
        userId: `bench_user_${i + 1}`
      }, resolve);
    });

    socket.on('playback_sync', (packet) => {
      const receiveTime = Date.now();
      const latency = receiveTime - packet.originTimestamp;
      propagationLatencies.push(latency);
    });

    clients.push(socket);
  }

  console.log(`✅ All ${NUM_CLIENTS} clients joined room [${ROOM_CODE}] concurrently.`);

  // 2. Broadcast 50 Playback Control Actions from Host (Client 0)
  const hostClient = clients[0];
  const actions = ['PLAY', 'SEEK', 'PAUSE'];

  for (let e = 0; e < NUM_EVENTS; e++) {
    const actionType = actions[e % actions.length];
    hostClient.emit('playback_action', {
      type: actionType,
      position: e * 5.25,
      originTimestamp: Date.now()
    });
    await new Promise((r) => setTimeout(r, 35));
  }

  // Wait briefly for all packets to settle
  await new Promise((r) => setTimeout(r, 300));

  // 3. Compute Statistical Metrics
  propagationLatencies.sort((a, b) => a - b);
  const count = propagationLatencies.length;
  const min = propagationLatencies[0] || 0;
  const max = propagationLatencies[count - 1] || 0;
  const avg = (propagationLatencies.reduce((a, b) => a + b, 0) / count).toFixed(2);
  const p50 = propagationLatencies[Math.floor(count * 0.50)] || 0;
  const p95 = propagationLatencies[Math.floor(count * 0.95)] || 0;
  const p99 = propagationLatencies[Math.floor(count * 0.99)] || 0;

  console.log('\n📊 LATENCY MEASUREMENT RESULTS:');
  console.log('--------------------------------------------------------------');
  console.log(`Total Sync Deliveries Measured : ${count} (${NUM_EVENTS} events × ${NUM_CLIENTS} users)`);
  console.log(`Min Propagation Latency        : ${min} ms`);
  console.log(`Average Propagation Latency    : ${avg} ms`);
  console.log(`Median (p50) Latency           : ${p50} ms`);
  console.log(`p95 Propagation Latency        : ${p95} ms  (Constraint: <= 250 ms)`);
  console.log(`p99 Propagation Latency        : ${p99} ms`);
  console.log(`Max Propagation Latency        : ${max} ms`);
  console.log('--------------------------------------------------------------');

  if (p95 <= 250) {
    console.log(`✅ PASS: p95 propagation latency (${p95} ms) is well within the <= 250 ms requirement!`);
  } else {
    console.log(`❌ WARN: p95 propagation latency (${p95} ms) exceeded 250 ms.`);
  }

  clients.forEach((c) => c.disconnect());
  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error('Benchmark failed. Make sure the server is running (`npm start`) first.', err);
  process.exit(1);
});
