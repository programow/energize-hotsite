// Mobile nav toggle
const toggle = document.querySelector(".nav-toggle");
const menu = document.getElementById("primary-menu");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  menu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}

// Projects carousel
const carousel = document.querySelector("[data-carousel]");
if (carousel) {
  const track = carousel.querySelector(".carousel-track");
  const cards = Array.from(track.children);
  const buttons = document.querySelectorAll(".carousel-btn");
  let index = 0;

  const visibleCount = () => {
    const w = window.innerWidth;
    if (w <= 640) return 1;
    if (w <= 1024) return 2;
    return 4;
  };

  const maxIndex = () => Math.max(0, cards.length - visibleCount());

  const update = () => {
    if (!cards[0]) return;
    const card = cards[0];
    const gap = parseFloat(getComputedStyle(track).columnGap || "0");
    const step = card.getBoundingClientRect().width + gap;
    track.style.transform = `translateX(${-step * index}px)`;
  };

  buttons.forEach((btn) =>
    btn.addEventListener("click", () => {
      const dir = Number(btn.dataset.dir);
      index = Math.min(maxIndex(), Math.max(0, index + dir));
      update();
    })
  );

  window.addEventListener("resize", () => {
    index = Math.min(index, maxIndex());
    update();
  });

  update();
}

// Electric background — orthogonal "wires" with pulses traveling along them
(() => {
  const canvas = document.querySelector(".bolt-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const GOLD = "203, 169, 104";
  const GOLD_HOT = "255, 220, 160";
  const NUM_WIRES = 16;

  let W = 0,
    H = 0,
    dpr = 1;
  let wires = [];

  const rand = (a, b) => a + Math.random() * (b - a);
  const c = (a, hot = false) =>
    `rgba(${hot ? GOLD_HOT : GOLD}, ${Math.max(0, Math.min(1, a)).toFixed(3)})`;

  function buildWire() {
    const edge = Math.floor(Math.random() * 4);
    let x, y, dx, dy;
    const margin = 40;
    if (edge === 0) {
      x = rand(0.05, 0.95) * W;
      y = -margin;
      dx = 0;
      dy = 1;
    } else if (edge === 1) {
      x = W + margin;
      y = rand(0.05, 0.95) * H;
      dx = -1;
      dy = 0;
    } else if (edge === 2) {
      x = rand(0.05, 0.95) * W;
      y = H + margin;
      dx = 0;
      dy = -1;
    } else {
      x = -margin;
      y = rand(0.05, 0.95) * H;
      dx = 1;
      dy = 0;
    }

    const points = [{ x, y }];
    const turns = 2 + Math.floor(Math.random() * 2); // 2 or 3 turns
    const minRun = 70;
    const maxRun = Math.max(W, H) * 0.45;
    let lastTurnLeft = null;

    for (let i = 0; i < turns; i++) {
      const len = rand(minRun, maxRun);
      x += dx * len;
      y += dy * len;
      points.push({ x, y });
      // Pick a turn direction; avoid 180° (bias against repeating same direction
      // when it would point the wire back off-screen)
      const turnLeft = lastTurnLeft == null
        ? Math.random() < 0.5
        : Math.random() < 0.5; // free choice — both turns are 90°
      lastTurnLeft = turnLeft;
      if (dx !== 0) {
        dy = dx * (turnLeft ? -1 : 1);
        dx = 0;
      } else {
        dx = dy * (turnLeft ? 1 : -1);
        dy = 0;
      }
    }

    // Final run to exit the viewport on the opposite-ish side
    const finalLen = rand(maxRun * 0.6, maxRun * 1.4);
    x += dx * finalLen;
    y += dy * finalLen;
    points.push({ x, y });

    // Build segments with cumulative arc length
    const segments = [];
    let s = 0;
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (segLen < 1) continue;
      segments.push({
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        s0: s,
        s1: s + segLen,
        len: segLen,
      });
      s += segLen;
    }

    const depth = Math.pow(Math.random(), 1.5);
    const totalLen = s;
    const trailLen = rand(120, 260); // pulse trail length in px
    return {
      segments,
      points,
      totalLen,
      trailLen,
      depth,
      width: 0.5 + depth * 1.6,
      baseAlpha: 0.06 + depth * 0.16,
      pulsePos: rand(-totalLen * 0.4, -50),
      speed: rand(0.18, 0.42), // px per ms
      delay: 0,
    };
  }

  function buildAll() {
    wires = [];
    for (let i = 0; i < NUM_WIRES; i++) wires.push(buildWire());
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildAll();
  }

  function step(wire, dt) {
    if (wire.pulsePos > wire.totalLen + wire.trailLen) {
      wire.delay -= dt;
      if (wire.delay <= 0) {
        wire.pulsePos = -wire.trailLen * rand(0.2, 1.2);
        wire.speed = rand(0.18, 0.42);
        wire.delay = rand(500, 2200);
      }
    } else {
      wire.pulsePos += wire.speed * dt;
    }
  }

  function drawSegmentGradient(seg, wire) {
    const { x1, y1, x2, y2, s0, s1, len } = seg;
    const p = wire.pulsePos;
    const trail = wire.trailLen;
    const base = wire.baseAlpha;
    const dim = base * 0.3;
    const trailBright = Math.min(0.85, base * 3.2);
    const head = Math.min(0.95, base * 6.5);

    // Cases by where pulse head is relative to this segment
    if (p < s0) {
      // Pulse hasn't reached this segment → all dim ahead
      ctx.strokeStyle = c(dim);
    } else if (p > s1 + trail) {
      // Pulse and trail have fully passed → back to base
      ctx.strokeStyle = c(base);
    } else {
      // Need a gradient along this segment
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      // Helper to convert a global arc-length position to local 0..1 within
      // this segment, clamped.
      const toLocal = (sg) => Math.max(0, Math.min(1, (sg - s0) / len));

      if (p <= s1) {
        // Pulse head is somewhere in this segment
        const t = toLocal(p);
        const tTrailEnd = toLocal(p - trail); // older end of trail
        // Build stops in order
        const stops = [];
        if (tTrailEnd > 0) {
          stops.push([0, base]);
          stops.push([tTrailEnd, base]);
        } else {
          // Trail starts before this segment — fade in from a partial value
          // Compute trail brightness at start of segment (s0)
          const distBack = p - s0; // 0..trail
          const k = 1 - distBack / trail; // 1 = at head end, 0 = at trail end
          const alphaAtStart = base + (trailBright - base) * Math.max(0, 1 - k);
          stops.push([0, alphaAtStart]);
        }
        // Approach to head
        const tNearHead = Math.max(0, t - 30 / len);
        stops.push([tNearHead, trailBright]);
        stops.push([t, head]);
        // Just past head
        const tDimStart = Math.min(1, t + 6 / len);
        stops.push([tDimStart, dim]);
        stops.push([1, dim]);

        // Apply ordered stops, dedupe close values
        let lastO = -1;
        for (const [o, a] of stops) {
          if (o > lastO + 0.0005) {
            grad.addColorStop(o, c(a, a === head));
            lastO = o;
          }
        }
        ctx.strokeStyle = grad;
      } else {
        // Pulse head has exited; trail still reaches into segment
        // Trail end (older) global pos: p - trail
        // Segment range covered by trail: max(s0, p-trail) .. s1
        const tTrailEnd = toLocal(p - trail);
        // Brightness at the far end of segment (s1) = how close it was to head
        // when head passed: distance behind head = p - s1
        const distAtEnd = p - s1; // > 0
        const kEnd = 1 - distAtEnd / trail; // 1 = head just left, 0 = trail end
        const alphaAtEnd = base + (trailBright - base) * Math.max(0, kEnd);
        if (tTrailEnd > 0) {
          grad.addColorStop(0, c(base));
          grad.addColorStop(tTrailEnd, c(base));
          grad.addColorStop(1, c(alphaAtEnd));
        } else {
          // Trail spans entire segment
          const distAtStart = p - s0;
          const kStart = 1 - distAtStart / trail;
          const alphaAtStart = base + (trailBright - base) * Math.max(0, kStart);
          grad.addColorStop(0, c(alphaAtStart));
          grad.addColorStop(1, c(alphaAtEnd));
        }
        ctx.strokeStyle = grad;
      }
    }

    ctx.lineWidth = wire.width;
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function drawHeadGlow(wire) {
    const p = wire.pulsePos;
    if (p < 0 || p > wire.totalLen) return;
    // Find segment containing p
    for (const seg of wire.segments) {
      if (p >= seg.s0 && p <= seg.s1) {
        const f = (p - seg.s0) / seg.len;
        const px = seg.x1 + (seg.x2 - seg.x1) * f;
        const py = seg.y1 + (seg.y2 - seg.y1) * f;
        const r = 5 + wire.depth * 14;
        const glow = ctx.createRadialGradient(px, py, 0, px, py, r);
        glow.addColorStop(
          0,
          `rgba(${GOLD_HOT}, ${(0.4 + wire.depth * 0.35).toFixed(3)})`
        );
        glow.addColorStop(
          0.45,
          `rgba(${GOLD}, ${(0.14 + wire.depth * 0.15).toFixed(3)})`
        );
        glow.addColorStop(1, `rgba(${GOLD}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
    }
  }

  function drawWire(wire) {
    for (const seg of wire.segments) drawSegmentGradient(seg, wire);
    drawHeadGlow(wire);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last);
    last = now;
    ctx.clearRect(0, 0, W, H);
    for (const wire of wires) {
      step(wire, dt);
      drawWire(wire);
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();

  if (reduceMotion) {
    ctx.clearRect(0, 0, W, H);
    for (const wire of wires) {
      wire.pulsePos = -wire.trailLen * 10; // park pulses far behind, lines at base
      drawWire(wire);
    }
  } else {
    requestAnimationFrame(frame);
  }
})();

// Subtle header shadow on scroll
const header = document.querySelector(".site-header");
if (header) {
  const onScroll = () => {
    header.style.boxShadow =
      window.scrollY > 8 ? "0 12px 30px -20px rgba(0,0,0,0.8)" : "none";
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
