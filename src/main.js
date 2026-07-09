const platforms = Array.from({ length: 99 }, () => ({}));
const platformHeight = 2; // Height of platforms in svh
const platformStartWidth = 14;
const platformEndWidth = 4;
const sheepSvg = `
  <svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 36 36"
  >
    <path
      fill="#eee"
      d="M36 21q0-11-15-11h-3q-2-3-8-3C6 7 0 13 0 18q1 6 8 5 0 5 3 7c0 1 2 6 4 6l3-3 8-1q0 4 2 4c2 0 4-5 5-7q3-2 3-8"
    />
    <circle cx="4.5" cy="15.8" r="1.5"/>
    <path
      fill="#fc5"
      d="M18 4q6 2 4 9-5 6-10 4-3-2 1-2t5-3q-1-4-6-2c-1 1-6 0-5-1q2-5 11-5"
    />
  </svg>
`;

let gameStarted = false;

const worldLayer = document.createElement('div');
document.body.append(worldLayer);
const sheepWrap = document.createElement('div');
sheepWrap.innerHTML = sheepSvg;
const sheep = sheepWrap.firstElementChild;
worldLayer.append(sheepWrap);
const grassStrip = document.createElement('div');
worldLayer.append(grassStrip);
b.style.margin = '0';
b.style.minHeight = '100svh';
b.style.overflow = 'hidden';
b.style.background = '#8de';

const horizontalRange = 25;
let sheepX = 0;
const grassY = 4;
let sheepY = grassY;
let heldKeys = '';
const sheepSpeed = 1;
const sheepRadius = 2;
const gravity = .09;
const jumpVelocity = 2.9;
const platformSpacing = 40;
const cameraDeadzoneTop = 60;
const cameraDeadzoneBottom = 15;
let sheepVY = jumpVelocity;
let cameraY = 0;
let sheepFacing = 1;
let sheepTilt = 0;
let backgroundY;
const backgroundStep = 1;

worldLayer.style.position = 'fixed';
worldLayer.style.left = '0';
worldLayer.style.bottom = '0';
worldLayer.style.width = '100%';
worldLayer.style.height = '100%';
worldLayer.style.pointerEvents = 'none';
worldLayer.style.willChange = 'transform';

grassStrip.style.position = 'absolute';
grassStrip.style.left = '0';
grassStrip.style.bottom = '0';
grassStrip.style.width = '100%';
grassStrip.style.height = `${grassY}svh`;
grassStrip.style.background = '#3a3';
grassStrip.style.pointerEvents = 'none';

sheepWrap.style.position = 'absolute';
sheepWrap.style.left = '50%';
sheepWrap.style.bottom = '0';
sheepWrap.style.transformOrigin = 'center';
sheepWrap.style.willChange = 'transform';
sheep.style.transformOrigin = 'center';
sheep.style.transition = 'transform .2s';
sheep.style.width = '7svh';
sheep.style.height = '7svh';

platforms.forEach((platform, i) => {
  platform.width = platformStartWidth - (platformStartWidth - platformEndWidth) * i / (platforms.length - 1);
  platform.x = -horizontalRange + Math.random() * (horizontalRange * 2);
  platform.y = (i + 1) * platformSpacing;
  platform.top = platform.y + platformHeight;
  platform.el = document.createElement('div');
  platform.el.style.position = 'absolute';
  platform.el.style.left = `calc(50% + ${platform.x - platform.width / 2}svh)`;
  platform.el.style.bottom = `${platform.y}svh`;
  platform.el.style.width = `${platform.width}svh`;
  platform.el.style.height = `${platformHeight}svh`;
  platform.el.style.background = '#852';
  worldLayer.append(platform.el);
});

onkeydown = e => heldKeys += e.key;
onkeyup = e => heldKeys = heldKeys.replaceAll(e.key, '');

const setSheepPosition = () => {
  const moveX = heldKeys.includes('wR') - heldKeys.includes('wL');
  sheepX += sheepSpeed * moveX;
  sheepTilt = moveX * 15;
  if (moveX) sheepFacing = -moveX;
  sheepX = sheepX < -horizontalRange ? -horizontalRange : sheepX > horizontalRange ? horizontalRange : sheepX;

  const prevY = sheepY;
  sheepVY -= gravity;
  const nextY = sheepY + sheepVY;
  sheepY = nextY;

  if (sheepY <= grassY || platforms.some(platform => {
    const overlapsX = Math.abs(sheepX - platform.x) < platform.width / 2 + sheepRadius;
    return overlapsX && prevY >= platform.top && sheepY <= platform.top;
  })) {
    sheepVY = jumpVelocity;
  }

  const sheepScreenY = sheepY - cameraY;
  if (sheepScreenY > cameraDeadzoneTop) {
    cameraY += sheepScreenY - cameraDeadzoneTop;
  } else if (sheepScreenY < cameraDeadzoneBottom) {
    cameraY -= cameraDeadzoneBottom - sheepScreenY;
  }
  if (cameraY < 0) cameraY = 0;
};

const renderSheep = () => {
  sheepWrap.style.transform = `translate(calc(${sheepX}svh - 50%),${-sheepY}svh) scale(${sheepFacing},1)`;
  sheep.style.transform = `rotate(${sheepTilt * sheepFacing}deg)`;
};

const renderPlatforms = () => {
  worldLayer.style.transform = `translateY(${cameraY}svh)`;
};

const renderBackground = () => {
  const nextBackgroundY = Math.round(cameraY / backgroundStep) * backgroundStep;
  if (nextBackgroundY !== backgroundY) {
    backgroundY = nextBackgroundY;
    const t = Math.min(1, backgroundY / 800);
    const r = Math.round(141 - 92 * t);
    const g = Math.round(221 - 201 * t);
    const bl = Math.round(238 - 218 * t);
    b.style.background = `rgb(${r},${g},${bl})`;
  }
};

const update = () => {
  setSheepPosition();
  renderSheep();
  renderPlatforms();
  renderBackground();
  requestAnimationFrame(update);
};

update();