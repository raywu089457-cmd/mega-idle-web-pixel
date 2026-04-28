/**
 * Canvas Renderer — Visual representation of the game world
 * Tier 5 (visual layer)
 *
 * Renders:
 * - Kingdom background and buildings
 * - Floating resource numbers
 * - Hero sprites
 * - Exploration progress
 */

const CanvasRenderer = (function () {
  // ─── Canvas Setup ─────────────────────────────────────────────────────────

  let canvas = null;
  let ctx = null;
  let width = 0;
  let height = 0;
  let animationFrame = null;
  let floatingNumbers = []; // { text, x, y, color, alpha, vy, age }

  // ─── Drawing Constants ─────────────────────────────────────────────────────

  const COLORS = {
    bg: '#1a1a2e',
    bgGradientEnd: '#0f3460',
    gold: '#FFD700',
    purple: '#9B59B6',
    green: '#27AE60',
    red: '#DC143C',
    text: '#F5F5DC',
    textDark: '#2C1810',
    panel: 'rgba(22, 33, 62, 0.9)',
    border: '#FFD700',
  };

  const HERO_ICONS = {
    warrior: '⚔️',
    mage: '🧙',
    rogue: '🗡️',
    cleric: '⛪',
    ranger: '🏹',
  };

  // ─── Initialization ─────────────────────────────────────────────────────────

  function init() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) {
      console.warn('[CanvasRenderer] Canvas not found');
      return;
    }

    ctx = canvas.getContext('2d');
    resizeCanvas();

    // Listen for resize
    window.addEventListener('resize', resizeCanvas);

    // Listen for game events
    document.addEventListener('game_tick', onGameTick);

    // Start render loop
    startRenderLoop();
  }

  function resizeCanvas() {
    const container = document.getElementById('game-canvas-container');
    if (!container || !canvas) return;

    width = container.clientWidth;
    height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;
  }

  // ─── Render Loop ─────────────────────────────────────────────────────────────

  function startRenderLoop() {
    if (animationFrame) return;
    render();
  }

  function stopRenderLoop() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  function render() {
    animationFrame = requestAnimationFrame(render);

    // Clear
    drawBackground();

    // Draw kingdom center
    drawKingdomCenter();

    // Draw monuments (resource producers)
    drawMonument();

    // Draw wandering heroes
    drawWanderingHeroes();

    // Draw territory heroes
    drawTerritoryHeroes();

    // Draw exploration progress
    drawExplorationProgress();

    // Draw floating numbers
    drawFloatingNumbers();

    // Update floating numbers
    updateFloatingNumbers();
  }

  // ─── Background ─────────────────────────────────────────────────────────────

  function drawBackground() {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, COLORS.bg);
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, COLORS.bgGradientEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw grid pattern for medieval feel
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw decorative stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 137.5) % width;
      const y = (i * 73.3) % height;
      const size = (i % 3) + 1;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ─── Kingdom Center ────────────────────────────────────────────────────────

  function drawKingdomCenter() {
    const centerX = width / 2;
    const centerY = height / 2;

    // Castle base
    ctx.fillStyle = COLORS.panel;
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 3;

    // Main castle shape
    ctx.beginPath();
    ctx.roundRect(centerX - 80, centerY - 60, 160, 120, 10);
    ctx.fill();
    ctx.stroke();

    // Castle towers
    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.beginPath();
    ctx.roundRect(centerX - 90, centerY - 80, 40, 40, 5);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(centerX + 50, centerY - 80, 40, 40, 5);
    ctx.fill();
    ctx.stroke();

    // Castle flag
    ctx.fillStyle = COLORS.red;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 60);
    ctx.lineTo(centerX + 30, centerY - 45);
    ctx.lineTo(centerX, centerY - 30);
    ctx.fill();

    // Castle icon
    ctx.font = '40px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏰', centerX, centerY + 10);

    // Label
    ctx.font = '14px sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.fillText('Kingdom Center', centerX, centerY + 70);
  }

  // ─── Monument ───────────────────────────────────────────────────────────────

  function drawMonument() {
    const x = width / 2 - 180;
    const y = height / 2 - 50;

    // Glow effect
    const time = Date.now() / 1000;
    const glowIntensity = 0.3 + Math.sin(time * 2) * 0.1;

    ctx.shadowColor = COLORS.purple;
    ctx.shadowBlur = 20 * glowIntensity;

    // Monument base
    ctx.fillStyle = COLORS.panel;
    ctx.strokeStyle = COLORS.purple;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 30, y - 30, 60, 80, 8);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Monument crystal
    ctx.font = '36px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💎', x, y + 10);

    // Label
    ctx.font = '12px sans-serif';
    ctx.fillStyle = COLORS.purple;
    ctx.fillText('Ancient Monument', x, y + 50);

    // Production indicator
    const matTypes = ResourceSystem.getMaterialTypes();
    const mat = matTypes[Math.floor(time) % matTypes.length];
    const config = ResourceSystem.getConfig(mat);
    ctx.fillText(`+1-3 ${config.icon}/s`, x, y + 65);
  }

  // ─── Heroes ───────────────────────────────────────────────────────────────

  function drawWanderingHeroes() {
    const heroes = HeroSystem.getWanderingHeroes();
    const startX = width - 150;
    const y = height / 2;

    // Label
    ctx.font = '12px sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'left';
    ctx.fillText('Wandering Heroes', startX, y - 80);

    heroes.forEach((hero, i) => {
      const x = startX + (i % 2) * 60;
      const heroY = y - 40 + Math.floor(i / 2) * 70;

      // Hero background
      ctx.fillStyle = COLORS.panel;
      ctx.strokeStyle = getHeroBorderColor(hero.status);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - 25, heroY - 25, 50, 60, 5);
      ctx.fill();
      ctx.stroke();

      // Hero icon
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(getHeroIcon(hero.class), x, heroY + 5);

      // Status indicator
      ctx.font = '10px sans-serif';
      ctx.fillStyle = getStatusColor(hero.status);
      ctx.fillText(getStatusText(hero.status), x, heroY + 30);

      // Level
      ctx.fillStyle = COLORS.text;
      ctx.fillText(`Lv.${hero.level}`, x, heroY + 42);
    });

    if (heroes.length === 0) {
      ctx.font = '12px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'left';
      ctx.fillText('No visitors...', startX, y - 40);
    }
  }

  function drawTerritoryHeroes() {
    const heroes = HeroSystem.getTerritoryHeroes();
    const startX = 50;
    const y = height / 2;

    // Label
    ctx.font = '12px sans-serif';
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'left';
    ctx.fillText('Your Heroes', startX, y - 80);

    heroes.forEach((hero, i) => {
      const heroY = y - 40 + i * 65;

      // Hero card background
      ctx.fillStyle = COLORS.panel;
      ctx.strokeStyle = getHeroBorderColor(hero.status);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(startX - 20, heroY - 25, 130, 60, 5);
      ctx.fill();
      ctx.stroke();

      // Hero icon
      ctx.font = '24px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(getHeroIcon(hero.class), startX - 5, heroY + 5);

      // Name
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = COLORS.gold;
      ctx.textAlign = 'left';
      ctx.fillText(hero.name, startX + 25, heroY - 10);

      // Level & Class
      ctx.font = '11px sans-serif';
      ctx.fillStyle = COLORS.text;
      ctx.fillText(`Lv.${hero.level} ${getClassName(hero.class)}`, startX + 25, heroY + 5);

      // Stats
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(`HP:${hero.hp}/${hero.maxHp} ATK:${hero.atk} DEF:${hero.def}`, startX + 25, heroY + 20);

      // Status
      ctx.font = '10px sans-serif';
      ctx.fillStyle = getStatusColor(hero.status);
      ctx.textAlign = 'right';
      ctx.fillText(getStatusText(hero.status), startX + 105, heroY - 10);

      // HP bar
      const hpPercent = hero.hp / hero.maxHp;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(startX + 25, heroY + 25, 80, 6);
      ctx.fillStyle = hpPercent > 0.5 ? COLORS.green : hpPercent > 0.25 ? COLORS.gold : COLORS.red;
      ctx.fillRect(startX + 25, heroY + 25, 80 * hpPercent, 6);
    });

    if (heroes.length === 0) {
      ctx.font = '12px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'left';
      ctx.fillText('No heroes yet!', startX, y - 40);
    }
  }

  // ─── Exploration Progress ────────────────────────────────────────────────

  function drawExplorationProgress() {
    const explorations = MapSystem.getActiveExplorations();
    if (explorations.length === 0) return;

    const startX = 50;
    const startY = height - 120;

    ctx.font = '12px sans-serif';
    ctx.fillStyle = COLORS.gold;
    ctx.textAlign = 'left';
    ctx.fillText('Active Explorations', startX, startY);

    explorations.forEach((exp, i) => {
      const y = startY + 20 + i * 35;

      // Progress bar background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(startX, y, 200, 20);

      // Progress bar fill
      const progress = Math.min(exp.progress, 100);
      const gradient = ctx.createLinearGradient(startX, y, startX + 200, y);
      gradient.addColorStop(0, COLORS.green);
      gradient.addColorStop(1, '#2ECC71');
      ctx.fillStyle = gradient;
      ctx.fillRect(startX, y, 200 * (progress / 100), 20);

      // Border
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, y, 200, 20);

      // Text
      ctx.font = '10px sans-serif';
      ctx.fillStyle = COLORS.textDark;
      ctx.textAlign = 'center';
      ctx.fillText(`${exp.zoneName} - ${Math.floor(progress)}%`, startX + 100, y + 14);
    });
  }

  // ─── Floating Numbers ─────────────────────────────────────────────────────

  function addFloatingNumber(text, x, y, color = COLORS.gold) {
    floatingNumbers.push({
      text,
      x,
      y,
      color,
      alpha: 1,
      vy: -2,
      age: 0,
    });
  }

  function updateFloatingNumbers() {
    floatingNumbers = floatingNumbers.filter(fn => {
      fn.y += fn.vy;
      fn.age++;
      fn.alpha = Math.max(0, 1 - fn.age / 60);
      return fn.age < 60;
    });
  }

  function drawFloatingNumbers() {
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    floatingNumbers.forEach(fn => {
      ctx.globalAlpha = fn.alpha;
      ctx.fillStyle = fn.color;
      ctx.fillText(fn.text, fn.x, fn.y);
    });

    ctx.globalAlpha = 1;
  }

  // ─── Event Handlers ────────────────────────────────────────────────────────

  function onGameTick(e) {
    // Add random floating number for material production
    const matTypes = ResourceSystem.getMaterialTypes();
    const mat = matTypes[Math.floor(Math.random() * matTypes.length)];
    const produced = Math.floor(Math.random() * 3) + 1;
    const config = ResourceSystem.getConfig(mat);

    // Random position for floating number
    const x = width / 2 - 150 + Math.random() * 100;
    const y = height / 2 + Math.random() * 50;
    addFloatingNumber(`+${produced}`, x, y, COLORS.gold);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function getHeroIcon(heroClass) {
    return HERO_ICONS[heroClass] || '👤';
  }

  function getClassName(heroClass) {
    const names = {
      warrior: 'Warrior',
      mage: 'Mage',
      rogue: 'Rogue',
      cleric: 'Cleric',
      ranger: 'Ranger',
    };
    return names[heroClass] || heroClass;
  }

  function getStatusColor(status) {
    const colors = {
      idle: '#27AE60',
      exploring: '#3498DB',
      resting: '#95A5A6',
      wandering: '#9B59B6',
      shopping: '#F39C12',
      fighting: '#E74C3C',
      leaving: '#7F8C8D',
    };
    return colors[status] || COLORS.text;
  }

  function getStatusText(status) {
    const texts = {
      idle: 'Idle',
      exploring: 'Exploring',
      resting: 'Resting',
      wandering: 'Wandering',
      shopping: 'Shopping',
      fighting: 'Fighting',
      leaving: 'Leaving',
    };
    return texts[status] || status;
  }

  function getHeroBorderColor(status) {
    const colors = {
      idle: '#27AE60',
      exploring: '#3498DB',
      resting: '#95A5A6',
      fighting: '#E74C3C',
    };
    return colors[status] || 'rgba(255, 215, 0, 0.3)';
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  return {
    init,
    startRenderLoop,
    stopRenderLoop,
    addFloatingNumber,
  };
})();

// Auto-initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure canvas is in DOM
  setTimeout(() => CanvasRenderer.init(), 100);
});
