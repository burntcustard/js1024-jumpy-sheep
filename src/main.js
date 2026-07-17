const platformHeight = 2; // Height of platforms in svh
const platformStartWidth = 14;
const platformEndWidth = 4;
const horizontalRange = 24;
const platformSpacing = 40;
const sheepSize = 10;
const grassY = 4;
// id="s" instead of 'parent.children[0]' is good to avoid square brackets entirely
// The wrapper div handles position + movement transform so the sheep's own
// transform-origin stays correct for the rotate on the svg
const sheepHtml = `
  <div id=w style="
    position: absolute;
    left: 50%;
    bottom: 0;
  ">
    <svg id=s viewBox=0,0,36,36 style="
      transition: rotate .2s;
      width: ${sheepSize}svh;
      height: ${sheepSize}svh;
    ">
      <path d=m18,33,8-1,2,4c2,1,4-5,5-7q3-2,3-8,0-11-19-11-2-4-8-3C5,8-1,13,0,18q1,6,8,5,0,5,3,7,2,6,4,6z fill=#eee />
      <path d=m6,16c0,2-3,2-3,0s3-2,3,0 />
      <path d=m7,9q2-5,11-5,6,2,4,9-5,6-10,4-3-2,1-2t5-3q-1-4-6-2-3,1-5-1 fill="#fc5" />
    </svg>
  </div>
`;

const grassHtml = `
  <div style="
    position: absolute;
    inset: auto 0 0;
    height: ${grassY}svh;
    background: #3a3;
  "></div>
`;

// Platform tuple: [x, hitX, top] where hitX = width/2 + sheep radius
let width, x, y, platformsHtml = '';
const platforms = [...Array(99)].map((_,i) => (
  width = platformStartWidth - (platformStartWidth - platformEndWidth) * i / 98,
  x = -horizontalRange + Math.random() * (horizontalRange * 2),
  y = (i + 1) * platformSpacing,
  platformsHtml += `
    <div style="
      position: absolute;
      left: 50%;
      bottom: ${y}svh;
      width: ${width}svh;
      height: ${platformHeight}svh;
      background: #a72;
      translate: ${x - width / 2}svh 0;
    "></div>
  `,
  [x, width / 2 + 2, y + platformHeight]
));

let sheepX = 0;
let sheepY = grassY;
let heldKeys = '';
let tiltX = 0;
const gravity = .09;
const jumpVelocity = 3;
const tiltDeadzone = 1;
const tiltResponseRange = 2;
const cameraDeadzoneTop = 60;
const cameraDeadzoneBottom = 8;
let sheepVY = jumpVelocity;
let cameraY = 0;
let sheepFacing = 1;

a.innerHTML = platformsHtml + sheepHtml + grassHtml;
a.style.margin = '0';
a.style.height = '100svh'

const update = () => {
  // Set sheep position
  // 'g' and 'L' appear in 'ArrowRight' and 'ArrowLeft'. We avoid 'R'
  // because that character does not appear in the rest of our code
  const moveX = tiltX || heldKeys.includes('g') - heldKeys.includes('L');
  sheepX += moveX;
  moveX && (sheepFacing = moveX > 0 ? -1 : 1);
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

  cameraY = Math.max(0, sheepY - Math.min(cameraDeadzoneTop, Math.max(cameraDeadzoneBottom, sheepY - cameraY)));

  // Render sheep
  w.style.translate = `${sheepX - sheepSize / 2}svh ${-sheepY}svh`;
  w.style.scale = `${sheepFacing} 1`;
  s.style.rotate = `${15 * moveX * sheepFacing}deg`;

  // Render platforms
  // Note that we always use two values for translate for consistency/compression
  a.style.translate = `0 ${cameraY}svh`;

  // Render background
  a.style.background = `color-mix(in hwb, #8de, #314 ${cameraY / 16}%)`;

  // Just under 60 updates per second
  setTimeout(update, 16);
};

onkeydown = e => heldKeys += e.key;
onkeyup = e => heldKeys = heldKeys.replaceAll(e.key, '');

ondevicemotion = e => {
  // Use only gravity-adjusted X acceleration for left/right movement.
  tiltX = -e.accelerationIncludingGravity.x > tiltDeadzone
    ? Math.min(1, (-e.accelerationIncludingGravity.x - tiltDeadzone) / tiltResponseRange)
    : -e.accelerationIncludingGravity.x < -tiltDeadzone
      ? Math.max(-1, (-e.accelerationIncludingGravity.x + tiltDeadzone) / tiltResponseRange)
      : 0;
};

update();
