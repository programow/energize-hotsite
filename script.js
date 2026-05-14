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

// Electric background — gold lines in faux-3D with traveling pulses
(() => {
  const canvas = document.querySelector(".bolt-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const GOLD = "203, 169, 104";
  const GOLD_HOT = "255, 220, 160";
  const NUM_LINES = 24;
  const RADIANT_RATIO = 0.4;

  let W = 0,
    H = 0,
    dpr = 1;
  let lines = [];

  const rand = (a, b) => a + Math.random() * (b - a);

  function buildLines() {
    lines = [];
    const vpX = W * rand(0.3, 0.7);
    const vpY = H * rand(0.25, 0.6);
    for (let i = 0; i < NUM_LINES; i++) {
      const depth = Math.pow(Math.random(), 1.6);
      const radiant = i < NUM_LINES * RADIANT_RATIO;
      let x1, y1, x2, y2;
      if (radiant) {
        const angle = Math.random() * Math.PI * 2;
        const inner = rand(40, 120);
        const outer = Math.max(W, H) * rand(0.9, 1.6);
        x1 = vpX + Math.cos(angle) * inner;
        y1 = vpY + Math.sin(angle) * inner;
        x2 = vpX + Math.cos(angle) * outer;
        y2 = vpY + Math.sin(angle) * outer;
      } else {
        const cx = rand(0, W);
        const cy = rand(0, H);
        const angle = Math.random() * Math.PI * 2;
        const len = Math.max(W, H) * rand(0.5, 1.2);
        x1 = cx - (Math.cos(angle) * len) / 2;
        y1 = cy - (Math.sin(angle) * len) / 2;
        x2 = cx + (Math.cos(angle) * len) / 2;
        y2 = cy + (Math.sin(angle) * len) / 2;
      }
      lines.push({
        x1,
        y1,
        x2,
        y2,
        depth,
        width: 0.35 + depth * 1.4,
        baseAlpha: 0.05 + depth * 0.14,
        t: rand(-0.6, -0.05),
        speed: rand(0.00015, 0.00055),
        delay: 0,
        reverse: Math.random() < 0.5,
      });
    }
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
    buildLines();
  }

  function step(line, dt) {
    if (line.t > 1.1) {
      line.delay -= dt;
      if (line.delay <= 0) {
        line.t = -0.05;
        line.speed = rand(0.00015, 0.00055);
        line.reverse = Math.random() < 0.5;
        line.delay = rand(600, 2400);
      }
    } else {
      line.t += line.speed * dt;
    }
  }

  function addStop(grad, prevRef, offset, color) {
    const o = Math.max(0, Math.min(1, offset));
    if (o > prevRef.value + 0.0001) {
      grad.addColorStop(o, color);
      prevRef.value = o;
    }
  }

  function drawLine(line) {
    let { x1, y1, x2, y2 } = line;
    if (line.reverse) {
      [x1, x2] = [x2, x1];
      [y1, y2] = [y2, y1];
    }
    const t = line.t;
    const base = line.baseAlpha;
    const dim = base * 0.3;
    const trail = Math.min(0.9, base * 3.5);
    const head = Math.min(0.95, base * 7);
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    const c = (a, hot = false) =>
      `rgba(${hot ? GOLD_HOT : GOLD}, ${a.toFixed(3)})`;
    const prev = { value: -1 };

    if (t < 0 || t > 1) {
      addStop(grad, prev, 0, c(base));
      addStop(grad, prev, 1, c(base));
    } else {
      addStop(grad, prev, 0, c(base));
      addStop(grad, prev, t - 0.18, c(base));
      addStop(grad, prev, t - 0.05, c(trail));
      addStop(grad, prev, t - 0.005, c(head, true));
      addStop(grad, prev, t + 0.008, c(dim));
      addStop(grad, prev, 1, c(dim));
    }

    ctx.strokeStyle = grad;
    ctx.lineWidth = line.width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (t >= 0 && t <= 1) {
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      const r = 4 + line.depth * 12;
      const glow = ctx.createRadialGradient(px, py, 0, px, py, r);
      glow.addColorStop(0, `rgba(${GOLD_HOT}, ${0.35 + line.depth * 0.35})`);
      glow.addColorStop(0.45, `rgba(${GOLD}, ${0.12 + line.depth * 0.15})`);
      glow.addColorStop(1, `rgba(${GOLD}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last);
    last = now;
    ctx.clearRect(0, 0, W, H);
    for (const line of lines) {
      step(line, dt);
      drawLine(line);
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();

  if (reduceMotion) {
    ctx.clearRect(0, 0, W, H);
    for (const line of lines) {
      line.t = -1;
      drawLine(line);
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
