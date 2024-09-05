const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let width, height;
let cursorX, cursorY;
let darknessLevel = 0;
let tendrils = [];
let phrases = [];
let lastPhraseTime = 0;
let recentPhrases = [];
let brightTransitionTime = 0;
let transitionEffect = { active: false, duration: 0, startTime: 0 };
const orbitRadius = 120;
const shadowRadius = 110;

const negativeThoughts = [
  "I've failed them",
  "I'm not enough",
  "I can't do this",
  "What's the point?",
  "Nobody understands",
  "I'm always messing up",
  "I'll never be good enough",
  "Everything is my fault",
  "I'm so stupid",
  "I'm a disappointment",
  "I'm wasting my life",
  "I'll always be alone",
  "I don't deserve happiness",
  "I'm a burden to everyone",
  "Things will never get better",
  "I'm trapped",
  "No one cares",
  "It's hopeless",
  "I'm worthless",
  "I'll always be a failure",
  "I'm unlovable",
  "I don't belong anywhere",
  "I'm weak",
  "I'll never succeed",
  "Everything is falling apart",
];

const positiveThoughts = [
  "This is possible",
  "There's a way",
  "I can learn from this",
  "One step at a time",
  "I am resilient",
  "I have overcome before",
  "I am worthy",
  "Progress, not perfection",
  "I choose to keep going",
  "This too shall pass",
  "I am enough",
  "Every day is a new chance",
  "I can handle this",
  "I believe in myself",
  "Small steps lead to big changes",
  "I'm growing stronger",
  "I have value",
  "I can adapt",
  "I'm making progress",
  "I'm capable of change",
  "My efforts matter",
  "I deserve joy",
  "I'm finding my way",
  "I have inner strength",
  "Better days are coming",
];

class Tendril {
  constructor(x, y) {
    this.segments = [];
    this.numSegments = 15;
    this.segmentLength = 8;
    this.baseSpeed = 0.01 + Math.random() * 0.02;
    this.turnSpeed = 0.03;
    this.wiggleAmplitude = 0.05;
    this.angle = Math.atan2(y - cursorY, x - cursorX);
    this.behavior = this.randomBehavior();

    let currentX = x;
    let currentY = y;
    for (let i = 0; i < this.numSegments; i++) {
      this.segments.push({ x: currentX, y: currentY });
      currentX += (Math.random() - 0.5) * this.segmentLength;
      currentY += (Math.random() - 0.5) * this.segmentLength;
    }
  }

  randomBehavior() {
    const behaviors = ["normal", "aggressive", "hesitant", "erratic"];
    return behaviors[Math.floor(Math.random() * behaviors.length)];
  }

  update() {
    const dx = this.segments[0].x - cursorX;
    const dy = this.segments[0].y - cursorY;
    const distanceToCursor = Math.sqrt(dx * dx + dy * dy);
    let speedMultiplier = Math.min(2, distanceToCursor / orbitRadius);

    // Adjust behavior based on tendril type
    switch (this.behavior) {
      case "aggressive":
        speedMultiplier *= 1.5;
        this.turnSpeed = 0.05;
        break;
      case "hesitant":
        speedMultiplier *= 0.7;
        this.turnSpeed = 0.02;
        break;
      case "erratic":
        speedMultiplier *= 1 + (Math.random() - 0.5) * 0.5;
        this.wiggleAmplitude = 0.1;
        break;
    }

    this.angle +=
      this.baseSpeed *
      (distanceToCursor < orbitRadius * 1.2 ? 2 : speedMultiplier);

    const targetX = cursorX + Math.cos(this.angle) * orbitRadius;
    const targetY = cursorY + Math.sin(this.angle) * orbitRadius;

    const head = this.segments[0];
    head.x += (targetX - head.x) * this.turnSpeed;
    head.y += (targetY - head.y) * this.turnSpeed;

    head.x += (Math.random() - 0.5) * this.wiggleAmplitude;
    head.y += (Math.random() - 0.5) * this.wiggleAmplitude;

    for (let i = 1; i < this.numSegments; i++) {
      const segment = this.segments[i];
      const prevSegment = this.segments[i - 1];

      const dx = prevSegment.x - segment.x;
      const dy = prevSegment.y - segment.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > this.segmentLength) {
        const ratio = (distance - this.segmentLength) / distance;
        segment.x += dx * ratio;
        segment.y += dy * ratio;
      }
    }
  }

  draw() {
    ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(this.segments[0].x, this.segments[0].y);

    for (const segment of this.segments) {
      ctx.lineTo(segment.x, segment.y);
    }

    ctx.stroke();

    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.beginPath();
    ctx.arc(this.segments[0].x, this.segments[0].y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Phrase {
  constructor(text, x, y, isPositive) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.opacity = 1;
    this.fadeSpeed = 0.0015;
    this.isPositive = isPositive;
  }

  update() {
    this.opacity -= this.fadeSpeed;
    return this.opacity > 0;
  }

  draw() {
    ctx.font = this.isPositive ? "16px Arial" : "bold 16px Arial";
    ctx.fillStyle = this.isPositive
      ? `rgba(100, 100, 100, ${this.opacity})`
      : `rgba(0, 0, 0, ${this.opacity})`;
    ctx.fillText(this.text, this.x, this.y);
  }
}

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

function init() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  canvas.addEventListener("mousemove", updateCursorPosition);
  canvas.addEventListener("touchmove", updateTouchPosition);

  cursorX = width / 2;
  cursorY = height / 2;

  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    const x = cursorX + Math.cos(angle) * (orbitRadius * 2);
    const y = cursorY + Math.sin(angle) * (orbitRadius * 2);
    tendrils.push(new Tendril(x, y));
  }

  gameLoop();
}

function updateCursorPosition(e) {
  cursorX = e.clientX;
  cursorY = e.clientY;
}

function updateTouchPosition(e) {
  e.preventDefault();
  cursorX = e.touches[0].clientX;
  cursorY = e.touches[0].clientY;
}

function gameLoop(timestamp) {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  updateDarkness();
  applyDarkening();

  tendrils.forEach((tendril) => {
    tendril.update();
    tendril.draw();
  });

  updateAndDrawPhrases(timestamp);

  maybeSpawnPhrase(timestamp);

  drawCursor();

  if (transitionEffect.active) {
    applyTransitionEffect(timestamp);
  }

  requestAnimationFrame(gameLoop);
}

function updateDarkness() {
  const encirclingTendrils = tendrils.filter((tendril) => {
    const dx = tendril.segments[0].x - cursorX;
    const dy = tendril.segments[0].y - cursorY;
    return Math.sqrt(dx * dx + dy * dy) < orbitRadius * 1.2;
  }).length;

  const encirclingRatio = encirclingTendrils / tendrils.length;
  const targetDarkness = Math.max(0, (encirclingRatio - 0.5) * 2);

  const previousDarkness = darknessLevel;
  darknessLevel += (targetDarkness - darknessLevel) * 0.05;

  if (
    (previousDarkness <= 0.5 && darknessLevel > 0.5) ||
    (previousDarkness > 0.5 && darknessLevel <= 0.5)
  ) {
    startTransitionEffect();
  }

  if (previousDarkness > 0.5 && darknessLevel <= 0.5) {
    brightTransitionTime = performance.now();
    phrases = phrases.filter((phrase) => phrase.isPositive);
  }
}

function applyDarkening() {
  if (darknessLevel > 0) {
    const gradient = ctx.createRadialGradient(
      cursorX,
      cursorY,
      shadowRadius * 0.7,
      cursorX,
      cursorY,
      shadowRadius
    );
    gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${0.7 * darknessLevel})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
}

function updateAndDrawPhrases(timestamp) {
  phrases = phrases.filter((phrase) => phrase.update());
  phrases.forEach((phrase) => phrase.draw());
}

function maybeSpawnPhrase(timestamp) {
  if (timestamp - lastPhraseTime > 2000) {
    // 2 seconds between phrases
    const isDark = darknessLevel > 0.5;

    if (!isDark && timestamp - brightTransitionTime < 2000) {
      return; // Delay positive phrases after brightening
    }

    const margin = 50; // Margin from the edges of the canvas
    const x = Math.random() * (width - 2 * margin) + margin;
    const y = Math.random() * (height - 2 * margin) + margin;

    const thoughtArray = isDark ? negativeThoughts : positiveThoughts;
    let text;
    do {
      text = thoughtArray[Math.floor(Math.random() * thoughtArray.length)];
    } while (recentPhrases.includes(text));

    recentPhrases.push(text);
    if (recentPhrases.length > 7) {
      recentPhrases.shift();
    }

    phrases.push(new Phrase(text, x, y, !isDark));
    lastPhraseTime = timestamp;
  }
}

function drawCursor() {
  ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
  ctx.beginPath();
  ctx.arc(cursorX, cursorY, 8, 0, Math.PI * 2);
  ctx.fill();
}

function startTransitionEffect() {
  transitionEffect.active = true;
  transitionEffect.duration = 500; // 500ms duration
  transitionEffect.startTime = performance.now();
}

function applyTransitionEffect(timestamp) {
  const elapsedTime = timestamp - transitionEffect.startTime;
  const progress = Math.min(elapsedTime / transitionEffect.duration, 1);

  // Screen shake effect
  const shakeAmount = 5 * (1 - progress);
  const shakeX = (Math.random() - 0.5) * shakeAmount;
  const shakeY = (Math.random() - 0.5) * shakeAmount;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // Blur effect
  const blurAmount = 10 * (1 - progress);
  ctx.filter = `blur(${blurAmount}px)`;

  // Redraw everything with the applied effects
  ctx.clearRect(-shakeX, -shakeY, width, height);
  applyDarkening();
  tendrils.forEach((tendril) => tendril.draw());
  phrases.forEach((phrase) => phrase.draw());
  drawCursor();

  ctx.restore();

  if (progress >= 1) {
    transitionEffect.active = false;
  }
}

init();
