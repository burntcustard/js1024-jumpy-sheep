const platforms = Array.from({ length: 99 }, () => ({}));
const platformHeight = 4; // Height of platforms in vmin
const platformWidth = platformHeight * 4; // Width based on platformHeight
const sheepSvg = `
  <svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 36 36"
    style="width: 9vmin; height: 9vmin;"
  >
    <path
      fill="#fa3"
      d="M12 4q8-1 8 6-2 7-8 7-2-1 1-2 3 0 3-5-1-3-6 1-3 2-4-1-1-4 6-6"
    />
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

const sheepWrap = document.createElement('div');
sheepWrap.innerHTML = sheepSvg;
const sheep = sheepWrap.firstElementChild;
document.body.append(sheepWrap);
document.documentElement.style.height = '100%';
b.style.margin = '0';
b.style.minHeight = '100vh';
b.style.width = '100vw';
b.style.overflow = 'hidden';
b.style.background = 'linear-gradient(0deg, #3a3 0.1%, #8DE .1%, #314)';
b.style.backgroundSize = '100% 5000vmin';
b.style.backgroundRepeat = 'no-repeat';
b.style.backgroundPosition = 'bottom center';

let sheepX = 50;
const grassY = 6;
let sheepY = grassY;
let heldKeys = '';
const sheepSpeed = 1;
const sheepRadius = 2;
const gravity = .06;
const jumpVelocity = 2.8;
const platformSpacing = 60;
const cameraDeadzoneTop = 70;
const cameraDeadzoneBottom = 30;
let sheepVY = jumpVelocity;
let cameraY = 0;
let sheepFacing = 1;
let sheepTilt = 0;

sheepWrap.style.position = 'fixed';
sheepWrap.style.left = '0';
sheepWrap.style.bottom = '0';
sheepWrap.style.transformOrigin = 'center';
sheep.style.transformOrigin = 'center';
sheep.style.transition = 'transform .2s';

platforms.forEach((platform, i) => {
  platform.x = 10 + Math.random() * (90 - platformWidth);
  platform.y = (i + 1) * platformSpacing;
  platform.top = platform.y + platformHeight;
  platform.el = document.createElement('div');
  platform.el.style.position = 'fixed';
  platform.el.style.left = `${platform.x}vw`;
  platform.el.style.bottom = `${platform.y}vmin`;
  platform.el.style.width = `${platformWidth}vmin`;
  platform.el.style.height = `${platformHeight}vmin`;
  platform.el.style.background = '#852';
  b.append(platform.el);
});

onkeydown = e => heldKeys += e.key;
onkeyup = e => heldKeys = heldKeys.replaceAll(e.key, '');

const setSheepPosition = () => {
  const moveX = heldKeys.includes('wR') - heldKeys.includes('wL');
  sheepX += sheepSpeed * moveX;
  sheepTilt = moveX * 15;
  if (moveX) sheepFacing = -moveX;
  sheepX = sheepX < 3 ? 3 : sheepX > 97 ? 97 : sheepX;

  const prevY = sheepY;
  sheepVY -= gravity;
  const nextY = sheepY + sheepVY;
  sheepY = nextY;

  if (sheepY <= grassY || platforms.some(platform => {
    const overlapsX = sheepX > platform.x - sheepRadius
      && sheepX < platform.x + platformWidth + sheepRadius;
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
  sheepWrap.style.transform = `translate(calc(${sheepX}vw - 50%),${cameraY - sheepY}vmin) scale(${sheepFacing},1)`;
  sheep.style.transform = `rotate(${sheepTilt * sheepFacing}deg)`;
};

const renderPlatforms = () => {
  platforms.forEach(platform => {
    platform.el.style.bottom = `${platform.y - cameraY}vmin`;
  });
};

const renderBackground = () => {
  b.style.backgroundPosition = `center calc(100% + ${cameraY}vmin)`;
};

const update = () => {
  setSheepPosition();
  renderSheep();
  renderPlatforms();
  renderBackground();
  requestAnimationFrame(update);
};

update();