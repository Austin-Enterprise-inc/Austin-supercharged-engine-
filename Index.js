/**
 * Austin Supercharge Mesh — Single File System
 * Event-driven adaptive processing loop (self-contained)
 */

const express = require("express");

const app = express();
app.use(express.json());

/**
 * =========================
 * IN-MEMORY STATE LAYER
 * =========================
 */

const state = {
  queue: [],
  results: [],
  policy: {
    threshold: 0.2
  },
  stats: {
    processed: 0,
    dropped: 0
  }
};

/**
 * =========================
 * EVENT INGESTION API
 * =========================
 */

app.post("/event", (req, res) => {
  state.queue.push(req.body);
  res.json({ status: "queued" });
});

/**
 * =========================
 * WORKER LOOP
 * =========================
 */

function processLoop() {
  const event = state.queue.shift();
  if (!event) return;

  let score = 0.5;

  if (event.spam) score -= 0.4;
  if (event.target_kw) score += 0.2;

  state.stats.processed++;

  if (score < state.policy.threshold) {
    state.stats.dropped++;
    state.results.push({ status: "dropped", score });
    return;
  }

  state.results.push({ status: "processed", score });
}

/**
 * =========================
 * CONTROL LOOP (ADAPTIVE ENGINE)
 * =========================
 */

function controlLoop() {
  const { processed, dropped } = state.stats;
  const total = processed + dropped;

  if (total === 0) return;

  const dropRate = dropped / total;

  if (dropRate > 0.3) {
    state.policy.threshold += 0.05;
  } else {
    state.policy.threshold -= 0.01;
  }

  // clamp
  state.policy.threshold = Math.max(
    0.05,
    Math.min(0.9, state.policy.threshold)
  );

  console.log("[CONTROL]", {
    dropRate: dropRate.toFixed(2),
    threshold: state.policy.threshold.toFixed(2)
  });
}

/**
 * =========================
 * SYSTEM LOOPS
 * =========================
 */

setInterval(processLoop, 50);
setInterval(controlLoop, 2000);

/**
 * =========================
 * START SERVER
 * =========================
 */

app.listen(3000, () => {
  console.log("Austin Supercharge Mesh ONLINE on port 3000");
});

/**
 * =========================
 * EXPORT (for GitHub clarity)
 * =========================
 */

module.exports = {
  state
};
