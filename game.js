"use strict";
/* NEON HEIST. Sections: 1 setup, 2 host networking, 3 game logic, 4 drawing, 5 audio, 6 host UI/input, 7 phone controller. */
(() => {
  // ===== 1. SETUP =====
  const $ = (id) => document.getElementById(id);
  const PREFIX = "neonheist-";            // PeerJS id = PREFIX + room code
  const T = 40, COLS = 23, ROWS = 15;     // tile size and maze size (odd numbers needed by the maze generator)
  const W = COLS * T, H = ROWS * T, GAME_TIME = 90;
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const roomParam = new URLSearchParams(location.search).get("room");
  if (roomParam) initController(); else initHost();

  // ===== HOST (laptop) =====
  function initHost() {
    const canvas = $("game-canvas"), ctx = canvas.getContext("2d");
    canvas.width = W; canvas.height = H;
    let peer = null, conn = null, room = "", connected = false, state = "lobby", idRetries = 0;
    let grid, wallCanvas, keys, drones, rings, exit, p;
    let score = 0, lives = 3, keysGot = 0, time = GAME_TIME, cd = 3, lastCd = 0, inv = 0, dash = 0, dashCd = 0;
    let audioCtx = null, muted = false, lastNet = 0, lastTick = 0;
    const padHeld = {}, keyHeld = {};

    // ===== 2. HOST NETWORKING =====
    function setConn(kind, text) {
      $("host-conn").dataset.state = kind; $("host-conn-text").textContent = text;
      $("lobby-status").dataset.state = kind; $("lobby-status").textContent = text;
    }
    function showError(msg) {
      $("host-error").textContent = msg; $("host-error").hidden = false; $("retry-host-btn").hidden = false;
      setConn("error", "Not connected");
    }
    function makeQR(el, url, size) {
      el.innerHTML = "";
      if (typeof QRCode === "undefined") { el.textContent = "QR library failed to load. Use the link instead."; return; }
      new QRCode(el, { text: url, width: size, height: size, colorDark: "#05060f", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M });
    }
    function initPeer() {
      if (peer) { try { peer.destroy(); } catch (e) {} }
      conn = null; connected = false;
      $("host-error").hidden = true; $("retry-host-btn").hidden = true;
      $("start-btn").disabled = true;
      room = Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
      ["host-room-code", "lobby-room-code", "paused-room-code"].forEach((id) => ($(id).textContent = room));
      setConn("connecting", "Starting up…");
      if (typeof Peer === "undefined") { showError("The PeerJS library did not load. Check your internet connection and reload."); return; }
      peer = new Peer(PREFIX + room);
      peer.on("open", () => {
        idRetries = 0;
        // The QR code holds this page's own address plus ?room=CODE, so it works locally and on GitHub Pages.
        const url = location.origin + location.pathname + "?room=" + room;
        makeQR($("qr-box"), url, 200); makeQR($("qr-box-paused"), url, 150);
        $("controller-link").textContent = url; $("controller-link").href = url;
        setConn("waiting", "Waiting for your phone…");
      });
      peer.on("connection", (c) => {
        const old = conn; conn = c;          // a new phone replaces the old connection (handy after a phone refresh)
        if (old) { try { old.close(); } catch (e) {} }
        c.on("open", () => onConnected(c));
        c.on("data", onData);
        c.on("close", () => onLost(c));
        c.on("error", () => onLost(c));
      });
      peer.on("disconnected", () => { setConn("connecting", "Reconnecting to server…"); try { peer.reconnect(); } catch (e) {} });
      peer.on("error", (err) => {
        if (err.type === "unavailable-id" && idRetries++ < 3) return initPeer();   // room code clash: pick another
        showError("Could not reach the PeerJS server (" + err.type + "). Check your internet connection, then retry.");
      });
    }
    function onConnected(c) {
      if (c !== conn) return;
      connected = true; setConn("connected", "CONTROLLER CONNECTED");
      $("start-btn").disabled = state !== "lobby";
      $("start-hint").textContent = "Press Start heist, or press ACTION on your phone.";
      beep(660, .12, "square", .05, 990); sendState();
    }
    function onLost(c) {
      if (c !== conn) return;
      connected = false; conn = null; padHeld.up = padHeld.down = padHeld.left = padHeld.right = false;
      setConn("waiting", "Phone disconnected. Scan the code again.");
      $("start-btn").disabled = true;
    }
    function onData(m) {
      if (!m || typeof m !== "object") return;
      if (m.t === "dir" && ["up", "down", "left", "right"].includes(m.d)) padHeld[m.d] = !!m.p;
      else if (m.t === "rel") padHeld.up = padHeld.down = padHeld.left = padHeld.right = false;
      else if (m.t === "act") onAct();
    }
    function sendState() {
      if (!conn || !conn.open) return;
      conn.send({ t: "s", st: state, sc: score, l: lives, tm: Math.ceil(time), k: keysGot, x: +(p.x / W).toFixed(3), y: +(p.y / H).toFixed(3) });
    }

    // ===== 3. GAME LOGIC (the laptop owns all rules) =====
    const md = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
    function pick(cells, n, ok, out) { for (const c of cells) { if (out.length >= n) break; if (ok(c, out)) out.push(c); } }
    function genMaze() {
      // Depth-first search carves a maze where every spot is reachable, then a few walls are removed to make loops.
      const g = Array.from({ length: ROWS }, () => Array(COLS).fill(1));
      const cw = (COLS - 1) / 2, ch = (ROWS - 1) / 2;
      const seen = Array.from({ length: ch }, () => Array(cw).fill(false));
      const stack = [[0, 0]]; seen[0][0] = true; g[1][1] = 0;
      while (stack.length) {
        const [cx, cy] = stack[stack.length - 1];
        const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy, dx, dy])
          .filter(([x, y]) => x >= 0 && y >= 0 && x < cw && y < ch && !seen[y][x]);
        if (!nb.length) { stack.pop(); continue; }
        const [nx, ny, dx, dy] = nb[Math.floor(Math.random() * nb.length)];
        seen[ny][nx] = true; g[ny * 2 + 1][nx * 2 + 1] = 0; g[cy * 2 + 1 + dy][cx * 2 + 1 + dx] = 0;
        stack.push([nx, ny]);
      }
      for (let i = 0; i < 26; i++) {
        const x = 1 + Math.floor(Math.random() * (COLS - 2)), y = 1 + Math.floor(Math.random() * (ROWS - 2));
        if (g[y][x] === 1 && (x % 2 === 1) !== (y % 2 === 1)) g[y][x] = 0;
      }
      return g;
    }
    function newGame() {
      grid = genMaze(); buildWalls();
      p = { x: T * 1.5, y: T * 1.5 };
      score = 0; lives = 3; keysGot = 0; time = GAME_TIME; inv = 0; dash = 0; dashCd = 0; rings = [];
      exit = { c: COLS - 2, r: ROWS - 2, x: (COLS - 1.5) * T, y: (ROWS - 1.5) * T };
      const cells = [];
      for (let r = 1; r < ROWS; r += 2) for (let c = 1; c < COLS; c += 2) cells.push([c, r]);
      cells.sort(() => Math.random() - 0.5);
      const ks = [], ds = [];
      pick(cells, 3, (c, o) => md(c, [1, 1]) >= 10 && md(c, [exit.c, exit.r]) >= 4 && o.every((k) => md(c, k) >= 6), ks);
      pick(cells, 3, (c, o) => !o.includes(c) && md(c, [1, 1]) >= 4, ks);
      pick(cells, 3, (c, o) => md(c, [1, 1]) >= 12 && !ks.includes(c), ds);
      pick(cells, 3, (c, o) => !o.includes(c) && !ks.includes(c) && md(c, [1, 1]) >= 6, ds);
      keys = ks.map(([c, r]) => ({ x: c * T + T / 2, y: r * T + T / 2, got: false }));
      drones = ds.map(([c, r]) => ({ x: c * T + T / 2, y: r * T + T / 2, c, r, tc: c, tr: r, pc: c, pr: r }));
    }
    function hitWall(x, y) {
      const h = 10;
      for (const [ox, oy] of [[-h, -h], [h, -h], [-h, h], [h, h]]) if (grid[Math.floor((y + oy) / T)][Math.floor((x + ox) / T)] === 1) return true;
      return false;
    }
    function move(dx, dy) { p.x += dx; p.y += dy; if (hitWall(p.x, p.y)) { p.x -= dx; p.y -= dy; } }
    function moveDrone(d, dt) {
      let step = 100 * dt;
      while (step > 0) {
        const tx = d.tc * T + T / 2, ty = d.tr * T + T / 2, dist = Math.hypot(tx - d.x, ty - d.y);
        if (dist > step) { d.x += ((tx - d.x) / dist) * step; d.y += ((ty - d.y) / dist) * step; return; }
        d.x = tx; d.y = ty; step -= dist; d.pc = d.c; d.pr = d.r; d.c = d.tc; d.r = d.tr;
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [d.c + a, d.r + b]).filter(([c, r]) => grid[r][c] === 0);
        const fwd = opts.filter(([c, r]) => !(c === d.pc && r === d.pr));
        const pool = fwd.length ? fwd : opts;
        [d.tc, d.tr] = pool[Math.floor(Math.random() * pool.length)];
        if (step === 0) return;
      }
    }
    const held = (dir) => padHeld[dir] || keyHeld[dir];
    function update(dt) {
      time -= dt;
      if (time <= 0) { time = 0; return finish(false, "Time ran out."); }
      inv = Math.max(0, inv - dt); dash = Math.max(0, dash - dt); dashCd = Math.max(0, dashCd - dt);
      let vx = (held("right") ? 1 : 0) - (held("left") ? 1 : 0), vy = (held("down") ? 1 : 0) - (held("up") ? 1 : 0);
      if (vx && vy) { vx *= 0.7071; vy *= 0.7071; }
      const s = (dash > 0 ? 330 : 160) * dt;
      move(vx * s, 0); move(0, vy * s);
      for (const k of keys) if (!k.got && Math.hypot(k.x - p.x, k.y - p.y) < 22) {
        k.got = true; keysGot++; score += 100; rings.push({ x: k.x, y: k.y, t: 0 }); beep(880, .18, "square", .06, 1320);
      }
      for (const d of drones) {
        moveDrone(d, dt);
        if (inv <= 0 && Math.hypot(d.x - p.x, d.y - p.y) < 22) {
          lives--; inv = 1.6; beep(150, .35, "sawtooth", .08, 50);
          if (lives <= 0) return finish(false, "The drones got you.");
        }
      }
      if (keysGot === 3 && Math.hypot(exit.x - p.x, exit.y - p.y) < 20) finish(true, "You escaped with all three keys.");
    }
    function finish(win, msg) {
      if (win) { score += 500 + Math.floor(time) * 10; [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .2, "square", .06), i * 120)); }
      else beep(220, .6, "sawtooth", .08, 70);
      padHeld.up = padHeld.down = padHeld.left = padHeld.right = false;
      $("end-title").textContent = win ? "Vault cracked" : "Game over";
      $("end-message").textContent = msg;
      $("end-score").textContent = score; $("end-keys").textContent = keysGot + " / 3"; $("end-time").textContent = Math.ceil(time) + "s";
      setState(win ? "win" : "over");
    }
    function setState(s) {
      state = s;
      $("overlay-lobby").hidden = s !== "lobby";
      $("overlay-countdown").hidden = s !== "countdown";
      $("overlay-end").hidden = !(s === "win" || s === "over");
      $("start-btn").disabled = !(connected && s === "lobby");
      sendState();
    }
    function startCountdown() { newGame(); cd = 3; lastCd = 0; setState("countdown"); }
    function onAct() {
      initAudio();
      if (state === "lobby") { if (connected) startCountdown(); }
      else if (state === "win" || state === "over") restartGame();
      else if (state === "playing" && dashCd <= 0) { dash = 0.25; dashCd = 2.5; beep(300, .15, "triangle", .06, 800); }
    }
    function restartGame() { if (connected) startCountdown(); else { newGame(); setState("lobby"); } }

    // ===== 4. DRAWING =====
    const PAL = { 1: "#00e5ff", 2: "#ffffff", 3: "#8a5cff", 4: "#ff2bd6", 5: "#ffe14d" };
    const PLAYER = ["..1111..", ".111111.", ".122221.", ".122221.", "..1111..", ".133331.", "1.1331.1", "..1..1.."];
    const DRONE = ["...22...", "..4444..", ".444444.", "44244244", ".444444.", "4.4444.4", "4..44..4", "...55..."];
    function sprite(rows, cx, cy, px) {
      const x0 = cx - (rows[0].length * px) / 2, y0 = cy - (rows.length * px) / 2;
      rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ".") { ctx.fillStyle = PAL[ch]; ctx.fillRect(x0 + i * px, y0 + j * px, px, px); } }));
    }
    function buildWalls() {
      wallCanvas = document.createElement("canvas"); wallCanvas.width = W; wallCanvas.height = H;
      const w = wallCanvas.getContext("2d");
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === 1) {
          w.fillStyle = "#0c1233"; w.fillRect(c * T, r * T, T, T);
          w.save(); w.strokeStyle = "rgba(0,229,255,.6)"; w.lineWidth = 2; w.shadowColor = "#00e5ff"; w.shadowBlur = 8;
          w.strokeRect(c * T + 3, r * T + 3, T - 6, T - 6); w.restore();
        } else { w.fillStyle = "rgba(138,92,255,.28)"; w.fillRect(c * T + T / 2 - 1, r * T + T / 2 - 1, 2, 2); }
      }
    }
    function draw(t) {
      ctx.fillStyle = "#060814"; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(wallCanvas, 0, 0);
      const pulse = 0.5 + 0.5 * Math.sin(t / 250), open = keysGot === 3;
      ctx.save(); ctx.shadowColor = open ? "#3dffb0" : "#ff2bd6"; ctx.shadowBlur = 10 + pulse * 16;
      ctx.strokeStyle = open ? "#3dffb0" : "#ff2bd6"; ctx.lineWidth = 3; ctx.globalAlpha = open ? 1 : 0.5;
      ctx.strokeRect(exit.x - 15, exit.y - 15, 30, 30);
      if (open) { ctx.fillStyle = "rgba(61,255,176,.35)"; ctx.fillRect(exit.x - 15, exit.y - 15, 30, 30); }
      ctx.restore();
      ctx.save(); ctx.shadowColor = "#ffe14d"; ctx.shadowBlur = 14; ctx.fillStyle = "#ffe14d";
      for (const k of keys) if (!k.got) {
        const y = k.y + Math.sin(t / 300 + k.x) * 3;
        ctx.beginPath(); ctx.arc(k.x - 4, y - 3, 6, 0, 7); ctx.fill(); ctx.fillRect(k.x - 1, y, 14, 4); ctx.fillRect(k.x + 8, y, 3, 8);
        ctx.globalCompositeOperation = "destination-out"; ctx.beginPath(); ctx.arc(k.x - 4, y - 3, 2.5, 0, 7); ctx.fill(); ctx.globalCompositeOperation = "source-over";
      }
      ctx.restore();
      rings = rings.filter((r) => (r.t += 0.03) < 1);
      for (const r of rings) { ctx.strokeStyle = "rgba(255,225,77," + (1 - r.t) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, 8 + r.t * 40, 0, 7); ctx.stroke(); }
      ctx.save(); ctx.shadowColor = "#ff2bd6"; ctx.shadowBlur = 14;
      for (const d of drones) sprite(DRONE, d.x, d.y + Math.sin(t / 200 + d.c) * 2, 3);
      ctx.restore();
      if (!(inv > 0 && Math.floor(t / 90) % 2)) { ctx.save(); ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = dash > 0 ? 28 : 12; sprite(PLAYER, p.x, p.y, 3); ctx.restore(); }
    }
    function hud() {
      $("hud-time").textContent = Math.ceil(time); $("hud-time").classList.toggle("warn", state === "playing" && time <= 15);
      $("hud-score").textContent = score;
      document.querySelectorAll("#hud-keys .key-icon").forEach((e, i) => e.classList.toggle("got", i < keysGot));
      document.querySelectorAll("#hud-lives .life-icon").forEach((e, i) => e.classList.toggle("lost", i >= lives));
    }
    function fit() {
      const s = $("stage"), k = Math.min((s.clientWidth - 16) / W, (s.clientHeight - 16) / H);
      canvas.style.width = Math.floor(W * k) + "px"; canvas.style.height = Math.floor(H * k) + "px";
    }

    // ===== 5. AUDIO (generated with the Web Audio API, no sound files needed) =====
    function initAudio() {
      try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === "suspended") audioCtx.resume(); } catch (e) {}
    }
    function beep(f, d, type, v, f2) {
      if (muted || !audioCtx) return;
      try {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain(), n = audioCtx.currentTime;
        o.type = type; o.frequency.setValueAtTime(f, n); if (f2) o.frequency.exponentialRampToValueAtTime(f2, n + d);
        g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(0.0001, n + d);
        o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(n + d);
      } catch (e) {}
    }

    // ===== 6. HOST LOOP, BUTTONS AND KEYBOARD =====
    function loop(t) {
      const dt = Math.min(0.05, (t - lastTick) / 1000 || 0); lastTick = t;
      const paused = !connected && (state === "countdown" || state === "playing");
      $("overlay-paused").hidden = !paused;
      if (!paused) {
        if (state === "countdown") {
          cd -= dt; const n = Math.ceil(cd);
          if (n !== lastCd && n > 0) { lastCd = n; $("countdown-number").textContent = n; beep(520, .1, "square", .05); }
          if (cd <= 0) { setState("playing"); beep(1040, .3, "square", .06); }
        } else if (state === "playing") update(dt);
      }
      draw(t); hud();
      if (t - lastNet > 100) { lastNet = t; sendState(); }
      requestAnimationFrame(loop);
    }
    $("start-btn").addEventListener("click", () => { initAudio(); if (connected) startCountdown(); });
    $("restart-btn").addEventListener("click", () => { initAudio(); restartGame(); });
    $("retry-host-btn").addEventListener("click", initPeer);
    $("copy-link-btn").addEventListener("click", () => {
      const b = $("copy-link-btn");
      (navigator.clipboard ? navigator.clipboard.writeText($("controller-link").href) : Promise.reject()).then(() => (b.textContent = "Copied"), () => (b.textContent = "Select and copy the link"));
      setTimeout(() => (b.textContent = "Copy link"), 2000);
    });
    $("mute-btn").addEventListener("click", () => {
      muted = !muted; $("mute-btn").setAttribute("aria-pressed", muted); $("mute-label").textContent = muted ? "Sound off" : "Sound on"; initAudio();
    });
    const KEYMAP = { ArrowUp: "up", w: "up", ArrowDown: "down", s: "down", ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right" };
    addEventListener("keydown", (e) => {
      if (!connected) return;                       // keyboard works only once a phone is connected
      const dir = KEYMAP[e.key]; if (dir) { keyHeld[dir] = true; e.preventDefault(); }
      else if (e.key === " " && !e.repeat) { e.preventDefault(); onAct(); }
    });
    addEventListener("keyup", (e) => { const dir = KEYMAP[e.key]; if (dir) keyHeld[dir] = false; });
    addEventListener("blur", () => { for (const k in keyHeld) keyHeld[k] = false; });
    addEventListener("resize", fit);

    newGame(); setState("lobby"); fit(); initPeer(); requestAnimationFrame(loop);
  }

  // ===== 7. PHONE CONTROLLER =====
  function initController() {
    const room = roomParam.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    let peer = null, conn = null, timer = null;
    $("pad-room-code").textContent = room || "------";
    const setPad = (kind, text) => { $("pad-conn").dataset.state = kind; $("pad-conn-text").textContent = text; };
    const send = (m) => { if (conn && conn.open) conn.send(m); };
    function fail(msg) {
      clearTimeout(timer); setPad("error", "Not connected");
      $("pad-error").textContent = msg; $("pad-error").hidden = false; $("reconnect-btn").hidden = false;
      $("pad-message").textContent = "";
    }
    function connect() {
      $("pad-error").hidden = true; $("reconnect-btn").hidden = true;
      setPad("connecting", "Connecting…"); $("pad-message").textContent = "Connecting to the laptop…";
      if (room.length !== 6) return fail("This link has no valid room code. Scan the QR code on the laptop again.");
      if (typeof Peer === "undefined") return fail("The PeerJS library did not load. Check your internet connection and reload.");
      if (peer) { try { peer.destroy(); } catch (e) {} }
      clearTimeout(timer);
      timer = setTimeout(() => { if (!conn || !conn.open) fail("The laptop did not answer. Make sure the game page is open, both devices are online, then tap Reconnect."); }, 12000);
      const me = (peer = new Peer());
      me.on("open", () => {
        const c = (conn = me.connect(PREFIX + room, { reliable: true }));
        c.on("open", () => {
          if (c !== conn) return;
          clearTimeout(timer); setPad("connected", "Connected"); $("pad-message").textContent = "Press ACTION to start.";
        });
        c.on("data", onState);
        c.on("close", () => { if (c === conn) fail("Connection to the laptop was lost."); });
        c.on("error", () => { if (c === conn) fail("Connection error."); });
      });
      me.on("error", (e) => {
        if (me !== peer) return;
        fail(e.type === "peer-unavailable" ? "Room not found. Check that the code matches the one on the laptop, or scan the QR code again." : "Connection error (" + e.type + "). Check your internet connection.");
      });
    }
    const MSG = { lobby: "Press ACTION to start.", countdown: "Get ready…", playing: "Go! ACTION dashes.", win: "Vault cracked! ACTION to play again.", over: "Game over. ACTION to play again." };
    function onState(m) {
      if (!m || m.t !== "s") return;
      $("pad-time").textContent = m.st === "lobby" ? "--" : m.tm; $("pad-score").textContent = m.sc;
      $("pad-lives").textContent = m.l; $("pad-keys").textContent = m.k + "/3"; $("pad-message").textContent = MSG[m.st] || "";
    }
    function hold(el, down, up) {
      let on = false;
      const d = (e) => { e.preventDefault(); if (on) return; on = true; el.classList.add("active"); if (navigator.vibrate) navigator.vibrate(12); down(); };
      const u = (e) => { e.preventDefault(); if (!on) return; on = false; el.classList.remove("active"); up(); };
      el.addEventListener("touchstart", d, { passive: false });
      el.addEventListener("touchend", u, { passive: false }); el.addEventListener("touchcancel", u, { passive: false });
      el.addEventListener("mousedown", d); el.addEventListener("mouseup", u); el.addEventListener("mouseleave", u);   // mouse fallback for desktop testing
      el.addEventListener("contextmenu", (e) => e.preventDefault());
    }
    document.querySelectorAll(".dir").forEach((b) => hold(b, () => send({ t: "dir", d: b.dataset.dir, p: true }), () => send({ t: "dir", d: b.dataset.dir, p: false })));
    hold($("action-btn"), () => send({ t: "act" }), () => {});
    document.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });   // stop the page from scrolling
    const release = () => send({ t: "rel" });
    addEventListener("blur", release); document.addEventListener("visibilitychange", () => { if (document.hidden) release(); });
    $("reconnect-btn").addEventListener("click", connect);
    connect();
  }
})();
