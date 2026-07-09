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

const sheep = document.createElement('svg');
sheep.innerHTML = sheepSvg;
document.body.append(sheep);
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
let sheepY = 0;
let heldKeys = '';
const sheepSpeed = 1;
const gravity = .06;
const jumpVelocity = 2.8;
const sheepRadius = 4;
const platformBaseY = 60;
const platformSpacing = 60;
const cameraFollowY = 70;
let sheepVY = jumpVelocity;
let cameraY = 0;

sheep.style.position = 'fixed';
sheep.style.bottom = '4vmin';
sheep.style.transform = `translate(50vw,0) translateX(${-sheepRadius}vmin)`;

platforms.forEach((platform, i) => {
  platform.x = 10 + Math.random() * (90 - platformWidth);
  platform.y = platformBaseY + i * platformSpacing;
  platform.el = document.createElement('div');
  platform.el.style.position = 'fixed';
  platform.el.style.left = `${platform.x}vw`;
  platform.el.style.bottom = `${platform.y}vmin`;
  platform.el.style.width = `${platformWidth}vmin`;
  platform.el.style.height = `${platformHeight}vmin`;
  platform.el.style.background = '#3b2a1a';
  b.append(platform.el);
});

onkeydown = e => heldKeys += e.key;
onkeyup = e => heldKeys = heldKeys.replaceAll(e.key, '');

const setSheepPosition = () => {
  sheepX += sheepSpeed * (heldKeys.includes('wR') - heldKeys.includes('wL'));
  sheepX = sheepX < 3 ? 3 : sheepX > 97 ? 97 : sheepX;

  const prevY = sheepY;
  sheepVY -= gravity;
  sheepY += sheepVY;

  if (sheepVY < 0) {
    const hitPlatform = platforms.find(platform => {
      const centerDistX = Math.abs(sheepX - (platform.x + platformWidth / 2));
      const maxCenterDistX = platformWidth / 2 + sheepRadius;
      const prevBottom = prevY + sheepRadius;
      const bottom = sheepY + sheepRadius;
      const platformTop = platform.y + platformHeight;
      return centerDistX < maxCenterDistX
        && prevBottom >= platformTop
        && bottom <= platformTop;
    });

    if (hitPlatform) {
      sheepY = hitPlatform.y + platformHeight - sheepRadius;
      sheepVY = jumpVelocity;
      return;
    }
  }

  if (sheepY <= 0) {
    sheepY = 0;
    sheepVY = jumpVelocity;
  }

  cameraY = Math.max(0, sheepY - cameraFollowY);
};

const renderSheep = () => {
  sheep.style.transform = `translate(${sheepX}vw,${cameraY - sheepY}vmin) translateX(${-sheepRadius}vmin)`;
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