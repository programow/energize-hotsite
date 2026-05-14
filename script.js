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
