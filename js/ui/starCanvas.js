// ═══════════════════════════════════════════════
//  STAR CANVAS ENGINE — Звёздный фон + параллакс
// ═══════════════════════════════════════════════

export function initStarCanvas() {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, stars = [], shootingStars = [], animFrame;

  // Создать одну звезду
  function mkStar() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.2,
      alpha: Math.random() * 0.7 + 0.1,
      speed: Math.random() * 0.15 + 0.02,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
      twinkleDir: Math.random() > 0.5 ? 1 : -1,
      color: Math.random() > 0.85
        ? (Math.random() > 0.5 ? '#3fd2ff' : '#8a4fff')
        : '#ffffff',
    };
  }

  // Создать падающую звезду
  function mkShootingStar() {
    return {
      x: Math.random() * W * 0.7,
      y: Math.random() * H * 0.4,
      len: Math.random() * 120 + 60,
      speed: Math.random() * 8 + 6,
      alpha: 1,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
      life: 0,
      maxLife: Math.random() * 40 + 30,
    };
  }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    stars = Array.from({ length: 220 }, mkStar);
  }

  // Периодически добавлять падающие звёзды
  function spawnShootingStar() {
    if (Math.random() < 0.003) {
      shootingStars.push(mkShootingStar());
    }
  }

  function drawShootingStars() {
    shootingStars = shootingStars.filter(s => s.life < s.maxLife);
    shootingStars.forEach(s => {
      s.life++;
      s.alpha = 1 - s.life / s.maxLife;
      const dx = Math.cos(s.angle) * s.speed;
      const dy = Math.sin(s.angle) * s.speed;

      ctx.save();
      ctx.globalAlpha = s.alpha * 0.8;
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - dx * (s.len / s.speed), s.y - dy * (s.len / s.speed));
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, 'rgba(63,210,255,0.6)');
      grad.addColorStop(1, 'transparent');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - dx * (s.len / s.speed), s.y - dy * (s.len / s.speed));
      ctx.stroke();
      ctx.restore();

      s.x += dx;
      s.y += dy;
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Обычные звёзды
    stars.forEach(s => {
      // Мерцание
      s.alpha += s.twinkleSpeed * s.twinkleDir;
      if (s.alpha > 0.85 || s.alpha < 0.05) s.twinkleDir *= -1;
      // Дрейф вверх
      s.y -= s.speed;
      if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W; }

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.alpha;
      ctx.fill();

      // Свечение для ярких цветных звёзд
      if (s.color !== '#ffffff' && s.r > 0.8) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
        grad.addColorStop(0, s.color + '44');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = s.alpha * 0.5;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });

    // Падающие звёзды
    spawnShootingStar();
    drawShootingStars();

    animFrame = requestAnimationFrame(draw);
  }

  // Параллакс при движении мыши
  document.addEventListener('mousemove', e => {
    const cx = e.clientX / window.innerWidth - 0.5;
    const cy = e.clientY / window.innerHeight - 0.5;
    document.documentElement.style.setProperty('--parallax-x', `${cx * 30}px`);
    document.documentElement.style.setProperty('--parallax-y', `${cy * 20}px`);
    // Лёгкое смещение 1/3 звёзд
    stars.forEach((s, i) => {
      if (i % 3 === 0) {
        s.x += cx * 0.3;
        s.y += cy * 0.2;
      }
    });
  });

  window.addEventListener('resize', () => {
    resize();
    stars = Array.from({ length: 220 }, mkStar);
  });

  init();
  draw();
}
