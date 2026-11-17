/* STILLWORKS front end. Vanilla JS, no trackers, no AI calls.
   Reads data/*.json and the API; if the API is down, the page shows empty states, never errors. */
(() => {
  "use strict";

  const B = window.BRAND || { name: "STILLWORKS", logo: ["STILL", "WORKS"], apiBase: "" };
  // "" = the live board isn't public yet (static host): never call it, say when it opens.
  const API = (B.apiBase || "").replace(/\/$/, "");
  // Calm copy while the board is closed (after 19 Nov it stops promising "launch day").
  const opensWhen = () => (launched() ? "when the live board goes up" : "with the board on launch day");
  const closedSubmit = () => `Submissions open ${opensWhen()}.`;
  const closedVote = () => `Voting opens ${opensWhen()}.`;
  const LAUNCH = new Date(B.launch || "2026-11-19T00:00:00");
  const WAIT_START = new Date(B.waitStart || "2023-12-05T00:00:00Z");
  const reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  const motionOK = () => !reduceMQ.matches;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  if (motionOK()) document.documentElement.classList.add("motion");

  /* ---------------------------------------------------------- helpers */
  function el(tag, props = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (k === "style") n.style.cssText = v;
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return n;
  }
  function icon(id, cls = "ic") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", cls);
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#" + id);
    svg.append(use);
    return svg;
  }
  const safeUrl = (u) => (typeof u === "string" && /^https:\/\//i.test(u) ? u : null);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  };
  async function getJSON(url, opts = {}, timeout = 4500) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeout);
    try {
      const res = await fetch(url, { ...opts, signal: ctl.signal, headers: { Accept: "application/json", ...(opts.headers || {}) } });
      let body = null;
      try { body = await res.json(); } catch { body = null; }
      // e.api only when the board itself answered with a reason (a 404 page from a static host is not that)
      if (!res.ok) { const e = new Error((body && body.error) || `HTTP ${res.status}`); e.status = res.status; e.api = !!(body && body.error); throw e; }
      if (body == null) throw new Error("Not JSON");
      return body;
    } finally { clearTimeout(t); }
  }
  const postJSON = (url, data) => getJSON(url, { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }, 8000);

  let toastTimer;
  function toast(msg) {
    const t = $(".toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3600);
  }
  function ago(iso) {
    if (!iso) return "";
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (!isFinite(s)) return "";
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
    const d = Math.floor(s / 86400);
    return d === 1 ? "yesterday" : d < 30 ? `${d} days ago` : new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }
  const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const launched = () => Date.now() >= LAUNCH.getTime();

  /* ---------------------------------------------------------- brand (one config spot) */
  function applyBrand() {
    $$("[data-brand]").forEach((n) => (n.textContent = B.name));
    $$("[data-tagline]").forEach((n) => (n.textContent = B.tagline));
    $$("[data-brand-label]").forEach((n) => n.setAttribute("aria-label", `${B.name} home`));
    const [a, b] = B.logo && B.logo.length ? B.logo : [B.name, ""];
    $$("[data-logo]").forEach((n) => { n.replaceChildren(el("span", { class: "n1", text: a }), el("span", { class: "n2", text: b || "" })); });
    document.title = `${B.name} · The live tracker for GTA 6`;
  }

  /* ---------------------------------------------------------- countdown (split-flap) + heat meter */
  function makeFlap() {
    const f = el("span", { class: "flap", "aria-hidden": "true", "data-v": "0" });
    for (const c of ["f-top", "f-bot", "f-ft", "f-fb"]) f.append(el("span", { class: c }, el("b", { text: "0" })));
    return f;
  }
  function setFlap(f, v) {
    const old = f.dataset.v;
    if (old === v) return;
    f.dataset.v = v;
    const [top, bot, ft, fb] = f.children;
    if (!motionOK() || f.dataset.init !== "1") {
      top.firstChild.textContent = bot.firstChild.textContent = v;
      f.dataset.init = "1";
      return;
    }
    top.firstChild.textContent = v;
    bot.firstChild.textContent = old;
    ft.firstChild.textContent = old;
    fb.firstChild.textContent = v;
    f.classList.remove("is-flipping");
    void f.offsetWidth;
    f.classList.add("is-flipping");
    clearTimeout(f._t);
    f._t = setTimeout(() => { bot.firstChild.textContent = v; f.classList.remove("is-flipping"); }, 420);
  }
  function setGroup(unit, str) {
    const g = $(`.flaps[data-unit="${unit}"]`);
    if (!g) return;
    while (g.children.length < str.length) g.append(makeFlap());
    while (g.children.length > str.length) g.lastChild.remove();
    [...str].forEach((ch, i) => setFlap(g.children[i], ch));
  }
  let lastUpdate = null; // latest game update (for the heat meter after launch)
  function tick() {
    const now = Date.now();
    const after = now >= LAUNCH.getTime();
    let diff = Math.abs(LAUNCH.getTime() - now) / 1000;
    const d = Math.floor(diff / 86400); diff -= d * 86400;
    const h = Math.floor(diff / 3600); diff -= h * 3600;
    const m = Math.floor(diff / 60);
    const s = Math.floor(diff - m * 60);
    const p2 = (n) => String(n).padStart(2, "0");
    setGroup("d", p2(d)); setGroup("h", p2(h)); setGroup("m", p2(m)); setGroup("s", p2(s));
    $("#tote-label").textContent = after ? "Out now · day " + (d + 1) : "Launch in";
    $(".tote-digits").setAttribute("aria-label", after ? "Time since launch" : "Time until launch");
    if (s === 0 || !tick.spoken) {
      $("#countdown-text").textContent = after
        ? `Out now. ${d} days, ${h} hours since launch.`
        : `${d} days, ${h} hours and ${m} minutes until launch.`;
      tick.spoken = true;
    }
    setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  }
  function setHeat() {
    const meter = $(".heat");
    let pct, title, sub, from, to;
    if (!launched()) {
      pct = Math.min(1, Math.max(0, (Date.now() - WAIT_START) / (LAUNCH - WAIT_START)));
      title = "The wait"; sub = "over";
      from = "Trailer 1 · 5 Dec 2023"; to = "Launch · 19 Nov 2026";
      $(".heat-pct").textContent = (pct * 100).toFixed(pct > 0.99 ? 1 : 0) + "%";
    } else if (lastUpdate) {
      const hrs = (Date.now() - new Date(lastUpdate.released_on + "T00:00:00Z")) / 3.6e6;
      pct = Math.max(0.04, 1 - hrs / 72);
      title = "Patch heat"; sub = `${lastUpdate.version} · ${Math.max(0, Math.round(hrs))} h ago`;
      from = "Cold: settled"; to = "Hot: re-check now";
      $(".heat-pct").textContent = pct > 0.66 ? "Hot" : pct > 0.33 ? "Warm" : "Cool";
    } else {
      pct = 0.04; title = "Patch heat"; sub = "no update logged yet";
      from = "Cold: settled"; to = "Hot: re-check now";
      $(".heat-pct").textContent = "Cold";
    }
    $(".heat-title").textContent = title;
    $(".heat-sub").textContent = sub;
    $(".heat-from").textContent = from;
    $(".heat-to").textContent = to;
    meter.setAttribute("aria-valuenow", String(Math.round(pct * 100)));
    meter.setAttribute("aria-valuetext", `${title}: ${$(".heat-pct").textContent} ${sub}`);
    const fill = $(".heat-fill");
    requestAnimationFrame(() => requestAnimationFrame(() => fill.style.setProperty("--heat", pct.toFixed(4))));
  }

  /* ---------------------------------------------------------- dusk canvas: generative Deco skyline + water reflection */
  function dusk() {
    const cv = $("#dusk");
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext("2d");
    const sky = document.createElement("canvas");
    const sctx = sky.getContext("2d");
    const COLORS = ["#5ff2c2", "#ffd166", "#ff5c8a", "#fff0d6", "#9db4ff"];
    let W = 0, H = 0, dpr = 1, horizon = 0, buildings = [], windows = [], running = false, visible = true, last = 0, raf = 0;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    function layout() {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      cv.width = W * dpr; cv.height = H * dpr;
      sky.width = W * dpr; sky.height = H * dpr;
      horizon = Math.round(H * 0.56);
      seed = 7; buildings = []; windows = [];
      let x = -10;
      while (x < W + 10) {
        const w = 22 + rnd() * 56;
        const tall = rnd() < 0.18;
        const h = (tall ? 0.55 : 0.18) * horizon + rnd() * (tall ? 0.4 : 0.38) * horizon;
        const steps = 1 + Math.floor(rnd() * 3);
        const fin = rnd() < 0.3 ? COLORS[Math.floor(rnd() * 3)] : null;
        buildings.push({ x, w, h, steps, fin, shade: 18 + Math.floor(rnd() * 10) });
        for (let wy = horizon - h + 10; wy < horizon - 6; wy += 7) {
          for (let wx = x + 5; wx < x + w - 6; wx += 7) {
            if (rnd() < 0.2) windows.push({ x: wx, y: wy, c: COLORS[Math.floor(rnd() * COLORS.length)], on: rnd() < 0.75 });
          }
        }
        x += w + (rnd() < 0.3 ? 4 + rnd() * 18 : 1);
      }
      drawSky();
      frame(performance.now(), true);
    }
    function drawSky() {
      const c = sctx;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      const g = c.createLinearGradient(0, 0, 0, horizon);
      g.addColorStop(0, "rgba(47,23,87,0)");
      g.addColorStop(0.45, "#4a1d6b");
      g.addColorStop(0.8, "#b23a6f");
      g.addColorStop(1, "#ff8a5c");
      c.fillStyle = g; c.fillRect(0, 0, W, horizon);
      // low sun glow (soft, no rays)
      const sx = W * 0.72, sg = c.createRadialGradient(sx, horizon, 4, sx, horizon, Math.max(W, H) * 0.35);
      sg.addColorStop(0, "rgba(255,214,150,0.95)"); sg.addColorStop(0.12, "rgba(255,158,94,0.55)"); sg.addColorStop(1, "rgba(255,92,138,0)");
      c.fillStyle = sg; c.fillRect(0, 0, W, horizon);
      for (const b of buildings) {
        const top = horizon - b.h;
        c.fillStyle = `rgb(${b.shade},${Math.round(b.shade * 0.55)},${b.shade + 22})`;
        // stepped Deco crown
        c.fillRect(b.x, top + b.steps * 6, b.w, b.h - b.steps * 6);
        for (let s = 0; s < b.steps; s++) {
          const inset = (s + 1) * Math.min(6, b.w * 0.12);
          c.fillRect(b.x + inset, top + (b.steps - s - 1) * 6, b.w - inset * 2, 6.5);
        }
        // eyebrow ledges
        c.fillStyle = "rgba(255,226,244,0.07)";
        for (let ly = top + b.steps * 6 + 14; ly < horizon - 8; ly += 22) c.fillRect(b.x, ly, b.w, 1.5);
        if (b.fin) { c.fillStyle = b.fin; c.globalAlpha = 0.9; c.fillRect(b.x + b.w / 2 - 1, top + b.steps * 6 + 4, 2, b.h * 0.55); c.globalAlpha = 1; }
      }
      for (const w of windows) { if (!w.on) continue; c.fillStyle = w.c; c.globalAlpha = 0.85; c.fillRect(w.x, w.y, 2.5, 3); }
      c.globalAlpha = 1;
      // water base
      const wg = c.createLinearGradient(0, horizon, 0, H);
      wg.addColorStop(0, "#2a1450"); wg.addColorStop(1, "#110a24");
      c.fillStyle = wg; c.fillRect(0, horizon, W, H - horizon);
    }
    function frame(t, force) {
      if (!force && t - last < 33) { raf = requestAnimationFrame(frame); return; }
      last = t;
      const time = t / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(sky, 0, 0); // sky + skyline + water base
      // mirrored reflection, wobbling with depth
      const depth = H - horizon;
      for (let y = 0; y < depth; y += 2) {
        const k = y / depth;
        const src = horizon - 1 - y * 1.15;
        if (src < 0) break;
        const amp = 0.6 + k * 7;
        const off = Math.sin(time * 1.6 + y * 0.21) * amp + Math.sin(time * 0.7 + y * 0.05) * amp * 0.6;
        ctx.globalAlpha = 0.62 * (1 - k) + 0.05;
        ctx.drawImage(sky, 0, src * dpr, W * dpr, 2 * dpr, off * dpr, (horizon + y) * dpr, W * dpr, 2 * dpr);
      }
      ctx.globalAlpha = 1;
      // glints
      ctx.fillStyle = "rgba(255,240,214,0.55)";
      for (let i = 0; i < 9; i++) {
        const gy = horizon + 6 + ((i * 37) % Math.max(1, depth - 10));
        const gx = ((i * 131 + time * (14 + i * 3)) % (W + 80)) - 40;
        ctx.fillRect(gx * dpr, gy * dpr, (10 + (i % 4) * 8) * dpr, 1 * dpr);
      }
      // horizon line
      ctx.fillStyle = "rgba(255,190,150,0.7)";
      ctx.fillRect(0, horizon * dpr, W * dpr, 1 * dpr);
      if (running && !force) raf = requestAnimationFrame(frame);
    }
    function start() { if (running || !motionOK() || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    // windows flicker on and off: the city as a board
    setInterval(() => {
      if (!running || !windows.length) return;
      for (let i = 0; i < 3; i++) { const w = windows[Math.floor(Math.random() * windows.length)]; w.on = !w.on; }
      drawSky();
    }, 700);
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(cv);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    reduceMQ.addEventListener?.("change", () => (motionOK() ? start() : (stop(), frame(performance.now(), true))));
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 150); });
    layout();
    start();
  }

  /* ---------------------------------------------------------- live state */
  const state = {
    api: false,
    entries: [], tips: [], update: null, updates: [],
    filters: { mode: "all", status: "all", category: "all" },
  };
  function setLive(ok) {
    const pill = $(".live-pill");
    pill.dataset.live = ok ? "live" : "offline";
    $(".live-text", pill).textContent = ok ? "Board live" : API && launched() ? "Board offline" : launched() ? "Opening soon" : "Live at launch";
    pill.title = ok ? "Connected to the live board" : `Votes and submissions open ${opensWhen()}. Showing the saved copy.`;
  }

  let apiProbe = null; // one shared probe, so a dead API costs one request, not three
  const probeApi = () => (apiProbe ||= API ? getJSON(`${API}/health`, {}, 2500).then(() => true, () => false) : Promise.resolve(false));
  async function loadEntries(kind) {
    try {
      if (!(await probeApi())) throw new Error("api down");
      const r = await getJSON(`${API}/entries?kind=${kind}`);
      state.api = true;
      return { entries: Array.isArray(r.entries) ? r.entries : [], update: r.update || null };
    } catch {
      try {
        const r = await getJSON(kind === "tip" ? "data/tips.json" : "data/entries.json");
        return { entries: Array.isArray(r.entries) ? r.entries : [], update: r.update || null };
      } catch { return { entries: [], update: null }; }
    }
  }
  async function loadUpdates() {
    try { if (!(await probeApi())) throw new Error("api down"); const r = await getJSON(`${API}/updates`); return r.updates || []; }
    catch { try { const r = await getJSON("data/updates.json"); return r.updates || []; } catch { return []; } }
  }

  /* ---------------------------------------------------------- board */
  const STATUS_LABEL = { works: "Works", shaky: "Shaky", patched: "Patched", recheck: "Re-check" };
  const CAT_LABEL = { money: "Money", glitch: "Glitch", vehicles: "Vehicles", weapons: "Weapons", movement: "Movement", missions: "Missions", other: "Other" };
  const PLAT_LABEL = { both: "PS5 + Xbox", ps5: "PS5", xbox: "Xbox" };
  const today = () => new Date().toISOString().slice(0, 10);
  const votedKey = (id) => `sw.vote.${id}.${today()}`;

  function chip(status) {
    return el("span", { class: `chip ${status}` }, el("i", { class: `dot ${status}` }), STATUS_LABEL[status] || status);
  }
  function rowFor(e, i) {
    const voted = store.get(votedKey(e.id), null);
    const src = safeUrl(e.source_url);
    const titleNode = src ? el("a", { href: src, target: "_blank", rel: "noopener noreferrer" }, e.title) : e.title;
    const voteBtn = (kind) => el("button", {
      type: "button", class: `vote vote-${kind}${voted === kind ? " is-voted" : ""}`, "data-vote": kind, "data-id": e.id,
      disabled: voted ? true : null, "aria-label": `${kind === "works" ? "Still works" : "Patched"}: ${e.votes?.[kind] ?? 0} votes on the current update`,
    }, icon(kind === "works" ? "i-check" : "i-x"), kind === "works" ? "Works" : "Patched", el("b", { text: String(e.votes?.[kind] ?? 0) }));
    return el("li", { class: "row", style: `--i:${i}`, "data-id": e.id },
      chip(e.status),
      el("p", { class: "row-checked" }, "Checked on ", el("strong", { text: e.checked_on || "launch build" })),
      el("div", { class: "row-main" },
        el("h3", { class: "row-title" }, titleNode),
        el("p", { class: "row-meta" }, el("span", { class: "tag", text: CAT_LABEL[e.category] || e.category }), PLAT_LABEL[e.platform] || ""),
        e.body ? el("p", { class: "row-body", text: e.body }) : null,
        e.ban_risk ? el("p", { class: "ban-note", text: e.ban_note || "Online exploit: using it can get your account banned or reset." }) : null,
      ),
      el("div", { class: "row-mode" },
        el("span", { class: "tag", text: e.mode === "online" ? "Online" : "Story" }),
        e.ban_risk ? el("span", { class: "ban" }, icon("i-shield"), "Ban risk") : null,
      ),
      el("div", { class: "row-votes" }, voteBtn("works"), voteBtn("patched")),
    );
  }
  function renderBoard() {
    const list = $(".board-rows");
    const { mode, status, category } = state.filters;
    const rows = state.entries.filter((e) =>
      (mode === "all" || e.mode === mode) && (status === "all" || e.status === status) && (category === "all" || e.category === category));
    list.replaceChildren();
    $(".board-nomatch")?.remove();
    if (!state.entries.length) return; // empty state is the HTML default
    if (!rows.length) {
      list.append(el("li", { class: "board-nomatch" }, "Nothing matches these filters.",
        el("button", { type: "button", class: "link-btn", onclick: resetFilters, text: "Reset filters" })));
      return;
    }
    rows.forEach((e, i) => list.append(rowFor(e, i)));
  }
  function resetFilters() {
    state.filters = { mode: "all", status: "all", category: "all" };
    $$("[data-filter]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.value === "all")));
    $("[data-filter-select]").value = "all";
    renderBoard();
  }
  function renderUpdateStrip() {
    const latest = state.updates[0] || state.update;
    lastUpdate = latest || null;
    $(".u-version").textContent = latest ? latest.version : "Launch build";
    $(".u-meta").textContent = latest
      ? `${latest.title || "Game update"} · ${fmtDate(latest.released_on)}`
      : launched() ? "No game update logged since launch" : "No game update logged yet. The first one flips every entry to Re-check.";
    $(".u-count strong").textContent = String(state.updates.length);
    $(".u-count").lastChild.textContent = state.updates.length === 1 ? " update" : " updates";
  }
  function bindBoard() {
    $$("[data-filter]").forEach((b) => b.addEventListener("click", () => {
      const key = b.dataset.filter;
      $$(`[data-filter="${key}"]`).forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      state.filters[key] = b.dataset.value;
      renderBoard();
    }));
    $$(".seg[role=radiogroup]").forEach(radioKeys);
    $("[data-filter-select]").addEventListener("change", (ev) => { state.filters.category = ev.target.value; renderBoard(); });
    $(".board-rows").addEventListener("click", async (ev) => {
      const btn = ev.target.closest("[data-vote]");
      if (!btn) return;
      const id = Number(btn.dataset.id), vote = btn.dataset.vote;
      if (!state.api) { toast(closedVote()); return; }
      btn.setAttribute("aria-busy", "true");
      try {
        const r = await postJSON(`${API}/vote`, { id, vote });
        store.set(votedKey(id), vote);
        const idx = state.entries.findIndex((e) => e.id === id);
        if (idx > -1) {
          const changed = state.entries[idx].status !== r.entry.status;
          state.entries[idx] = r.entry;
          const old = $(`.row[data-id="${id}"]`);
          const fresh = rowFor(r.entry, 0);
          if (changed) fresh.querySelector(".chip").classList.add("is-new");
          old?.replaceWith(fresh);
        }
        toast("Vote counted for the current update.");
      } catch (e) {
        toast(e.status === 409 ? "You already voted on this one today." : e.status === 429 ? "Too many votes. Give it a minute." : "Couldn't reach the board just now, so your vote wasn't counted.");
        if (e.status === 409) store.set(votedKey(id), vote);
      } finally { btn.removeAttribute("aria-busy"); }
    });
  }
  function radioKeys(group) {
    group.addEventListener("keydown", (ev) => {
      if (!["ArrowLeft", "ArrowRight"].includes(ev.key)) return;
      const btns = $$("button", group);
      const i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      const next = btns[(i + (ev.key === "ArrowRight" ? 1 : btns.length - 1)) % btns.length];
      next.focus(); next.click(); ev.preventDefault();
    });
  }

  /* ---------------------------------------------------------- tips */
  function renderTips() {
    const list = $(".tips-list");
    list.replaceChildren(...state.tips.map((t) => el("li", { class: "tip" },
      el("h3", { text: t.title }),
      el("p", { text: t.body }),
      el("p", { class: "row-meta" }, el("span", { class: "tag", text: CAT_LABEL[t.category] || "General" }),
        t.mode === "online" ? el("span", { class: "ban" }, icon("i-shield"), "Online") : null),
    )));
  }

  /* ---------------------------------------------------------- empty-state copy that changes at launch */
  function launchCopy() {
    if (!launched()) return;
    $(".empty-big", $(".board")).textContent = "No verified methods yet";
    $$(".empty-line").forEach((n) => (n.textContent = "Be the first to submit."));
    $(".postcard .empty-big").textContent = "No tips yet";
  }

  /* ---------------------------------------------------------- submit forms */
  function bindForms() {
    $$(".form-wrap").forEach((wrap) => {
      const toggle = $(".form-toggle", wrap), form = $("form", wrap);
      const open = (v) => {
        form.hidden = !v; toggle.setAttribute("aria-expanded", String(v));
        const status = $(".form-status", form);
        if (v && booted && !state.api && !status.textContent) { status.className = "form-status note"; status.textContent = closedSubmit(); }
      };
      toggle.addEventListener("click", () => open(form.hidden));
      wrap._open = () => { open(true); };
      // online -> ban-risk acknowledgement
      $$('input[name="mode"]', form).forEach((r) => r.addEventListener("change", () => {
        const online = form.elements.mode.value === "online";
        $(".ban-ack", form).hidden = !online;
      }));
      form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const status = $(".form-status", form);
        status.className = "form-status";
        $$("[aria-invalid]", form).forEach((n) => n.removeAttribute("aria-invalid"));
        const bad = $$("input[required], textarea[required]", form).find((n) => !n.checkValidity());
        const src = form.elements.source_url;
        if (bad) {
          bad.setAttribute("aria-invalid", "true"); bad.focus();
          status.classList.add("err");
          status.textContent = bad.validity.valueMissing ? `${labelOf(bad)} is required.` : `${labelOf(bad)} needs at least ${bad.minLength} characters.`;
          return;
        }
        if (src && src.value && !/^https:\/\/\S+\.\S+/.test(src.value.trim())) {
          src.setAttribute("aria-invalid", "true"); src.focus();
          status.classList.add("err"); status.textContent = "Proof link must start with https://"; return;
        }
        const online = form.elements.mode && form.elements.mode.value === "online";
        if (online && !form.elements.ack_ban_risk.checked) {
          status.classList.add("err"); status.textContent = "Tick the ban-risk box to send an online entry."; form.elements.ack_ban_risk.focus(); return;
        }
        const data = {
          kind: form.dataset.kind,
          title: form.elements.title.value,
          body: form.elements.body.value,
          category: form.elements.category.value,
          mode: form.elements.mode ? form.elements.mode.value : "story",
          platform: form.elements.platform ? form.elements.platform.value : "both",
          source_url: src ? src.value.trim() : "",
          ack_ban_risk: online ? true : undefined,
          website: form.elements.website.value,
        };
        const btn = $('button[type="submit"]', form);
        btn.setAttribute("aria-busy", "true"); btn.disabled = true;
        if (!(await probeApi())) {
          btn.removeAttribute("aria-busy"); btn.disabled = false;
          status.className = "form-status note"; status.textContent = `${closedSubmit()} Your text is still here.`; return;
        }
        status.textContent = "Sending…";
        try {
          const r = await postJSON(`${API}/submit`, data);
          form.reset(); $(".ban-ack", form).hidden = true;
          status.classList.add("ok");
          status.textContent = r.message || "Thanks. It's in the moderation queue.";
        } catch (e) {
          if (e.api) { status.classList.add("err"); status.textContent = e.message; }
          else { status.classList.add("note"); status.textContent = "Couldn't reach the board just now, so nothing was sent. Your text is still here. Try again in a bit."; }
        } finally { btn.removeAttribute("aria-busy"); btn.disabled = false; }
      });
    });
    $$("[data-open-form]").forEach((a) => a.addEventListener("click", () => {
      const wrap = $(`[data-form-panel="${a.dataset.openForm}"]`);
      wrap && wrap._open && wrap._open();
      setTimeout(() => $("input[name=title]", wrap)?.focus({ preventScroll: true }), 450);
    }));
  }
  const labelOf = (n) => (n.labels && n.labels[0] ? n.labels[0].childNodes[0].textContent.trim() : n.name);

  /* ---------------------------------------------------------- news + ticker */
  const news = { items: [], filter: "all", shown: 12 };
  async function loadNews() {
    try {
      const r = await getJSON("data/news.json");
      news.items = (r.items || []).filter((i) => safeUrl(i.url) || /^http:\/\//.test(i.url));
      const sources = new Set(news.items.map((i) => i.source));
      $(".news-meta").textContent = news.items.length ? `${news.items.length} headlines · ${sources.size} sources · updated ${ago(r.generated_at)}` : "";
    } catch { news.items = []; }
    renderNews();
    renderTicker();
  }
  function renderNews() {
    const list = $(".news-list");
    const items = news.items.filter((i) => news.filter === "all" || i.label === news.filter);
    $(".news-empty").hidden = news.items.length > 0;
    list.replaceChildren(...items.slice(0, news.shown).map((i, n) => el("li", { class: "news-item", style: `--i:${n % 6}` },
      el("p", { class: "news-top" }, el("span", { class: `label ${i.label}`, text: i.label }), el("span", { class: "news-src", text: i.source }), el("time", { datetime: i.date || "", text: ago(i.date) })),
      el("h3", { class: "news-title" }, el("a", { href: i.url, target: "_blank", rel: "noopener noreferrer" }, i.title, icon("i-out"))),
      i.summary ? el("p", { class: "news-sum", text: i.summary }) : null,
    )));
    if (news.items.length && !items.length) list.append(el("li", { class: "board-nomatch", text: `No ${news.filter} headlines right now.` }));
    $(".news-more").hidden = items.length <= news.shown;
    observeReveal($$(".news-item", list), list);
  }
  function renderTicker() {
    const track = $(".ticker-track");
    const head = el("p", { class: "ticker-item" }, el("span", { class: "tk-tag tk-recheck", text: "Patch watch" }),
      lastUpdate ? `Latest game update: ${lastUpdate.version}` : "No game update logged yet");
    const items = news.items.slice(0, 10).map((i) => el("p", { class: "ticker-item" },
      el("span", { class: `tk-tag tk-${i.label}`, text: i.label }),
      el("a", { href: i.url, target: "_blank", rel: "noopener noreferrer", text: i.title }),
      el("span", { text: `· ${i.source}` })));
    const set = [head, ...items];
    track.replaceChildren(...set);
    if (items.length && motionOK()) {
      set.forEach((n) => { const c = n.cloneNode(true); c.setAttribute("aria-hidden", "true"); $$("a", c).forEach((a) => a.setAttribute("tabindex", "-1")); track.append(c); });
      track.style.setProperty("--tick-dur", `${Math.max(40, items.length * 9)}s`);
      track.classList.add("is-running");
    } else {
      track.parentElement.style.overflowX = "auto";
    }
  }
  function bindNews() {
    $$("[data-news]").forEach((b) => b.addEventListener("click", () => {
      $$("[data-news]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      news.filter = b.dataset.news; news.shown = 12; renderNews();
    }));
    $(".news-more").addEventListener("click", () => { news.shown += 12; renderNews(); });
  }

  /* ---------------------------------------------------------- checklists (localStorage) */
  const LKEY = "sw.lists.v1";
  const lists = { current: "collectibles", official: {}, mine: store.get(LKEY, { collectibles: [], missions: [], trophies: [] }) };
  const LIST_NOTE = {
    collectibles: "No verified collectible list yet.",
    missions: "No verified mission list yet.",
    trophies: "No verified trophy list yet.",
  };
  async function loadLists() {
    try { lists.official = (await getJSON("data/checklists.json")).lists || {}; } catch { lists.official = {}; }
    renderList();
  }
  function saveMine() { if (!store.set(LKEY, lists.mine)) toast("This browser blocked local storage, so ticks won't be saved."); }
  function renderList() {
    const key = lists.current;
    const off = lists.official[key] || { items: [] };
    const doneOff = store.get(`sw.official.${key}`, {});
    const mine = lists.mine[key] || (lists.mine[key] = []);
    const offItems = (off.items || []).map((it) => ({ ...it, id: "o:" + it.id, done: !!doneOff[it.id], official: true }));
    const all = [...offItems, ...mine];
    const done = all.filter((i) => i.done).length;
    $(".lp-done").textContent = String(done);
    $(".lp-total").textContent = String(all.length);
    $(".lp-fill").style.setProperty("--p", all.length ? (done / all.length).toFixed(3) : "0");
    const note = $(".list-official");
    if (offItems.length) {
      note.replaceChildren(`Official ${key} list: ${offItems.length} items. Source: `, el("a", { href: safeUrl(off.source) || "#", target: "_blank", rel: "noopener noreferrer", text: off.source_name || "source" }));
    } else {
      note.replaceChildren(el("strong", { text: LIST_NOTE[key] }), launched()
        ? " We add one only once it's checked against a source we can link. Build your own below for now."
        : " The game launches 19 Nov. We add the real list once it's checked against a source we can link. Build your own below for now.");
    }
    $(".check-list").replaceChildren(...all.map((it) => {
      const id = "ci-" + String(it.id).replace(/[^a-z0-9_-]/gi, "");
      return el("li", { class: "check-item" },
        el("label", { for: id },
          el("input", { type: "checkbox", id, checked: it.done ? true : null, "data-item": it.id }),
          el("span", { class: "box" }, (() => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", "M5 12.5l4.5 4.5L19 7.5"); s.append(p); return s; })()),
          el("span", { class: "check-text", text: it.text })),
        it.official ? null : el("button", { type: "button", class: "del", "data-del": it.id, "aria-label": `Remove ${it.text}` }, icon("i-trash")));
    }));
  }
  function bindLists() {
    const tabs = $$('[role="tab"]');
    const select = (t, focus) => {
      tabs.forEach((x) => { const on = x === t; x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1; });
      $("#panel-list").setAttribute("aria-labelledby", t.id);
      lists.current = t.dataset.list; renderList();
      if (focus) t.focus();
    };
    tabs.forEach((t) => t.addEventListener("click", () => select(t)));
    $(".tabs").addEventListener("keydown", (ev) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      if (ev.key === "ArrowRight") { select(tabs[(i + 1) % tabs.length], true); ev.preventDefault(); }
      if (ev.key === "ArrowLeft") { select(tabs[(i + tabs.length - 1) % tabs.length], true); ev.preventDefault(); }
    });
    $(".check-list").addEventListener("change", (ev) => {
      const id = ev.target.dataset.item;
      if (!id) return;
      if (id.startsWith("o:")) {
        const k = `sw.official.${lists.current}`; const d = store.get(k, {}); d[id.slice(2)] = ev.target.checked; store.set(k, d);
      } else {
        const it = lists.mine[lists.current].find((x) => x.id === id); if (it) it.done = ev.target.checked; saveMine();
      }
      const all = $$(".check-list input");
      const done = all.filter((x) => x.checked).length;
      $(".lp-done").textContent = String(done);
      $(".lp-fill").style.setProperty("--p", all.length ? (done / all.length).toFixed(3) : "0");
    });
    $(".check-list").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-del]");
      if (!b) return;
      lists.mine[lists.current] = lists.mine[lists.current].filter((x) => x.id !== b.dataset.del);
      saveMine(); renderList();
    });
    $(".add-item").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const input = $("#add-item-input");
      const text = input.value.trim().slice(0, 80);
      if (!text) { input.focus(); return; }
      lists.mine[lists.current].push({ id: "m" + Date.now().toString(36), text, done: false });
      saveMine(); input.value = ""; renderList(); input.focus();
    });
    $("[data-clear-done]").addEventListener("click", () => {
      lists.mine[lists.current] = lists.mine[lists.current].filter((x) => !x.done);
      store.set(`sw.official.${lists.current}`, {});
      saveMine(); renderList();
    });
  }

  /* ---------------------------------------------------------- media wall (click-to-load, youtube-nocookie) */
  const SKIES = ["#b23a6f", "#ff8a5c", "#6d4bd1", "#d9466f", "#3f7fd1", "#c2477c"];
  async function loadMedia() {
    let items = [];
    try { items = (await getJSON("data/media.json")).items || []; } catch { items = []; }
    const grid = $(".media-grid");
    grid.replaceChildren(...items.map((m, i) => {
      const card = el("li", { class: "media-card", style: `--i:${i % 6}` });
      const btn = el("button", { type: "button", class: "poster", style: `--p-sky:${SKIES[i % SKIES.length]}`, "aria-label": `Play ${m.title} (loads from ${m.type === "x" ? "X" : "YouTube"})` },
        el("span", { class: "poster-kind", text: m.kind || (m.type === "x" ? "Post" : "Video") }),
        el("span", { class: "poster-title", text: m.short || m.title }),
        el("span", { class: "poster-foot" }, el("span", { text: `${m.by || ""}${m.date ? " · " + fmtDate(m.date) : ""}` }), el("span", { class: "play" }, icon("i-play"))));
      btn.addEventListener("click", () => playMedia(card, m));
      card.append(btn);
      return card;
    }));
    observeReveal($$(".media-card", grid), grid);
  }
  function playMedia(card, m) {
    if (m.type === "youtube" && /^[A-Za-z0-9_-]{11}$/.test(m.id)) {
      const f = el("iframe", {
        src: `https://www.youtube-nocookie.com/embed/${m.id}?autoplay=1&rel=0&modestbranding=1`,
        title: m.title, allow: "autoplay; encrypted-media; picture-in-picture; fullscreen", allowfullscreen: true,
        referrerpolicy: "strict-origin-when-cross-origin", loading: "lazy",
      });
      card.replaceChildren(f);
    } else if (m.type === "x" && safeUrl(m.url)) {
      const wrap = el("div", { class: "x-wrap" }, el("blockquote", { class: "twitter-tweet", "data-theme": "dark", "data-dnt": "true" }, el("a", { href: m.url, text: m.title })));
      card.replaceChildren(wrap);
      if (!window.twttr) document.head.append(el("script", { src: "https://platform.twitter.com/widgets.js", async: true, charset: "utf-8" }));
      else window.twttr.widgets?.load(wrap);
    }
  }

  /* ---------------------------------------------------------- reveal on scroll + section nav */
  // IntersectionObserver honours clip-path, so a clipped-away item never "intersects".
  // Items hidden with clip-path are revealed through their (unclipped) container instead.
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      const t = e.target;
      t._revealed = true;
      (t._kids || [t]).forEach((k) => k.classList.add("is-in"));
      t._kids = null;
      io.unobserve(t);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 }) : null;
  function observeReveal(nodes, container) {
    nodes.forEach((n) => {
      if (!io || !motionOK()) { n.classList.add("is-in"); return; }
      n.classList.add("will-reveal");
    });
    if (!io || !motionOK()) return;
    if (container) {
      if (container._revealed) { requestAnimationFrame(() => nodes.forEach((n) => n.classList.add("is-in"))); return; }
      container._kids = nodes;
      io.observe(container);
    } else nodes.forEach((n) => io.observe(n));
  }
  function bindNav() {
    observeReveal([...$$(".deco-rule"), ...$$("[data-reveal]")]);
    const links = [...$$(".top-nav a"), ...$$(".tabbar a")];
    const spy = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = e.target.id;
        links.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + id)));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => spy.observe(s));
  }

  /* ---------------------------------------------------------- install (PWA) */
  function bindInstall() {
    let deferred = null;
    const btn = $(".btn-install");
    window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; btn.hidden = false; });
    btn.addEventListener("click", async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice.catch(() => null); deferred = null; btn.hidden = true; });
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
    }
  }

  /* ---------------------------------------------------------- boot */
  let booted = false; // the board check has finished (forms only show the "opens on launch day" note after it)
  async function boot() {
    applyBrand();
    tick();
    setHeat();
    dusk();
    bindBoard();
    bindForms();
    bindNews();
    bindLists();
    bindNav();
    bindInstall();
    launchCopy();
    loadNews();
    loadLists();
    loadMedia();
    const [m, t, u] = await Promise.all([loadEntries("method"), loadEntries("tip"), loadUpdates()]);
    state.entries = m.entries; state.update = m.update; state.tips = t.entries; state.updates = u;
    if (!state.updates.length && state.update) state.updates = [state.update];
    setLive(state.api);
    booted = true;
    renderUpdateStrip();
    renderBoard();
    renderTips();
    setHeat();
    if (news.items.length) renderTicker();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
