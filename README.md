# AUSTIN SUPERCHARGE ENGINE — RUNTIME IMPLEMENTATION
### Adaptive Event‑Processing Engine by Chad Alan Austin

## Overview
The Austin Supercharge Engine is an original, self‑adaptive event‑processing system authored by **Chad Alan Austin**. It evaluates the informational density of incoming events and optimizes throughput by filtering low‑value input in real time. The engine dynamically adjusts its filtering threshold based on system performance, ensuring stability, efficiency, and intelligent workload management.

This repository contains the clean, single‑file runnable implementation of the engine.

---

## Features
- Real‑time event ingestion via HTTP
- Informational density scoring for each event
- Adaptive threshold that tightens or relaxes based on drop rate
- Continuous processing loop and control loop
- Lightweight Express server with `/event` and `/health` endpoints
- Fully self‑contained runtime with no external dependencies beyond Express

---

## How It Works

### 1. Event Ingestion
Events are POSTed to `/event` and added to the internal queue.

### 2. Scoring
Each event receives an informational density score based on simple heuristics:
- Presence of `target_kw` increases score  
- Presence of `spam` decreases score  

Scores are normalized between **0.0 and 1.0**.

### 3. Processing
Events with scores **below the adaptive threshold** are dropped.  
Events above the threshold are processed.

### 4. Adaptive Control Loop
Every 2 seconds:
- If drop rate > 30% → threshold increases (stricter)
- If drop rate ≤ 30% → threshold decreases (more permissive)

Threshold is clamped between **0.05 and 0.9**.

### 5. Health Endpoint
`/health` returns the full system state:
- queue length  
- processed count  
- dropped count  
- current threshold  

---

## Single‑File System Code

```js
const express = require("express");
const app = express();

app.use(express.json());

const state = {
  queue: [],
  processed: 0,
  dropped: 0,
  threshold: 0.2
};

// INGESTION
app.post("/event", (req, res) => {
  state.queue.push(req.body);
  res.json({ status: "queued" });
});

// SCORE FUNCTION
function score(event) {
  let s = 0.5;

  if (event?.target_kw) s += 0.2;
  if (event?.spam) s -= 0.4;

  return Math.max(0, Math.min(1, s));
}

// PROCESSOR
function process() {
  const event = state.queue.shift();
  if (!event) return;

  const s = score(event);
  state.processed++;

  if (s < state.threshold) {
    state.dropped++;
    return;
  }
}

// CONTROL LOOP
function control() {
  const total = state.processed + state.dropped;
  if (!total) return;

  const dropRate = state.dropped / total;

  if (dropRate > 0.3) state.threshold += 0.05;
  else state.threshold -= 0.01;

  state.threshold = Math.max(0.05, Math.min(0.9, state.threshold));
}

// LOOPS
setInterval(process, 20);
setInterval(control, 2000);

app.get("/health", (req, res) => {
  res.json(state);
});

app.listen(3000, () => {
  console.log("Supercharge Mesh running");
});
