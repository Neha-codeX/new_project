/* =========================================
   PLANET PULSE — MAIN APPLICATION SCRIPT
   ========================================= */

'use strict';

// ─── THEME ───
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');
let isDark = true;

themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  themeIcon.textContent = isDark ? '☀️' : '🌙';
});

// ─── NAV SCROLL ───
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 20);
});

// ─── INTERSECTION OBSERVER (REVEAL) ───
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal-item').forEach(el => revealObserver.observe(el));

// ─── COUNTER ANIMATION ───
function animateCounter(el, target, duration = 2000) {
  const isDecimal = target % 1 !== 0;
  const isLarge = target > 10000;
  let start = null;
  const step = (ts) => {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = target * ease;
    if (isLarge) {
      el.textContent = formatLargeNum(Math.floor(current));
    } else if (isDecimal) {
      el.textContent = current.toFixed(1);
    } else {
      el.textContent = Math.floor(current).toLocaleString();
    }
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = isLarge ? formatLargeNum(target) : isDecimal ? target.toFixed(1) : target.toLocaleString();
  };
  requestAnimationFrame(step);
}

function formatLargeNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return Math.floor(n / 1e3) + 'K';
  return n;
}

const metricObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const card = e.target;
      const val = card.querySelector('.metric-value');
      const target = parseFloat(card.dataset.target);
      if (val && !card.dataset.counted) {
        card.dataset.counted = 'true';
        animateCounter(val, target);
      }
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.metric-card').forEach(el => metricObserver.observe(el));

// Hero stats counter
const heroStatObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const el = e.target;
      const target = parseFloat(el.dataset.target);
      if (!el.dataset.counted) {
        el.dataset.counted = 'true';
        animateCounter(el, target, 1500);
      }
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.hero-stat-value').forEach(el => heroStatObserver.observe(el));

// ─── HERO CANVAS ───
const heroCanvas = document.getElementById('heroCanvas');
const hCtx = heroCanvas.getContext('2d');
let hW, hH, hParticles = [], animId;

function initHero() {
  hW = heroCanvas.width = window.innerWidth;
  hH = heroCanvas.height = window.innerHeight;
  hParticles = Array.from({ length: 180 }, () => ({
    x: Math.random() * hW,
    y: Math.random() * hH,
    r: Math.random() * 1.8 + 0.3,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3 - 0.1,
    alpha: Math.random() * 0.6 + 0.1,
    hue: Math.random() < 0.6 ? 160 : Math.random() < 0.5 ? 210 : 0,
    pulse: Math.random() * Math.PI * 2,
  }));
}

function drawHero(ts) {
  hCtx.clearRect(0, 0, hW, hH);

  // Earth glow
  const gr = hCtx.createRadialGradient(hW / 2, hH * 0.38, 0, hW / 2, hH * 0.38, hW * 0.35);
  gr.addColorStop(0, 'rgba(0,212,170,0.04)');
  gr.addColorStop(0.4, 'rgba(0,100,200,0.03)');
  gr.addColorStop(1, 'transparent');
  hCtx.fillStyle = gr;
  hCtx.fillRect(0, 0, hW, hH);

  // Particles
  hParticles.forEach(p => {
    p.pulse += 0.015;
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = hW;
    if (p.x > hW) p.x = 0;
    if (p.y < 0) p.y = hH;
    if (p.y > hH) p.y = 0;
    const alpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
    hCtx.beginPath();
    hCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    hCtx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${alpha})`;
    hCtx.fill();
  });

  // Connect nearby particles
  for (let i = 0; i < hParticles.length; i++) {
    for (let j = i + 1; j < hParticles.length; j++) {
      const dx = hParticles[i].x - hParticles[j].x;
      const dy = hParticles[i].y - hParticles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 90) {
        hCtx.beginPath();
        hCtx.moveTo(hParticles[i].x, hParticles[i].y);
        hCtx.lineTo(hParticles[j].x, hParticles[j].y);
        hCtx.strokeStyle = `rgba(0,212,170,${0.04 * (1 - dist / 90)})`;
        hCtx.lineWidth = 0.5;
        hCtx.stroke();
      }
    }
  }

  animId = requestAnimationFrame(drawHero);
}

initHero();
drawHero();
window.addEventListener('resize', initHero);

// ─── PLANET CANVAS (DASHBOARD) ───
const planetCanvas = document.getElementById('planetCanvas');
const pCtx = planetCanvas.getContext('2d');
let planetAngle = 0;

function drawPlanet() {
  const cx = 140, cy = 140, r = 120;
  pCtx.clearRect(0, 0, 280, 280);

  // Planet body
  const grad = pCtx.createRadialGradient(cx - 30, cy - 30, 0, cx, cy, r);
  grad.addColorStop(0, '#1a3a5c');
  grad.addColorStop(0.4, '#0f2240');
  grad.addColorStop(0.7, '#071628');
  grad.addColorStop(1, '#030c18');
  pCtx.beginPath();
  pCtx.arc(cx, cy, r, 0, Math.PI * 2);
  pCtx.fillStyle = grad;
  pCtx.fill();

  // Continent shapes
  pCtx.save();
  pCtx.clip();
  pCtx.translate(cx, cy);
  pCtx.rotate(planetAngle);
  pCtx.fillStyle = 'rgba(15,180,100,0.25)';
  // Landmass 1
  pCtx.beginPath();
  pCtx.ellipse(-20, -30, 45, 60, 0.3, 0, Math.PI * 2);
  pCtx.fill();
  // Landmass 2
  pCtx.beginPath();
  pCtx.ellipse(55, 10, 30, 50, -0.5, 0, Math.PI * 2);
  pCtx.fill();
  // Landmass 3
  pCtx.beginPath();
  pCtx.ellipse(-60, 40, 40, 25, 0.7, 0, Math.PI * 2);
  pCtx.fill();
  // Pollution overlay
  pCtx.fillStyle = 'rgba(180,60,30,0.18)';
  pCtx.beginPath();
  pCtx.ellipse(10, 20, 80, 70, 0.2, 0, Math.PI * 2);
  pCtx.fill();
  pCtx.restore();

  // Atmosphere glow
  const atm = pCtx.createRadialGradient(cx, cy, r - 5, cx, cy, r + 18);
  atm.addColorStop(0, 'rgba(100,180,255,0.12)');
  atm.addColorStop(0.5, 'rgba(60,120,255,0.06)');
  atm.addColorStop(1, 'transparent');
  pCtx.beginPath();
  pCtx.arc(cx, cy, r + 18, 0, Math.PI * 2);
  pCtx.fillStyle = atm;
  pCtx.fill();

  // Specular highlight
  const spec = pCtx.createRadialGradient(cx - 40, cy - 40, 0, cx, cy, r);
  spec.addColorStop(0, 'rgba(255,255,255,0.1)');
  spec.addColorStop(0.3, 'transparent');
  pCtx.beginPath();
  pCtx.arc(cx, cy, r, 0, Math.PI * 2);
  pCtx.fillStyle = spec;
  pCtx.fill();

  planetAngle += 0.002;
  requestAnimationFrame(drawPlanet);
}
drawPlanet();

// ─── COMPARISON CANVAS ───
const compCanvas = document.getElementById('compCanvas');
const cCtx = compCanvas.getContext('2d');
const compSlider = document.getElementById('compSlider');
const compDivider = document.getElementById('compDivider');
let currentComp = 'sky';
let splitPct = 0.5;

const COMPARISONS = {
  sky: {
    clean: (ctx, w, h) => {
      // Blue sky gradient
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#1a6bcc');
      gr.addColorStop(0.5, '#3fa0f0');
      gr.addColorStop(1, '#7ed3ff');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
      // Clouds
      drawCloud(ctx, w * 0.2, h * 0.2, 60, 'rgba(255,255,255,0.85)');
      drawCloud(ctx, w * 0.55, h * 0.15, 80, 'rgba(255,255,255,0.8)');
      drawCloud(ctx, w * 0.8, h * 0.3, 50, 'rgba(255,255,255,0.75)');
      // Sun
      ctx.beginPath();
      ctx.arc(w * 0.15, h * 0.18, 32, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe066';
      ctx.fill();
      const sg = ctx.createRadialGradient(w * 0.15, h * 0.18, 0, w * 0.15, h * 0.18, 70);
      sg.addColorStop(0, 'rgba(255,230,80,0.3)');
      sg.addColorStop(1, 'transparent');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(w * 0.15, h * 0.18, 70, 0, Math.PI * 2);
      ctx.fill();
      // Trees
      drawTree(ctx, w * 0.05, h * 0.85, 18, '#2d7a3a');
      drawTree(ctx, w * 0.12, h * 0.82, 22, '#33923f');
      drawTree(ctx, w * 0.22, h * 0.87, 16, '#256b30');
      // Ground
      const gr2 = ctx.createLinearGradient(0, h * 0.85, 0, h);
      gr2.addColorStop(0, '#4a9e5c');
      gr2.addColorStop(1, '#2d6b38');
      ctx.fillStyle = gr2;
      ctx.fillRect(0, h * 0.85, w, h * 0.15);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Clean Air · AQI 12', w / 2, h - 12);
    },
    polluted: (ctx, w, h) => {
      // Smoggy sky
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#4a3d2a');
      gr.addColorStop(0.4, '#7a6a48');
      gr.addColorStop(0.8, '#a88c6a');
      gr.addColorStop(1, '#c4a87a');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
      // Smog layers
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.ellipse(w * (0.1 + i * 0.18), h * (0.25 + i * 0.06), 80 + i * 20, 25, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100,80,40,${0.3 - i * 0.03})`;
        ctx.fill();
      }
      // Factory chimneys
      drawFactory(ctx, w * 0.35, h * 0.65, '#555');
      drawFactory(ctx, w * 0.6, h * 0.55, '#444');
      drawFactory(ctx, w * 0.78, h * 0.68, '#666');
      // Smoke
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.arc(w * (0.35 + (i % 3) * 0.22) + (i % 4) * 10, h * (0.4 - i * 0.04), 18 + i * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80,70,60,${0.2 - i * 0.012})`;
        ctx.fill();
      }
      // Dead ground
      const gr2 = ctx.createLinearGradient(0, h * 0.75, 0, h);
      gr2.addColorStop(0, '#5c4a2a');
      gr2.addColorStop(1, '#3a2e1a');
      ctx.fillStyle = gr2;
      ctx.fillRect(0, h * 0.75, w, h * 0.25);
      ctx.fillStyle = 'rgba(255,80,60,0.9)';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Severe Pollution · AQI 287', w / 2, h - 12);
    }
  },
  river: {
    clean: (ctx, w, h) => {
      // Banks
      ctx.fillStyle = '#3a7d44';
      ctx.fillRect(0, 0, w, h * 0.25);
      ctx.fillRect(0, h * 0.75, w, h * 0.25);
      // Water
      const gr = ctx.createLinearGradient(0, h * 0.25, 0, h * 0.75);
      gr.addColorStop(0, '#1a7ab8');
      gr.addColorStop(0.5, '#2496d8');
      gr.addColorStop(1, '#1a7ab8');
      ctx.fillStyle = gr;
      ctx.fillRect(0, h * 0.25, w, h * 0.5);
      // Ripples
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.ellipse(w * (0.1 + i * 0.16), h * 0.5, 30, 8, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // Fish
      drawFish(ctx, w * 0.3, h * 0.45, '#f0c040');
      drawFish(ctx, w * 0.65, h * 0.58, '#f0c040');
      // Plants
      ctx.fillStyle = '#5ab56e';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(w * (0.06 + i * 0.22), h * 0.75);
        ctx.lineTo(w * (0.06 + i * 0.22) - 8, h * 0.6);
        ctx.lineTo(w * (0.06 + i * 0.22) + 8, h * 0.6);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Crystal Clear · pH 7.4', w / 2, h - 8);
    },
    polluted: (ctx, w, h) => {
      // Barren banks
      ctx.fillStyle = '#5a4a2a';
      ctx.fillRect(0, 0, w, h * 0.25);
      ctx.fillRect(0, h * 0.75, w, h * 0.25);
      // Toxic water
      const gr = ctx.createLinearGradient(0, h * 0.25, 0, h * 0.75);
      gr.addColorStop(0, '#3d5e22');
      gr.addColorStop(0.3, '#4a6a1a');
      gr.addColorStop(0.6, '#5c7820');
      gr.addColorStop(1, '#3a5018');
      ctx.fillStyle = gr;
      ctx.fillRect(0, h * 0.25, w, h * 0.5);
      // Oil slick
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.ellipse(w * (0.08 + i * 0.12), h * (0.38 + (i % 3) * 0.06), 35 + i * 5, 12, i * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${280 + i * 15}, 60%, 40%, 0.35)`;
        ctx.fill();
      }
      // Floating waste
      ['🛢️', '🥤', '🛍️'].forEach((e, i) => {
        ctx.font = '22px serif';
        ctx.fillText(e, w * (0.15 + i * 0.32), h * 0.5);
      });
      // Foam
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(w * (0.15 + i * 0.18), h * 0.65, 25, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220,200,180,0.3)';
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,80,60,0.9)';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Severely Contaminated · pH 4.2', w / 2, h - 8);
    }
  },
  soil: {
    clean: (ctx, w, h) => {
      // Layers
      const layers = [
        { y: 0, h: 0.15, c: '#4a8c54', label: 'Surface Vegetation' },
        { y: 0.15, h: 0.2, c: '#6b4c2a', label: 'Topsoil (Rich)' },
        { y: 0.35, h: 0.25, c: '#7a5a30', label: 'Subsoil' },
        { y: 0.6, h: 0.2, c: '#8a6a3a', label: 'Parent Material' },
        { y: 0.8, h: 0.2, c: '#5a4020', label: 'Bedrock' },
      ];
      layers.forEach(l => {
        ctx.fillStyle = l.c;
        ctx.fillRect(0, h * l.y, w, h * l.h);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '11px Inter';
        ctx.fillText(l.label, 10, h * (l.y + l.h * 0.5) + 4);
      });
      // Roots
      ctx.strokeStyle = 'rgba(120,80,40,0.6)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(w * (0.2 + i * 0.15), h * 0.15);
        ctx.quadraticCurveTo(w * (0.2 + i * 0.15) + 20, h * 0.3, w * (0.2 + i * 0.15) - 10, h * 0.45);
        ctx.stroke();
      }
      // Earthworms
      ctx.strokeStyle = 'rgba(180,120,80,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.28);
      ctx.bezierCurveTo(w * 0.4, h * 0.22, w * 0.5, h * 0.34, w * 0.6, h * 0.28);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Healthy Soil · Organic Matter 8%', w / 2, h - 8);
    },
    polluted: (ctx, w, h) => {
      // Degraded layers
      const layers = [
        { y: 0, h: 0.1, c: '#3a3025', label: 'Barren Surface' },
        { y: 0.1, h: 0.18, c: '#3d3018', label: 'Depleted Topsoil' },
        { y: 0.28, h: 0.22, c: '#4a3820', label: 'Contaminated Subsoil' },
        { y: 0.5, h: 0.25, c: '#5a3025', label: 'Chemical Leachate' },
        { y: 0.75, h: 0.25, c: '#3a2010', label: 'Polluted Bedrock' },
      ];
      layers.forEach(l => {
        ctx.fillStyle = l.c;
        ctx.fillRect(0, h * l.y, w, h * l.h);
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '11px Inter';
        ctx.fillText(l.label, 10, h * (l.y + l.h * 0.5) + 4);
      });
      // Chemical seepage
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.ellipse(w * (0.1 + i * 0.11), h * (0.35 + i * 0.04), 15, 35, 0.1 * i, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160,220,80,${0.18 - i * 0.01})`;
        ctx.fill();
      }
      // Toxic pools
      ctx.fillStyle = 'rgba(100,200,50,0.3)';
      ctx.beginPath();
      ctx.ellipse(w * 0.55, h * 0.68, 60, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,80,60,0.9)';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Severely Polluted · 45 Toxins Detected', w / 2, h - 8);
    }
  },
  ocean: {
    clean: (ctx, w, h) => {
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#006994');
      gr.addColorStop(0.5, '#0083b0');
      gr.addColorStop(1, '#003f5c');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
      // Waves
      for (let j = 0; j < 4; j++) {
        ctx.beginPath();
        ctx.moveTo(0, h * (0.15 + j * 0.08));
        for (let x = 0; x <= w; x += 20) {
          ctx.lineTo(x, h * (0.15 + j * 0.08) + Math.sin(x * 0.05 + j) * 6);
        }
        ctx.strokeStyle = `rgba(255,255,255,${0.15 - j * 0.03})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      // Coral
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = ['#ff6b6b','#ffa07a','#ff8c00','#ff69b4','#ff4500','#dc143c'][i];
        ctx.beginPath();
        ctx.ellipse(w * (0.08 + i * 0.16), h * 0.85, 12, 22, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Fish
      drawFish(ctx, w * 0.35, h * 0.4, '#f0a040');
      drawFish(ctx, w * 0.6, h * 0.55, '#40a0f0');
      drawFish(ctx, w * 0.75, h * 0.35, '#f04040');
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Pristine Ocean · pH 8.2 · Clear Visibility', w / 2, h - 12);
    },
    polluted: (ctx, w, h) => {
      const gr = ctx.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#3a2e1a');
      gr.addColorStop(0.5, '#2e2410');
      gr.addColorStop(1, '#1a1408');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
      // Plastic debris
      const debris = ['🛍️','🍶','🧴','🥤','🛢️','🍬'];
      debris.forEach((d, i) => {
        ctx.font = '20px serif';
        ctx.fillText(d, w * (0.08 + (i % 3) * 0.32), h * (0.2 + Math.floor(i / 3) * 0.25));
      });
      // Oil spill
      const oil = ctx.createRadialGradient(w * 0.5, h * 0.6, 0, w * 0.5, h * 0.6, 120);
      oil.addColorStop(0, 'rgba(20,10,0,0.7)');
      oil.addColorStop(0.5, 'rgba(40,20,0,0.4)');
      oil.addColorStop(1, 'transparent');
      ctx.fillStyle = oil;
      ctx.fillRect(0, 0, w, h);
      // Dead coral
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.ellipse(w * (0.08 + i * 0.16), h * 0.85, 10, 18, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Algae bloom
      ctx.fillStyle = 'rgba(60,120,20,0.3)';
      ctx.fillRect(0, h * 0.45, w, h * 0.2);
      ctx.fillStyle = 'rgba(255,80,60,0.9)';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Dead Zone · pH 7.6 · Zero Visibility', w / 2, h - 12);
    }
  }
};

function drawCloud(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.4, y + r * 0.1, r * 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - r * 0.4, y + r * 0.15, r * 0.35, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.15, y + r * 0.25, r * 0.45, 0, Math.PI * 2); ctx.fill();
}
function drawTree(ctx, x, y, r, color) {
  ctx.fillStyle = '#5a3a20';
  ctx.fillRect(x - 3, y - r * 0.8, 6, r * 0.8);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y - r, r, 0, Math.PI * 2); ctx.fill();
}
function drawFish(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 16, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 14, y);
  ctx.lineTo(x - 22, y - 8);
  ctx.lineTo(x - 22, y + 8);
  ctx.fill();
}
function drawFactory(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 20, y, 40, 80);
  ctx.fillRect(x - 8, y - 30, 10, 30);
  ctx.fillRect(x + 8, y - 20, 8, 20);
}

function renderComparison() {
  const W = compCanvas.width, H = compCanvas.height;
  const split = Math.floor(W * splitPct);
  const comp = COMPARISONS[currentComp];
  cCtx.clearRect(0, 0, W, H);

  // Draw clean side (left)
  cCtx.save();
  cCtx.beginPath();
  cCtx.rect(0, 0, split, H);
  cCtx.clip();
  comp.clean(cCtx, W, H);
  cCtx.restore();

  // Draw polluted side (right)
  cCtx.save();
  cCtx.beginPath();
  cCtx.rect(split, 0, W - split, H);
  cCtx.clip();
  comp.polluted(cCtx, W, H);
  cCtx.restore();
}

compSlider.addEventListener('input', () => {
  splitPct = compSlider.value / 100;
  compDivider.style.left = `${compSlider.value}%`;
  renderComparison();
});
document.querySelectorAll('.comp-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.comp-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentComp = tab.dataset.comp;
    renderComparison();
  });
});
compDivider.style.left = '50%';
renderComparison();

// ─── SIMULATION TEMPLATES ───
const SIM_TEMPLATES = {
  air: {
    title: '🌫️ Air Pollution Simulator',
    desc: 'Visualize particulate matter, smog, and AQI changes in real-time. Adjust emission intensity to see how air quality degrades.',
    height: 340,
    setup(canvas, controls, dataRow) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      let intensity = 0.5, running = true;
      let particles = [];
      let smokePuffs = [];
      let time = 0;

      function initParticles() {
        particles = Array.from({ length: 200 }, () => ({
          x: Math.random() * W, y: H * 0.5 + Math.random() * H * 0.4,
          r: Math.random() * 2.5 + 0.5,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -Math.random() * 0.4 - 0.1,
          life: Math.random(),
          grey: Math.floor(60 + Math.random() * 60),
        }));
      }
      initParticles();

      function draw() {
        if (!running) return;
        time += 0.016;

        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
        const smogR = Math.floor(20 + intensity * 120);
        const smogG = Math.floor(20 + intensity * 80);
        skyGrad.addColorStop(0, `rgb(${smogR + 10},${smogG + 10},20)`);
        skyGrad.addColorStop(1, `rgb(${smogR + 30},${smogG + 20},10)`);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H);

        // City skyline
        const buildings = [
          { x: 0.02, w: 0.05, h: 0.35 }, { x: 0.08, w: 0.04, h: 0.45 },
          { x: 0.13, w: 0.06, h: 0.55 }, { x: 0.2, w: 0.04, h: 0.38 },
          { x: 0.25, w: 0.07, h: 0.62 }, { x: 0.33, w: 0.05, h: 0.42 },
          { x: 0.39, w: 0.08, h: 0.7 }, { x: 0.48, w: 0.04, h: 0.48 },
          { x: 0.53, w: 0.06, h: 0.58 }, { x: 0.6, w: 0.05, h: 0.36 },
          { x: 0.66, w: 0.07, h: 0.65 }, { x: 0.74, w: 0.04, h: 0.44 },
          { x: 0.79, w: 0.06, h: 0.52 }, { x: 0.86, w: 0.05, h: 0.38 },
          { x: 0.92, w: 0.08, h: 0.48 },
        ];
        ctx.fillStyle = '#1a1a2a';
        buildings.forEach(b => {
          ctx.fillRect(W * b.x, H * (1 - b.h), W * b.w, H * b.h);
          // Windows
          ctx.fillStyle = `rgba(255,220,80,${0.15 + Math.random() * 0.1})`;
          for (let r = 0; r < Math.floor(b.h * 12); r++) {
            for (let c = 0; c < 2; c++) {
              if (Math.random() > 0.4) {
                ctx.fillRect(W * b.x + c * W * b.w * 0.45 + 4, H * (1 - b.h) + r * 18 + 6, 6, 8);
              }
            }
          }
          ctx.fillStyle = '#1a1a2a';
        });

        // Chimney smoke
        const chimneys = [0.16, 0.29, 0.43, 0.7, 0.82];
        chimneys.forEach((cx, i) => {
          for (let s = 0; s < 3; s++) {
            const age = (time * 0.8 + s * 0.33 + i * 0.7) % 1;
            const px = W * cx + Math.sin(age * Math.PI * 2 + i) * 20 * age;
            const py = H * 0.3 - age * H * 0.35;
            const pr = (8 + age * 35) * intensity;
            const alpha = (1 - age) * 0.4 * intensity;
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(80,70,60,${alpha})`;
            ctx.fill();
          }
        });

        // Smog layer
        const smogGrad = ctx.createLinearGradient(0, H * 0.2, 0, H * 0.6);
        smogGrad.addColorStop(0, 'transparent');
        smogGrad.addColorStop(0.5, `rgba(${smogR},${smogG},10,${0.3 * intensity})`);
        smogGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = smogGrad;
        ctx.fillRect(0, 0, W, H);

        // Floating particles
        particles.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          p.life -= 0.004 * intensity;
          if (p.life < 0 || p.y < 0) {
            p.x = Math.random() * W; p.y = H * 0.9;
            p.life = Math.random();
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.grey},${p.grey - 10},${p.grey - 20},${p.life * 0.5 * intensity})`;
          ctx.fill();
        });

        // AQI meter
        const aqi = Math.floor(20 + intensity * 280);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.roundRect(W - 160, 10, 148, 90, 10);
        ctx.fill();
        ctx.fillStyle = aqi < 50 ? '#10b981' : aqi < 100 ? '#84cc16' : aqi < 150 ? '#f59e0b' : aqi < 200 ? '#f97316' : '#ef4444';
        ctx.font = 'bold 32px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.fillText(aqi, W - 84, 62);
        ctx.fillStyle = '#aaa';
        ctx.font = '11px JetBrains Mono';
        ctx.fillText('AIR QUALITY INDEX', W - 84, 88);
        const aqiLabel = aqi < 50 ? 'Good' : aqi < 100 ? 'Moderate' : aqi < 150 ? 'Unhealthy (Sensitive)' : aqi < 200 ? 'Unhealthy' : 'Very Unhealthy';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px Inter';
        ctx.fillText(aqiLabel, W - 84, 100);

        // Data row update
        dataRow.querySelector('[data-key="aqi"]').textContent = aqi;
        dataRow.querySelector('[data-key="pm25"]').textContent = (5 + intensity * 150).toFixed(1) + ' μg/m³';
        dataRow.querySelector('[data-key="visibility"]').textContent = (12 - intensity * 10).toFixed(1) + ' km';

        requestAnimationFrame(draw);
      }
      draw();

      // Controls
      const sli = controls.querySelector('.sim-slider');
      sli.addEventListener('input', () => { intensity = sli.value / 100; });
      controls.querySelector('[data-action="pause"]').addEventListener('click', (e) => {
        running = !running;
        e.target.textContent = running ? 'Pause' : 'Resume';
        if (running) draw();
      });
      controls.querySelector('[data-action="reset"]').addEventListener('click', () => {
        sli.value = 50; intensity = 0.5; running = true;
      });
    },
    dataKeys: ['aqi', 'pm25', 'visibility'],
    dataLabels: ['Air Quality Index', 'PM2.5 Concentration', 'Visibility Range'],
  },

  water: {
    title: '💧 Water Pollution Simulator',
    desc: 'Observe contamination spreading through water bodies, oil slicks forming, and ecosystem degradation in real time.',
    height: 320,
    setup(canvas, controls, dataRow) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      let intensity = 0.4, running = true, time = 0;
      let debris = Array.from({ length: 30 }, () => ({
        x: Math.random() * W, y: H * 0.3 + Math.random() * H * 0.5,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.1,
        r: Math.random() * 8 + 3, type: Math.floor(Math.random() * 3),
      }));

      function draw() {
        if (!running) return;
        time += 0.016;

        // Water background
        const waterHue = Math.floor(180 - intensity * 100);
        const waterSat = Math.floor(70 - intensity * 50);
        const gr = ctx.createLinearGradient(0, H * 0.05, 0, H);
        gr.addColorStop(0, `hsl(${waterHue},${waterSat}%,${45 - intensity * 30}%)`);
        gr.addColorStop(1, `hsl(${waterHue - 20},${waterSat - 10}%,${25 - intensity * 20}%)`);
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, W, H);

        // Shore
        ctx.fillStyle = `hsl(30,${50 - intensity * 20}%,${45 - intensity * 15}%)`;
        ctx.fillRect(0, 0, W, H * 0.08);
        ctx.fillRect(0, H * 0.92, W, H * 0.08);

        // Waves
        for (let w = 0; w < 5; w++) {
          ctx.beginPath();
          ctx.moveTo(0, H * (0.25 + w * 0.13));
          for (let x = 0; x <= W; x += 15) {
            ctx.lineTo(x, H * (0.25 + w * 0.13) + Math.sin(x * 0.03 + time + w) * (4 - intensity * 2));
          }
          ctx.strokeStyle = `rgba(255,255,255,${0.08 - intensity * 0.05})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Oil slick
        if (intensity > 0.2) {
          const cx = W * (0.4 + Math.sin(time * 0.2) * 0.1), cy = H * 0.5;
          const oilGr = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120 * intensity);
          oilGr.addColorStop(0, `rgba(20,10,0,${0.7 * intensity})`);
          oilGr.addColorStop(0.4, `hsla(${270 + time * 10 % 60},60%,30%,${0.4 * intensity})`);
          oilGr.addColorStop(1, 'transparent');
          ctx.fillStyle = oilGr;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 140 * intensity, 70 * intensity, time * 0.1, 0, Math.PI * 2);
          ctx.fill();
        }

        // Debris
        debris.forEach(d => {
          d.x += d.vx; d.y += d.vy + Math.sin(time + d.x * 0.01) * 0.05;
          if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
          if (d.y < H * 0.08 || d.y > H * 0.92) d.vy *= -1;
          if (Math.random() < intensity * 0.01 || d.x < 0) {
            d.x = Math.random() * W; d.y = H * (0.1 + Math.random() * 0.8);
          }
          const alpha = intensity * 0.7 + 0.1;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r * intensity, 0, Math.PI * 2);
          ctx.fillStyle = d.type === 0 ? `rgba(200,180,160,${alpha})` :
            d.type === 1 ? `rgba(50,100,180,${alpha * 0.6})` :
              `rgba(160,140,100,${alpha})`;
          ctx.fill();
        });

        // Contamination ripples
        for (let r = 0; r < 3; r++) {
          const age = (time * 0.5 + r * 0.33) % 1;
          ctx.beginPath();
          ctx.arc(W * 0.35, H * 0.55, age * 100 * intensity, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(100,180,60,${(1 - age) * 0.3 * intensity})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // pH / clarity meter
        const pH = (8.2 - intensity * 2.5).toFixed(1);
        const clarity = Math.floor(100 - intensity * 90);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.roundRect(10, 10, 170, 80, 10);
        ctx.fill();
        ctx.fillStyle = pH < 6 ? '#ef4444' : pH < 7 ? '#f59e0b' : '#10b981';
        ctx.font = 'bold 26px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.fillText(`pH ${pH}`, 95, 44);
        ctx.fillStyle = '#aaa';
        ctx.font = '11px JetBrains Mono';
        ctx.fillText(`CLARITY: ${clarity}%  |  TOXINS DETECTED`, 95, 62);
        ctx.fillStyle = intensity > 0.6 ? '#ef4444' : intensity > 0.3 ? '#f59e0b' : '#10b981';
        ctx.font = 'bold 10px Inter';
        ctx.fillText(intensity > 0.7 ? 'SEVERELY CONTAMINATED' : intensity > 0.4 ? 'MODERATE RISK' : 'SAFE', 95, 78);

        dataRow.querySelector('[data-key="ph"]').textContent = pH;
        dataRow.querySelector('[data-key="clarity"]').textContent = clarity + '%';
        dataRow.querySelector('[data-key="oxygen"]').textContent = (8.5 - intensity * 6).toFixed(1) + ' mg/L';

        requestAnimationFrame(draw);
      }
      draw();

      const sli = controls.querySelector('.sim-slider');
      sli.addEventListener('input', () => { intensity = sli.value / 100; });
      controls.querySelector('[data-action="pause"]').addEventListener('click', (e) => {
        running = !running; e.target.textContent = running ? 'Pause' : 'Resume';
        if (running) draw();
      });
      controls.querySelector('[data-action="reset"]').addEventListener('click', () => { sli.value = 40; intensity = 0.4; });
    },
    dataKeys: ['ph', 'clarity', 'oxygen'],
    dataLabels: ['Water pH Level', 'Water Clarity', 'Dissolved Oxygen'],
  },

  soil: {
    title: '🌱 Soil Pollution Simulator',
    desc: 'Cross-section view of soil layers showing chemical infiltration, root damage, and contamination spread over time.',
    height: 360,
    setup(canvas, controls, dataRow) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      let intensity = 0.35, running = true, time = 0;

      function draw() {
        if (!running) return;
        time += 0.016;

        // Soil layers
        const layers = [
          { pct: 0.12, base: `hsl(120,${60 - intensity * 50}%,${35 - intensity * 20}%)`, name: 'Surface' },
          { pct: 0.22, base: `hsl(30,${55 - intensity * 40}%,${32 - intensity * 18}%)`, name: 'Topsoil' },
          { pct: 0.28, base: `hsl(25,${45 - intensity * 35}%,${28 - intensity * 16}%)`, name: 'Subsoil' },
          { pct: 0.22, base: `hsl(20,${40 - intensity * 30}%,${24 - intensity * 14}%)`, name: 'Parent Material' },
          { pct: 0.16, base: `hsl(15,${30 - intensity * 20}%,${18 - intensity * 10}%)`, name: 'Bedrock' },
        ];
        let yOffset = 0;
        layers.forEach(l => {
          ctx.fillStyle = l.base;
          ctx.fillRect(0, H * yOffset, W, H * l.pct);
          // Layer label
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.font = '10px JetBrains Mono';
          ctx.textAlign = 'left';
          ctx.fillText(l.name, 10, H * (yOffset + l.pct * 0.5) + 4);
          yOffset += l.pct;
        });

        // Chemical seepage blobs
        if (intensity > 0.1) {
          for (let i = 0; i < 8; i++) {
            const cx = W * (0.1 + i * 0.11);
            const cy = H * (0.15 + intensity * 0.55 + Math.sin(time * 0.3 + i) * 0.03);
            const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30 * intensity);
            gr.addColorStop(0, `rgba(100,220,80,${0.5 * intensity})`);
            gr.addColorStop(1, 'transparent');
            ctx.fillStyle = gr;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 18 * intensity, 40 * intensity + i * 2, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Plant roots
        const plantCount = Math.floor(6 - intensity * 4);
        for (let i = 0; i < plantCount; i++) {
          const rx = W * (0.1 + i * 0.18);
          const healthColor = `hsl(120,${70 - intensity * 60}%,${40 - intensity * 20}%)`;
          ctx.strokeStyle = healthColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(rx, H * 0.12);
          ctx.quadraticCurveTo(rx + 15, H * 0.28, rx - 10, H * 0.4);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(rx, H * 0.22);
          ctx.quadraticCurveTo(rx - 20, H * 0.32, rx + 5, H * 0.42);
          ctx.stroke();
          // Dead ends on high intensity
          if (intensity > 0.5) {
            ctx.fillStyle = `rgba(180,80,40,${intensity - 0.4})`;
            ctx.beginPath();
            ctx.arc(rx - 10, H * 0.4, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Surface vegetation
        for (let i = 0; i < Math.floor(8 - intensity * 7); i++) {
          const vx = W * (0.05 + i * 0.13);
          ctx.fillStyle = `hsl(120,${65 - intensity * 55}%,${38 - intensity * 20}%)`;
          ctx.beginPath();
          ctx.moveTo(vx, H * 0.12);
          ctx.lineTo(vx - 6, 0);
          ctx.lineTo(vx + 6, 0);
          ctx.fill();
        }

        // Toxic pool
        if (intensity > 0.5) {
          ctx.fillStyle = `rgba(80,200,60,${(intensity - 0.5) * 0.6})`;
          ctx.beginPath();
          ctx.ellipse(W * 0.65, H * 0.62, 60 * (intensity - 0.4), 15, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Organic matter meter
        const organicMatter = Math.max(0.5, 8 - intensity * 7.5).toFixed(1);
        const toxinCount = Math.floor(intensity * 55);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.roundRect(W - 200, 10, 188, 80, 10);
        ctx.fill();
        ctx.fillStyle = intensity < 0.3 ? '#10b981' : intensity < 0.6 ? '#f59e0b' : '#ef4444';
        ctx.font = 'bold 24px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.fillText(`${organicMatter}% OM`, W - 106, 46);
        ctx.fillStyle = '#aaa';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`${toxinCount} TOXINS | ORGANIC MATTER`, W - 106, 64);
        ctx.fillStyle = intensity > 0.6 ? '#ef4444' : intensity > 0.3 ? '#f59e0b' : '#10b981';
        ctx.font = 'bold 10px Inter';
        ctx.fillText(intensity > 0.7 ? 'CRITICALLY DEGRADED' : intensity > 0.4 ? 'COMPROMISED' : 'HEALTHY', W - 106, 80);

        dataRow.querySelector('[data-key="organic"]').textContent = organicMatter + '%';
        dataRow.querySelector('[data-key="toxins"]').textContent = toxinCount + ' detected';
        dataRow.querySelector('[data-key="ph"]').textContent = (6.8 - intensity * 2).toFixed(1);

        requestAnimationFrame(draw);
      }
      draw();

      const sli = controls.querySelector('.sim-slider');
      sli.addEventListener('input', () => { intensity = sli.value / 100; });
      controls.querySelector('[data-action="pause"]').addEventListener('click', (e) => {
        running = !running; e.target.textContent = running ? 'Pause' : 'Resume';
        if (running) draw();
      });
      controls.querySelector('[data-action="reset"]').addEventListener('click', () => { sli.value = 35; intensity = 0.35; });
    },
    dataKeys: ['organic', 'toxins', 'ph'],
    dataLabels: ['Organic Matter', 'Toxins Detected', 'Soil pH'],
  },

  noise: {
    title: '🔊 Noise Pollution Simulator',
    desc: 'Visualize urban sound pressure levels, frequency patterns, and their effect on human and animal health.',
    height: 320,
    setup(canvas, controls, dataRow) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      let intensity = 0.45, running = true, time = 0;

      function draw() {
        if (!running) return;
        time += 0.025;

        ctx.fillStyle = '#080c14';
        ctx.fillRect(0, 0, W, H);

        // Sound wave visualization
        const centerY = H / 2;
        const waveCount = 4;
        const colors = ['#00d4aa', '#0090ff', '#7c3aed', '#f59e0b'];
        const freqs = [1.2, 2.1, 3.4, 5.2];

        colors.forEach((color, i) => {
          ctx.beginPath();
          ctx.moveTo(0, centerY);
          for (let x = 0; x <= W; x += 2) {
            const wave = Math.sin(x * 0.02 * freqs[i] + time * (1 + i * 0.3)) * (H * 0.15 * intensity) +
              Math.sin(x * 0.05 * freqs[i] - time * 0.8) * (H * 0.05 * intensity);
            ctx.lineTo(x, centerY + wave * (i % 2 === 0 ? 1 : -0.7));
          }
          ctx.strokeStyle = `${color}${Math.floor(80 - i * 10).toString(16)}`;
          ctx.lineWidth = 2 - i * 0.3;
          ctx.stroke();
        });

        // Pressure rings from noise sources
        const sources = [
          { x: W * 0.15, y: H * 0.8, label: 'Traffic' },
          { x: W * 0.5, y: H * 0.75, label: 'Construction' },
          { x: W * 0.82, y: H * 0.82, label: 'Industry' },
        ];
        sources.forEach((src, si) => {
          for (let r = 0; r < 4; r++) {
            const age = (time * 0.6 + r * 0.25 + si * 0.4) % 1;
            const maxR = 80 * intensity * (1 + si * 0.3);
            ctx.beginPath();
            ctx.arc(src.x, src.y, age * maxR, 0, Math.PI * 2);
            const alpha = (1 - age) * 0.5 * intensity;
            ctx.strokeStyle = `rgba(${si === 0 ? '255,100,60' : si === 1 ? '255,180,60' : '100,100,255'},${alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          // Source icon
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.font = '10px Inter';
          ctx.textAlign = 'center';
          ctx.fillText(src.label, src.x, src.y + 10);
        });

        // dB meter
        const dB = Math.floor(35 + intensity * 90);
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.roundRect(W - 170, 10, 158, 90, 10);
        ctx.fill();
        const barW = 136 * (intensity);
        ctx.fillStyle = dB < 55 ? '#10b981' : dB < 70 ? '#f59e0b' : dB < 85 ? '#f97316' : '#ef4444';
        ctx.fillRect(W - 159, 50, barW, 12);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(W - 159, 50, 136, 12);
        ctx.fillStyle = dB < 55 ? '#10b981' : dB < 70 ? '#f59e0b' : dB < 85 ? '#f97316' : '#ef4444';
        ctx.font = 'bold 28px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.fillText(`${dB} dB`, W - 91, 42);
        ctx.fillStyle = '#aaa';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(dB > 85 ? '⚠ HEARING DAMAGE RISK' : dB > 70 ? 'STRESSFUL' : 'SAFE LEVEL', W - 91, 78);

        dataRow.querySelector('[data-key="db"]').textContent = dB + ' dB';
        dataRow.querySelector('[data-key="health"]').textContent = dB > 85 ? 'High Risk' : dB > 70 ? 'Moderate' : 'Low';
        dataRow.querySelector('[data-key="sleep"]').textContent = dB > 55 ? 'Disrupted' : 'Normal';

        requestAnimationFrame(draw);
      }
      draw();

      const sli = controls.querySelector('.sim-slider');
      sli.addEventListener('input', () => { intensity = sli.value / 100; });
      controls.querySelector('[data-action="pause"]').addEventListener('click', (e) => {
        running = !running; e.target.textContent = running ? 'Pause' : 'Resume';
        if (running) draw();
      });
      controls.querySelector('[data-action="reset"]').addEventListener('click', () => { sli.value = 45; intensity = 0.45; });
    },
    dataKeys: ['db', 'health', 'sleep'],
    dataLabels: ['Sound Level', 'Health Risk', 'Sleep Quality'],
  },

  light: {
    title: '💡 Light Pollution Simulator',
    desc: 'See how artificial brightness washes away the night sky, disrupts wildlife, and affects human circadian rhythms.',
    height: 340,
    setup(canvas, controls, dataRow) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      let intensity = 0.4, running = true, time = 0;
      const stars = Array.from({ length: 300 }, () => ({
        x: Math.random() * W, y: Math.random() * H * 0.75,
        r: Math.random() * 1.5 + 0.3,
        brightness: Math.random(),
        twinkle: Math.random() * Math.PI * 2,
      }));
      const milkyWay = Array.from({ length: 500 }, () => ({
        x: Math.random() * W, y: Math.random() * H * 0.6 + H * 0.05,
        r: Math.random() * 0.8 + 0.1, alpha: Math.random() * 0.4,
      }));

      function draw() {
        if (!running) return;
        time += 0.02;

        // Night sky
        const skyAlpha = 1 - intensity * 0.6;
        const gr = ctx.createLinearGradient(0, 0, 0, H * 0.8);
        gr.addColorStop(0, `rgba(2,4,18,${skyAlpha})`);
        gr.addColorStop(0.5, `rgba(5,10,30,${skyAlpha})`);
        gr.addColorStop(1, `rgba(10,15,40,${skyAlpha * 0.8})`);
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, W, H);

        // Light pollution glow from horizon
        if (intensity > 0) {
          const cityGlow = ctx.createRadialGradient(W / 2, H * 0.82, 0, W / 2, H * 0.82, W * 0.9);
          cityGlow.addColorStop(0, `rgba(255,180,60,${0.5 * intensity})`);
          cityGlow.addColorStop(0.3, `rgba(255,120,30,${0.25 * intensity})`);
          cityGlow.addColorStop(0.6, `rgba(255,80,20,${0.08 * intensity})`);
          cityGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = cityGlow;
          ctx.fillRect(0, 0, W, H);
        }

        // Milky Way (fades with intensity)
        const mwAlpha = Math.max(0, 0.5 - intensity * 0.6);
        milkyWay.forEach(s => {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180,180,220,${s.alpha * mwAlpha})`;
          ctx.fill();
        });

        // Stars (fade with pollution)
        stars.forEach(s => {
          s.twinkle += 0.03;
          const starAlpha = Math.max(0, (s.brightness - intensity * 0.85) * (0.8 + 0.2 * Math.sin(s.twinkle)));
          if (starAlpha > 0.01) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,240,${starAlpha})`;
            ctx.fill();
            if (s.brightness > 0.85 && starAlpha > 0.3) {
              const gl = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 6);
              gl.addColorStop(0, `rgba(200,220,255,${starAlpha * 0.6})`);
              gl.addColorStop(1, 'transparent');
              ctx.fillStyle = gl;
              ctx.beginPath();
              ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });

        // Moon (partially visible)
        const moonAlpha = Math.max(0.2, 1 - intensity * 0.7);
        ctx.fillStyle = `rgba(240,240,200,${moonAlpha})`;
        ctx.beginPath();
        ctx.arc(W * 0.75, H * 0.15, 22, 0, Math.PI * 2);
        ctx.fill();
        const moonGlow = ctx.createRadialGradient(W * 0.75, H * 0.15, 0, W * 0.75, H * 0.15, 50);
        moonGlow.addColorStop(0, `rgba(240,240,200,${0.2 * moonAlpha})`);
        moonGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(W * 0.75, H * 0.15, 50, 0, Math.PI * 2);
        ctx.fill();

        // City skyline
        ctx.fillStyle = `rgb(${15 + Math.floor(intensity * 40)},${12 + Math.floor(intensity * 30)},${8 + Math.floor(intensity * 15)})`;
        const builds = [0.04,0.1,0.15,0.22,0.28,0.35,0.42,0.5,0.56,0.63,0.7,0.77,0.83,0.9];
        const bhs = [0.12,0.18,0.22,0.1,0.25,0.15,0.3,0.13,0.2,0.18,0.28,0.12,0.22,0.15];
        builds.forEach((bx, i) => {
          ctx.fillRect(W * bx, H * (0.78 - bhs[i]), W * 0.05, H * (0.22 + bhs[i]));
          // Lit windows
          if (intensity > 0.2) {
            ctx.fillStyle = `rgba(255,200,80,${0.5 * intensity})`;
            for (let r = 0; r < Math.floor(bhs[i] * 30); r++) {
              if (Math.random() > 0.55) {
                ctx.fillRect(W * bx + 3, H * (0.78 - bhs[i]) + r * 14 + 4, 5, 8);
              }
            }
            ctx.fillStyle = `rgb(${15 + Math.floor(intensity * 40)},${12 + Math.floor(intensity * 30)},${8 + Math.floor(intensity * 15)})`;
          }
        });

        // Stats
        const visibleStars = Math.floor(300 * Math.max(0, 1 - intensity * 1.1));
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.roundRect(10, 10, 200, 70, 10);
        ctx.fill();
        ctx.fillStyle = intensity < 0.3 ? '#10b981' : intensity < 0.6 ? '#f59e0b' : '#ef4444';
        ctx.font = 'bold 22px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.fillText(`${visibleStars} stars visible`, 110, 38);
        ctx.fillStyle = '#aaa';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('SKY BRIGHTNESS INDEX', 110, 55);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '10px Inter';
        ctx.fillText(intensity > 0.7 ? 'Night sky destroyed' : intensity > 0.4 ? 'Milky Way invisible' : 'Partially natural', 110, 70);

        dataRow.querySelector('[data-key="stars"]').textContent = visibleStars;
        dataRow.querySelector('[data-key="skyglow"]').textContent = (intensity * 22).toFixed(1) + ' mag/arcsec²';
        dataRow.querySelector('[data-key="wildlife"]').textContent = intensity > 0.6 ? 'Critically disrupted' : intensity > 0.3 ? 'Disrupted' : 'Normal';

        requestAnimationFrame(draw);
      }
      draw();

      const sli = controls.querySelector('.sim-slider');
      sli.addEventListener('input', () => { intensity = sli.value / 100; });
      controls.querySelector('[data-action="pause"]').addEventListener('click', (e) => {
        running = !running; e.target.textContent = running ? 'Pause' : 'Resume';
        if (running) draw();
      });
      controls.querySelector('[data-action="reset"]').addEventListener('click', () => { sli.value = 40; intensity = 0.4; });
    },
    dataKeys: ['stars', 'skyglow', 'wildlife'],
    dataLabels: ['Stars Visible', 'Sky Brightness', 'Wildlife Impact'],
  },

  plastic: {
    title: '🏭 Plastic Pollution Simulator',
    desc: 'Watch plastic accumulation in ocean and land environments, from macro waste to invisible microplastics.',
    height: 320,
    setup(canvas, controls, dataRow) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      let intensity = 0.45, running = true, time = 0;
      const microplastics = Array.from({ length: 300 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 2 + 0.5,
        hue: Math.random() * 60 + 180,
      }));
      const macroplastics = Array.from({ length: 20 }, () => ({
        x: Math.random() * W, y: H * 0.2 + Math.random() * H * 0.6,
        vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.08,
        type: Math.floor(Math.random() * 4), size: 10 + Math.random() * 20,
      }));

      function draw() {
        if (!running) return;
        time += 0.016;

        // Ocean
        const gr = ctx.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, `hsl(200,${60 - intensity * 30}%,${35 - intensity * 20}%)`);
        gr.addColorStop(1, `hsl(210,${50 - intensity * 25}%,${20 - intensity * 12}%)`);
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, W, H);

        // Microplastics
        microplastics.forEach(p => {
          p.x += p.vx; p.y += p.vy + Math.sin(time + p.x * 0.01) * 0.05;
          if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
          if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue},60%,70%,${intensity * 0.5})`;
          ctx.fill();
        });

        // Macro plastic debris
        macroplastics.forEach(p => {
          p.x += p.vx; p.y += p.vy + Math.sin(time * 0.5 + p.x * 0.02) * 0.1;
          if (p.x < -30) p.x = W + 30; if (p.x > W + 30) p.x = -30;
          if (p.y < H * 0.15 || p.y > H * 0.88) p.vy *= -1;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(time * 0.1 * (p.vx > 0 ? 1 : -1));
          ctx.fillStyle = `rgba(180,160,140,${intensity * 0.8})`;
          if (p.type === 0) { // Bottle
            ctx.fillRect(-p.size / 3, -p.size, p.size / 1.5, p.size * 2);
            ctx.beginPath(); ctx.arc(0, -p.size, p.size / 3, 0, Math.PI * 2); ctx.fill();
          } else if (p.type === 1) { // Bag
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size * 0.8, p.size, 0, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.type === 2) { // Ring
            ctx.beginPath(); ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(200,180,160,${intensity * 0.7})`;
            ctx.lineWidth = 4; ctx.stroke();
          } else { // Fragment
            ctx.beginPath();
            ctx.moveTo(0, -p.size); ctx.lineTo(p.size * 0.7, p.size * 0.5);
            ctx.lineTo(-p.size * 0.7, p.size * 0.5); ctx.fill();
          }
          ctx.restore();
        });

        // Great Pacific Garbage Patch visualization
        if (intensity > 0.4) {
          const gpx = W * 0.55, gpy = H * 0.5;
          const gpr = 80 * intensity;
          const gp = ctx.createRadialGradient(gpx, gpy, 0, gpx, gpy, gpr);
          gp.addColorStop(0, `rgba(160,140,100,${intensity * 0.3})`);
          gp.addColorStop(1, 'transparent');
          ctx.fillStyle = gp;
          ctx.beginPath(); ctx.ellipse(gpx, gpy, gpr * 1.5, gpr, 0.3, 0, Math.PI * 2); ctx.fill();
        }

        // Stats
        const tonsMT = (150 + intensity * 230).toFixed(0);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.roundRect(10, 10, 180, 72, 10);
        ctx.fill();
        ctx.fillStyle = intensity < 0.3 ? '#10b981' : intensity < 0.6 ? '#f59e0b' : '#ef4444';
        ctx.font = 'bold 22px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.fillText(`${tonsMT}M tons`, 100, 40);
        ctx.fillStyle = '#aaa';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('OCEAN PLASTIC LOAD', 100, 58);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '10px Inter';
        ctx.fillText(intensity > 0.7 ? 'Ocean ecosystem collapse' : intensity > 0.4 ? 'Critical accumulation' : 'Elevated levels', 100, 72);

        dataRow.querySelector('[data-key="mass"]').textContent = tonsMT + 'M tons';
        dataRow.querySelector('[data-key="micro"]').textContent = (intensity * 50000).toFixed(0) + ' particles/L';
        dataRow.querySelector('[data-key="gyres"]').textContent = (intensity * 5).toFixed(0) + ' major gyres';

        requestAnimationFrame(draw);
      }
      draw();

      const sli = controls.querySelector('.sim-slider');
      sli.addEventListener('input', () => { intensity = sli.value / 100; });
      controls.querySelector('[data-action="pause"]').addEventListener('click', (e) => {
        running = !running; e.target.textContent = running ? 'Pause' : 'Resume';
        if (running) draw();
      });
      controls.querySelector('[data-action="reset"]').addEventListener('click', () => { sli.value = 45; intensity = 0.45; });
    },
    dataKeys: ['mass', 'micro', 'gyres'],
    dataLabels: ['Ocean Plastic Mass', 'Microplastics', 'Affected Gyres'],
  },

  chemical: {
    title: '⚗️ Chemical Pollution Simulator',
    desc: 'Visualize hazardous chemical diffusion through environmental media — air, water, and soil interaction layers.',
    height: 340,
    setup(canvas, controls, dataRow) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      let intensity = 0.4, running = true, time = 0;
      const spills = [
        { x: W * 0.25, y: H * 0.35, hue: 80, spreading: true },
        { x: W * 0.65, y: H * 0.5, hue: 120, spreading: true },
        { x: W * 0.45, y: H * 0.22, hue: 60, spreading: true },
      ];

      function draw() {
        if (!running) return;
        time += 0.016;

        // Environment layers
        // Air
        ctx.fillStyle = `hsl(220,${40 - intensity * 30}%,${18 - intensity * 8}%)`;
        ctx.fillRect(0, 0, W, H * 0.35);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '11px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText('ATMOSPHERE', 10, 20);

        // Water
        ctx.fillStyle = `hsl(200,${50 - intensity * 35}%,${22 - intensity * 12}%)`;
        ctx.fillRect(0, H * 0.35, W, H * 0.3);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText('HYDROSPHERE', 10, H * 0.35 + 18);

        // Soil
        ctx.fillStyle = `hsl(25,${45 - intensity * 30}%,${20 - intensity * 10}%)`;
        ctx.fillRect(0, H * 0.65, W, H * 0.35);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText('LITHOSPHERE', 10, H * 0.65 + 18);

        // Layer separators
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(0, H * 0.35); ctx.lineTo(W, H * 0.35); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, H * 0.65); ctx.lineTo(W, H * 0.65); ctx.stroke();
        ctx.setLineDash([]);

        // Chemical diffusion
        spills.forEach((s, si) => {
          const baseRadius = 30 + intensity * 100 + Math.sin(time * 0.5 + si) * 5;
          // Main spill
          const gr = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, baseRadius);
          gr.addColorStop(0, `hsla(${s.hue},90%,60%,${0.6 * intensity})`);
          gr.addColorStop(0.5, `hsla(${s.hue},80%,40%,${0.3 * intensity})`);
          gr.addColorStop(1, 'transparent');
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.arc(s.x, s.y, baseRadius * 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Spread trails through layers
          for (let trail = 0; trail < 5; trail++) {
            const ty = s.y + trail * 40 * intensity;
            const tx = s.x + Math.sin(trail * 1.2 + time * 0.3 + si) * 20;
            ctx.beginPath();
            ctx.arc(tx, ty, (5 - trail) * intensity * 4, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${s.hue},80%,55%,${(1 - trail * 0.18) * 0.4 * intensity})`;
            ctx.fill();
          }

          // Caution symbol
          ctx.fillStyle = `hsla(${s.hue},90%,65%,0.8)`;
          ctx.font = '18px serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚠', s.x, s.y - baseRadius - 5);
        });

        // Contamination spread map
        if (intensity > 0.3) {
          for (let x = 0; x < W; x += 20) {
            for (let y = 0; y < H; y += 20) {
              let contamination = 0;
              spills.forEach(s => {
                const d = Math.sqrt((x - s.x) ** 2 + (y - s.y) ** 2);
                contamination += Math.max(0, 1 - d / (150 * intensity));
              });
              if (contamination > 0.1) {
                ctx.fillStyle = `rgba(100,220,60,${contamination * 0.08 * intensity})`;
                ctx.fillRect(x, y, 18, 18);
              }
            }
          }
        }

        // Toxicity level
        const toxLevel = Math.floor(intensity * 1800);
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.roundRect(W - 175, 10, 163, 72, 10);
        ctx.fill();
        ctx.fillStyle = intensity < 0.3 ? '#10b981' : intensity < 0.6 ? '#f59e0b' : '#ef4444';
        ctx.font = 'bold 22px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.fillText(`${toxLevel} ppb`, W - 93, 38);
        ctx.fillStyle = '#aaa';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('TOXIN CONCENTRATION', W - 93, 55);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '10px Inter';
        ctx.fillText(intensity > 0.7 ? 'Lethal threshold exceeded' : intensity > 0.4 ? 'Harmful to ecosystems' : 'Below safe limits', W - 93, 70);

        dataRow.querySelector('[data-key="conc"]').textContent = toxLevel + ' ppb';
        dataRow.querySelector('[data-key="spread"]').textContent = (intensity * 450).toFixed(0) + ' km²';
        dataRow.querySelector('[data-key="halflife"]').textContent = (5 + intensity * 40).toFixed(0) + ' years';

        requestAnimationFrame(draw);
      }
      draw();

      const sli = controls.querySelector('.sim-slider');
      sli.addEventListener('input', () => { intensity = sli.value / 100; });
      controls.querySelector('[data-action="pause"]').addEventListener('click', (e) => {
        running = !running; e.target.textContent = running ? 'Pause' : 'Resume';
        if (running) draw();
      });
      controls.querySelector('[data-action="reset"]').addEventListener('click', () => { sli.value = 40; intensity = 0.4; });
    },
    dataKeys: ['conc', 'spread', 'halflife'],
    dataLabels: ['Toxin Concentration', 'Affected Area', 'Chemical Half-Life'],
  },

  thermal: {
    title: '🌡️ Thermal Pollution Simulator',
    desc: 'Heatmap visualization showing how industrial thermal discharge raises water body temperatures and destroys aquatic life.',
    height: 320,
    setup(canvas, controls, dataRow) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      let intensity = 0.4, running = true, time = 0;

      function draw() {
        if (!running) return;
        time += 0.016;

        // Water base
        const baseTemp = 15 + intensity * 20;
        const gr = ctx.createLinearGradient(0, 0, W, H);
        gr.addColorStop(0, `hsl(${220 - intensity * 140},${70 - intensity * 20}%,${25 - intensity * 10}%)`);
        gr.addColorStop(1, `hsl(${200 - intensity * 120},${60 - intensity * 15}%,${20 - intensity * 8}%)`);
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, W, H);

        // Heat sources (industrial discharge pipes)
        const heatSources = [
          { x: W * 0.15, y: H * 0.5 },
          { x: W * 0.55, y: H * 0.35 },
          { x: W * 0.8, y: H * 0.65 },
        ];

        heatSources.forEach((src, si) => {
          const spread = 80 + intensity * 120 + Math.sin(time * 0.4 + si) * 10;
          for (let ring = 0; ring < 8; ring++) {
            const ringR = spread * (1 - ring / 8);
            const temp = intensity * (1 - ring / 8);
            const h = Math.floor(240 - temp * 240);
            const gr = ctx.createRadialGradient(src.x, src.y, 0, src.x, src.y, ringR);
            gr.addColorStop(0, `hsla(${h},90%,55%,${0.35 * intensity})`);
            gr.addColorStop(1, 'transparent');
            ctx.fillStyle = gr;
            ctx.beginPath();
            ctx.arc(src.x, src.y, ringR, 0, Math.PI * 2);
            ctx.fill();
          }

          // Discharge pipe
          ctx.fillStyle = '#444';
          if (si === 0) ctx.fillRect(0, src.y - 8, src.x, 16);
          if (si === 1) ctx.fillRect(src.x, 0, 16, src.y);
          if (si === 2) ctx.fillRect(src.x, src.y, W - src.x, 16);

          // Temperature label
          const pointTemp = (baseTemp + 15 * intensity - si * 2).toFixed(1);
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.font = 'bold 12px Inter';
          ctx.textAlign = 'center';
          ctx.fillText(`${pointTemp}°C`, src.x, src.y - (spread * 0.5) - 10);
        });

        // Ecosystem stress indicators
        const fishCount = Math.floor(12 - intensity * 11);
        for (let i = 0; i < fishCount; i++) {
          const fx = W * (0.05 + (i % 4) * 0.25) + Math.sin(time * 0.5 + i) * 15;
          const fy = H * (0.2 + Math.floor(i / 4) * 0.35) + Math.cos(time * 0.3 + i) * 10;
          ctx.fillStyle = `rgba(100,200,120,${0.8 - intensity * 0.5})`;
          ctx.beginPath();
          ctx.ellipse(fx, fy, 10, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Dead fish indicators
        if (intensity > 0.5) {
          const deadCount = Math.floor((intensity - 0.5) * 20);
          for (let i = 0; i < deadCount; i++) {
            const dx = W * (0.1 + (i % 5) * 0.18);
            const dy = H * 0.1 + i * 15;
            ctx.fillStyle = `rgba(180,100,60,${intensity * 0.6})`;
            ctx.font = '14px serif';
            ctx.textAlign = 'left';
            ctx.fillText('×', dx, dy);
          }
        }

        // Thermal map legend
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.roundRect(W - 160, 10, 148, 80, 10);
        ctx.fill();
        const legendGr = ctx.createLinearGradient(W - 150, 0, W - 25, 0);
        legendGr.addColorStop(0, 'hsl(240,90%,50%)');
        legendGr.addColorStop(0.5, 'hsl(60,90%,50%)');
        legendGr.addColorStop(1, 'hsl(0,90%,50%)');
        ctx.fillStyle = legendGr;
        ctx.fillRect(W - 148, 28, 134, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '9px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText(`${baseTemp.toFixed(0)}°C`, W - 150, 55);
        ctx.textAlign = 'right';
        ctx.fillText(`${(baseTemp + 18 * intensity).toFixed(0)}°C`, W - 18, 55);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#aaa';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('THERMAL GRADIENT MAP', W - 84, 72);
        ctx.fillStyle = intensity > 0.6 ? '#ef4444' : intensity > 0.35 ? '#f59e0b' : '#10b981';
        ctx.font = 'bold 10px Inter';
        ctx.fillText(intensity > 0.6 ? '⚠ MASS MORTALITY ZONE' : intensity > 0.35 ? 'ECOSYSTEM STRESS' : 'TOLERABLE', W - 84, 85);

        dataRow.querySelector('[data-key="temp"]').textContent = baseTemp.toFixed(1) + '°C';
        dataRow.querySelector('[data-key="rise"]').textContent = '+' + (intensity * 18).toFixed(1) + '°C above baseline';
        dataRow.querySelector('[data-key="species"]').textContent = fishCount + ' species active';

        requestAnimationFrame(draw);
      }
      draw();

      const sli = controls.querySelector('.sim-slider');
      sli.addEventListener('input', () => { intensity = sli.value / 100; });
      controls.querySelector('[data-action="pause"]').addEventListener('click', (e) => {
        running = !running; e.target.textContent = running ? 'Pause' : 'Resume';
        if (running) draw();
      });
      controls.querySelector('[data-action="reset"]').addEventListener('click', () => { sli.value = 40; intensity = 0.4; });
    },
    dataKeys: ['temp', 'rise', 'species'],
    dataLabels: ['Baseline Temp', 'Temperature Rise', 'Active Species'],
  },

  radiation: {
    title: '☢️ Radiation Pollution Simulator',
    desc: 'Scientific visualization of ionizing radiation fields, contamination zones, and dose rate distribution.',
    height: 320,
    setup(canvas, controls, dataRow) {
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      let intensity = 0.3, running = true, time = 0;
      const particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
        life: Math.random(), maxLife: 0.5 + Math.random() * 0.5,
      }));
      const sources = [
        { x: W * 0.3, y: H * 0.45, strength: 1 },
        { x: W * 0.7, y: H * 0.55, strength: 0.7 },
      ];

      function draw() {
        if (!running) return;
        time += 0.016;

        // Background — dark scientific
        const gr = ctx.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, '#04080f');
        gr.addColorStop(1, '#080f1a');
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, W, H);

        // Grid
        ctx.strokeStyle = 'rgba(0,212,170,0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 40) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        // Radiation field gradient
        sources.forEach(src => {
          const maxR = 200 * intensity * src.strength;
          for (let r = maxR; r > 0; r -= 15) {
            const field = ctx.createRadialGradient(src.x, src.y, 0, src.x, src.y, r);
            const alpha = (r / maxR) * 0.15 * intensity;
            field.addColorStop(0, `rgba(100,255,100,${alpha})`);
            field.addColorStop(0.5, `rgba(200,255,0,${alpha * 0.5})`);
            field.addColorStop(1, 'transparent');
            ctx.fillStyle = field;
            ctx.beginPath(); ctx.arc(src.x, src.y, r, 0, Math.PI * 2); ctx.fill();
          }

          // Radiation rings
          for (let r = 0; r < 4; r++) {
            const age = (time * 0.8 + r * 0.25 * src.strength) % 1;
            const ringR = age * maxR;
            ctx.beginPath();
            ctx.arc(src.x, src.y, ringR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(120,255,80,${(1 - age) * 0.4 * intensity})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Source symbol
          ctx.font = '28px serif';
          ctx.textAlign = 'center';
          ctx.fillText('☢', src.x, src.y + 10);

          // Dose rate label
          const dose = (src.strength * intensity * 500).toFixed(0);
          ctx.fillStyle = `rgba(120,255,80,0.8)`;
          ctx.font = 'bold 11px JetBrains Mono';
          ctx.fillText(`${dose} μSv/h`, src.x, src.y - 28);
        });

        // Radiation particles (alpha/beta trajectories)
        particles.forEach(p => {
          p.life -= 0.02 * intensity;
          if (p.life < 0) {
            const src = sources[Math.floor(Math.random() * sources.length)];
            p.x = src.x; p.y = src.y;
            p.vx = (Math.random() - 0.5) * 5 * intensity;
            p.vy = (Math.random() - 0.5) * 5 * intensity;
            p.life = p.maxLife;
          }
          p.x += p.vx; p.y += p.vy;
          p.vx *= 0.99; p.vy *= 0.99;
          const alpha = p.life / p.maxLife * intensity;
          ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(150,255,120,${alpha})`;
          ctx.fill();
        });

        // Geiger counter visualization
        const counts = Math.floor(intensity * 1200 + Math.random() * 50 * intensity);
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.roundRect(10, 10, 200, 80, 10);
        ctx.fill();
        ctx.fillStyle = counts > 500 ? '#ef4444' : counts > 100 ? '#f59e0b' : '#10b981';
        ctx.font = 'bold 24px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.fillText(`${counts} cpm`, 110, 42);
        ctx.fillStyle = '#aaa';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('GEIGER COUNT (counts/min)', 110, 60);
        ctx.fillStyle = counts > 500 ? '#ef4444' : counts > 100 ? '#f59e0b' : '#10b981';
        ctx.font = 'bold 10px Inter';
        ctx.fillText(counts > 700 ? '⚠ DANGEROUS — EVACUATE' : counts > 200 ? 'ELEVATED EXPOSURE' : 'BACKGROUND LEVEL', 110, 78);

        dataRow.querySelector('[data-key="cpm"]').textContent = counts + ' cpm';
        dataRow.querySelector('[data-key="dose"]').textContent = (intensity * 480).toFixed(0) + ' μSv/h';
        dataRow.querySelector('[data-key="safe"]').textContent = intensity < 0.2 ? 'Safe' : intensity < 0.5 ? 'Restricted' : 'Evacuate';

        requestAnimationFrame(draw);
      }
      draw();

      const sli = controls.querySelector('.sim-slider');
      sli.addEventListener('input', () => { intensity = sli.value / 100; });
      controls.querySelector('[data-action="pause"]').addEventListener('click', (e) => {
        running = !running; e.target.textContent = running ? 'Pause' : 'Resume';
        if (running) draw();
      });
      controls.querySelector('[data-action="reset"]').addEventListener('click', () => { sli.value = 30; intensity = 0.3; });
    },
    dataKeys: ['cpm', 'dose', 'safe'],
    dataLabels: ['Geiger Count', 'Dose Rate', 'Safety Status'],
  },
};

// ─── SIM MODAL OPEN/CLOSE ───
function openSim(type) {
  const modal = document.getElementById('simModal');
  const content = document.getElementById('simContent');
  const tpl = SIM_TEMPLATES[type];
  if (!tpl) return;

  const dataBoxes = tpl.dataKeys.map((k, i) => `
    <div class="sim-data-box">
      <span class="sim-data-val" data-key="${k}">—</span>
      <span class="sim-data-lbl">${tpl.dataLabels[i]}</span>
    </div>
  `).join('');

  content.innerHTML = `
    <div class="sim-panel">
      <h2 class="sim-title">${tpl.title}</h2>
      <p class="sim-desc">${tpl.desc}</p>
      <div class="sim-canvas-wrap">
        <canvas class="sim-canvas" id="simCanvas" width="880" height="${tpl.height}"></canvas>
      </div>
      <div class="sim-controls">
        <div class="sim-control-group">
          <label class="sim-control-label">POLLUTION INTENSITY</label>
          <input type="range" class="sim-slider" min="0" max="100" value="40" />
        </div>
        <button class="sim-btn" data-action="pause">Pause</button>
        <button class="sim-btn" data-action="reset">Reset</button>
      </div>
      <div class="sim-data-row">${dataBoxes}</div>
    </div>
  `;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  const canvas = content.querySelector('#simCanvas');
  const controls = content.querySelector('.sim-controls');
  const dataRow = content.querySelector('.sim-data-row');
  tpl.setup(canvas, controls, dataRow);
}

function closeSim() {
  const modal = document.getElementById('simModal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  // Clear canvas to stop animation
  const canvas = document.getElementById('simCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// Keyboard close
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSim(); });

// ─── CTA CANVAS ───
const ctaCanvas = document.getElementById('ctaCanvas');
const ctaCtx = ctaCanvas.getContext('2d');
let ctaW, ctaH;
function initCta() {
  ctaW = ctaCanvas.width = ctaCanvas.offsetWidth;
  ctaH = ctaCanvas.height = ctaCanvas.offsetHeight;
}
function drawCta(ts) {
  ctaCtx.clearRect(0, 0, ctaW, ctaH);
  const t = ts * 0.0005;
  // Slow aurora-like gradient
  const gr = ctaCtx.createRadialGradient(
    ctaW * (0.3 + 0.2 * Math.sin(t)), ctaH * (0.4 + 0.15 * Math.cos(t * 0.7)),
    0,
    ctaW * 0.5, ctaH * 0.5, ctaW * 0.8
  );
  gr.addColorStop(0, 'rgba(0,212,170,0.15)');
  gr.addColorStop(0.4, 'rgba(0,100,200,0.08)');
  gr.addColorStop(1, 'transparent');
  ctaCtx.fillStyle = gr;
  ctaCtx.fillRect(0, 0, ctaW, ctaH);

  const gr2 = ctaCtx.createRadialGradient(
    ctaW * (0.7 + 0.15 * Math.cos(t * 1.3)), ctaH * (0.5 + 0.2 * Math.sin(t * 0.9)),
    0,
    ctaW * 0.6, ctaH * 0.6, ctaW * 0.6
  );
  gr2.addColorStop(0, 'rgba(124,58,237,0.1)');
  gr2.addColorStop(1, 'transparent');
  ctaCtx.fillStyle = gr2;
  ctaCtx.fillRect(0, 0, ctaW, ctaH);

  requestAnimationFrame(drawCta);
}
const ctaSection = document.getElementById('action');
const ctaObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      initCta();
      drawCta(0);
    }
  });
}, { threshold: 0.1 });
ctaObserver.observe(ctaSection);
window.addEventListener('resize', initCta);

// ─── SPREAD VIZ ───
const spreadViz = document.getElementById('spreadViz');
if (spreadViz) {
  const sc = document.createElement('canvas');
  sc.width = spreadViz.offsetWidth || 600;
  sc.height = 100;
  sc.style.width = '100%';
  spreadViz.appendChild(sc);
  const sCtx = sc.getContext('2d');
  const sNodes = [
    { x: 0.1, y: 0.5, label: 'Factory', color: '#ef4444' },
    { x: 0.3, y: 0.3, label: 'Air', color: '#94a3b8' },
    { x: 0.5, y: 0.5, label: 'Water', color: '#3b82f6' },
    { x: 0.7, y: 0.7, label: 'Soil', color: '#84cc16' },
    { x: 0.9, y: 0.5, label: 'Ecosystem', color: '#10b981' },
  ];
  let sTime = 0;
  function drawSpread() {
    sCtx.clearRect(0, 0, sc.width, sc.height);
    // Connections
    for (let i = 0; i < sNodes.length - 1; i++) {
      const a = sNodes[i], b = sNodes[i + 1];
      const flowAge = (sTime * 0.5 + i * 0.2) % 1;
      sCtx.beginPath();
      sCtx.moveTo(sc.width * a.x, sc.height * a.y);
      sCtx.lineTo(sc.width * b.x, sc.height * b.y);
      sCtx.strokeStyle = `rgba(0,212,170,0.2)`;
      sCtx.lineWidth = 2;
      sCtx.stroke();
      // Flowing dot
      sCtx.beginPath();
      sCtx.arc(
        sc.width * (a.x + (b.x - a.x) * flowAge),
        sc.height * (a.y + (b.y - a.y) * flowAge),
        4, 0, Math.PI * 2
      );
      sCtx.fillStyle = 'rgba(0,212,170,0.8)';
      sCtx.fill();
    }
    // Nodes
    sNodes.forEach(n => {
      sCtx.beginPath();
      sCtx.arc(sc.width * n.x, sc.height * n.y, 10, 0, Math.PI * 2);
      sCtx.fillStyle = n.color + '40';
      sCtx.fill();
      sCtx.beginPath();
      sCtx.arc(sc.width * n.x, sc.height * n.y, 6, 0, Math.PI * 2);
      sCtx.fillStyle = n.color;
      sCtx.fill();
      sCtx.fillStyle = 'rgba(255,255,255,0.7)';
      sCtx.font = '9px Inter';
      sCtx.textAlign = 'center';
      sCtx.fillText(n.label, sc.width * n.x, sc.height * n.y + 22);
    });
    sTime += 0.016;
    requestAnimationFrame(drawSpread);
  }
  drawSpread();
}

// ─── STORY BAR ANIMATION ───
const storyBarObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.story-bar').forEach(bar => {
        const w = bar.style.getPropertyValue('--w') || '0%';
        bar.style.setProperty('--actual-w', w);
        bar.style.cssText += `
          background: linear-gradient(90deg, var(--accent), var(--accent2));
          width: ${w};
          height: 100%;
          border-radius: 6px;
          position: absolute;
          left: 0; top: 0;
          display: flex; align-items: center;
          animation: none;
        `;
      });
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.story-item').forEach(el => storyBarObserver.observe(el));

// ─── SHARE FUNCTION ───
function sharesite() {
  if (navigator.share) {
    navigator.share({
      title: 'Planet Pulse — Tracking Earth\'s Health',
      text: 'Explore how pollution is degrading our planet\'s health. An immersive environmental intelligence platform.',
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Link copied to clipboard!');
    });
  }
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  // Story bars - immediate fill
  document.querySelectorAll('.story-bar').forEach(bar => {
    const w = getComputedStyle(bar).getPropertyValue('--w');
  });

  // Kick off animations for elements already in view
  document.querySelectorAll('.reveal-item').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) el.classList.add('revealed');
  });
});

console.log('%c🌍 PLANET PULSE', 'font-size:20px;font-weight:bold;color:#00d4aa;');
console.log('%cEnvironmental Intelligence Platform | Built for awareness', 'color:#666;');
