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
    <path
      d="M6 16a1.5 1.5 0 1 1-3 0a1.5 1.5 0 1 1 3 0"/>
    <path
      fill="#fc5"
      d="M18 4q6 2 4 9-5 6-10 4-3-2 1-2t5-3q-1-4-6-2q-3 1-5-1q2-5 11-5"
    />
  </svg>
`;

// Platform tuple: [x, hitX, top] where hitX = width/2 + sheep radius
let width, x, y, el;
const platforms = [...Array(99)].map((_,i) => (
  width = platformStartWidth - (platformStartWidth - platformEndWidth) * i / 98,
  x = -horizontalRange + Math.random() * (horizontalRange * 2),
  y = (i + 1) * platformSpacing,
  el = document.createElement('div'),
  el.style.position = 'absolute',
  el.style.left = '50%',
  el.style.transform = `translate(${x - width / 2}svh, 0)`,
  el.style.bottom = `${y}svh`,
  el.style.width = `${width}svh`,
  el.style.height = `${platformHeight}svh`,
  el.style.background = '#a72',
  a.append(el),
  [x, width / 2 + 2, y + platformHeight]
));
const sheepWrap = document.createElement('div');
const grassStrip = document.createElement('div');

let sheepX = 0;
const grassY = 4;
let sheepY = grassY;
let heldKeys = '';
const gravity = .09;
const jumpVelocity = 2.9;
const cameraDeadzoneTop = 60;
const cameraDeadzoneBottom = 10;
let sheepVY = jumpVelocity;
let cameraY = 0;
let sheepFacing = 1;

sheepWrap.innerHTML = sheepSvg;
a.append(sheepWrap, grassStrip);
a.style.margin = '0';
a.style.height = '100svh'

grassStrip.style.position = 'absolute';
grassStrip.style.inset = '0';
grassStrip.style.top = '';
grassStrip.style.height = `${grassY}svh`;
grassStrip.style.background = '#3a3';

sheepWrap.style.position = 'absolute';
sheepWrap.style.left = '50%';
sheepWrap.style.bottom = '0';
s.style.transition = 'rotate .2s';
s.style.width = s.style.height = `${sheepSize}svh`;

const update = () => {
  // Set sheep position
  // 'g' and 'L' appear in 'ArrowRight' and 'ArrowLeft'. We avoid 'R'
  // because that character does not appear in the rest of our code
  const moveX = heldKeys.includes('g') - heldKeys.includes('L');
  sheepX += moveX;
  moveX && (sheepFacing = -moveX);
  sheepX = sheepX < -horizontalRange ? -horizontalRange : sheepX > horizontalRange ? horizontalRange : sheepX;
  sheepVY -= gravity;
  sheepY += sheepVY;

  // Bounce the sheep if its in a platform or the ground
  // Using bitwise OR to save a character but might not be worth it if more '||' added
  // Tuple indexes: [0]=x, [1]=hitX, [2]=top
  if (sheepY <= grassY | platforms.some(platform => Math.abs(sheepX - platform[0]) < platform[1]
      & sheepY - sheepVY >= platform[2] & sheepY <= platform[2])) {
    sheepVY = jumpVelocity;
  }

  if (sheepY - cameraY > cameraDeadzoneTop) {
    cameraY = sheepY - cameraDeadzoneTop;
  } else if (sheepY - cameraY < cameraDeadzoneBottom) {
    cameraY = sheepY - cameraDeadzoneBottom;
  }
  if (cameraY < 0) cameraY = 0;

  // Render sheep
  sheepWrap.style.transform = `translate(${sheepX - sheepSize / 2}svh, ${-sheepY}svh) scale(${sheepFacing},1)`;
  s.style.rotate = `${15 * moveX * sheepFacing}deg`;

  // Render platforms
  // Note that we always use two values for translate for consistency/compression
  a.style.transform = `translate(0, ${cameraY}svh)`;

  // Render background
  a.style.background = `color-mix(in hwb, #8de, #314 ${cameraY / 16}%)`;

  // Just under 60 updates per second
  setTimeout(update, 16);
};

onkeydown = e => heldKeys += e.key;
onkeyup = e => heldKeys = heldKeys.replaceAll(e.key, '');

update();