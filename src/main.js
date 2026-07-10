const platformHeight = 2; // Height of platforms in svh
const platformStartWidth = 14;
const platformEndWidth = 4;
const horizontalRange = 25;
const platformSpacing = 40;
const sheepSize = 8;
// id="s" instead of 'parent.children[0]' is good to avoid square brackets entirely
const sheepSvg = `
  <svg viewbox="0 0 36 36" id="s">
    <path
      fill="#eee"
      d="M36 21q0-11-19-11-2-4-8-3C5 8-1 13 0 18q1 6 8 5 0 5 3 7q2 6 4 6l3-3 8-1l2 4c2 1 4-5 5-7q3-2 3-8"
    />
    <path d="M6 15.8a1.5 1.5 0 1 1-3 0a1.5 1.5 0 1 1 3 0"/>
    <path
      fill="#fc5"
      d="M18 4q6 2 4 9-5 6-10 4-3-2 1-2t5-3q-1-4-6-2q-3 1-5-1q2-5 11-5"
    />
  </svg>
`;

const worldLayer = document.createElement('div');
const platforms = [...Array(99)].map((_,i) => {
  const width = platformStartWidth - (platformStartWidth - platformEndWidth) * i / 98;
  const x = -horizontalRange + Math.random() * (horizontalRange * 2);
  const y = (i + 1) * platformSpacing;
  const el = document.createElement('div');
  el.style.position = 'absolute';
  el.style.left = '50%';
  el.style.transform = `translate(${x - width / 2}svh, 0)`;
  el.style.bottom = `${y}svh`;
  el.style.width = `${width}svh`;
  el.style.height = `${platformHeight}svh`;
  el.style.background = '#852';
  worldLayer.append(el);
  return { width, x, top: y + platformHeight };
});
const sheepWrap = document.createElement('div');
const grassStrip = document.createElement('div');

let sheepX = 0;
const grassY = 4;
let sheepY = grassY;
let heldKeys = '';
const sheepSpeed = 1;
const sheepRadius = 2;
const gravity = .09;
const jumpVelocity = 2.9;
const cameraDeadzoneTop = 60;
const cameraDeadzoneBottom = 10;
let sheepVY = jumpVelocity;
let cameraY = 0;
let sheepFacing = 1;
let sheepTilt = 0;

a.append(worldLayer);
sheepWrap.innerHTML = sheepSvg;
worldLayer.append(sheepWrap);
worldLayer.append(grassStrip);
a.style.margin = '0';
a.style.height = '100svh';

worldLayer.style.position = 'fixed';
worldLayer.style.left = '0';
worldLayer.style.bottom = '0';
worldLayer.style.width = '100%';
worldLayer.style.height = '100%';

grassStrip.style.position = 'absolute';
grassStrip.style.left = '0';
grassStrip.style.bottom = '0';
grassStrip.style.width = '100%';
grassStrip.style.height = `${grassY}svh`;
grassStrip.style.background = '#3a3';

sheepWrap.style.position = 'absolute';
sheepWrap.style.left = '50%';
sheepWrap.style.bottom = '0';
s.style.transition = 'transform .2s';
s.style.width = s.style.height = `${sheepSize}svh`;

const update = () => {
  // Set sheep position
  // 'gh' and 'L' appear in 'ArrowRight' and 'ArrowLeft'. We avoid 'R'
  // because that character does not appear in the rest of our code
  const moveX = heldKeys.includes('gh') - heldKeys.includes('L');
  sheepX += sheepSpeed * moveX;
  sheepTilt = moveX * 15;
  if (moveX) sheepFacing = -moveX;
  sheepX = sheepX < -horizontalRange ? -horizontalRange : sheepX > horizontalRange ? horizontalRange : sheepX;
  sheepVY -= gravity;
  sheepY += sheepVY;

  // Bounce the sheep if its in a platform or the ground
  // Using bitwise OR to save a character but might not be worth it if more '||' added
  if (sheepY <= grassY | platforms.some(platform => Math.abs(sheepX - platform.x) < platform.width / 2 + sheepRadius
      & sheepY - sheepVY >= platform.top & sheepY <= platform.top)) {
    sheepVY = jumpVelocity;
  }

  if (sheepY - cameraY > cameraDeadzoneTop) {
    cameraY = sheepY - cameraDeadzoneTop;
  }
  if (sheepY - cameraY < cameraDeadzoneBottom) {
    cameraY = sheepY - cameraDeadzoneBottom;
  }
  if (cameraY < 0) cameraY = 0;

  // Render sheep
  sheepWrap.style.transform = `translate(${sheepX - sheepSize / 2}svh, ${-sheepY}svh) scale(${sheepFacing},1)`;
  s.style.transform = `rotate(${sheepTilt * sheepFacing}deg)`;

  // Render platforms
  // Note that we always use two values for translate for consistency/compression
  worldLayer.style.transform = `translate(0, ${cameraY}svh)`;

  // Render background
  const t = cameraY / 1600;
  const r = 141 - 92 * t;
  const g = 221 - 201 * t;
  const b = 238 - 218 * t;
  a.style.background = `rgb(${r} ${g} ${b})`;

  requestAnimationFrame(update);
};

onkeydown = e => heldKeys += e.key;
onkeyup = e => heldKeys = heldKeys.replaceAll(e.key, '');

update();