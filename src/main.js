const platformHeight = 2; // Height of platforms in svh
const platformStartWidth = 14;
const platformEndWidth = 4;
const horizontalRange = 24;
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
let tiltX = 0;
let alpha, beta, gamma, accX, accY, accZ, gravX, gravY, gravZ, rotA, rotB, rotG, motionInterval;
const gravity = .09;
const jumpVelocity = 2.9;
const cameraDeadzoneTop = 60;
const cameraDeadzoneBottom = 10;
let sheepVY = jumpVelocity;
let cameraY = 0;
let sheepFacing = 1;
const formatSensor = n => n == null ? '-' : n.toFixed(2);

sheepWrap.innerHTML = sheepSvg;
a.append(sheepWrap, grassStrip);
a.style.margin = '0';
a.style.height = '100svh'

// DEBUG SENSOR HUD (comment out this section later)
const sensorHud = document.createElement('div');
document.documentElement.append(sensorHud);
sensorHud.style.position = 'fixed';
sensorHud.style.left = '0';
sensorHud.style.top = '0';
sensorHud.style.zIndex = '9';
sensorHud.style.whiteSpace = 'pre';
sensorHud.style.font = '10px monospace';
sensorHud.style.color = '#fff';
sensorHud.style.background = '#0008';
sensorHud.style.padding = '.3em';
sensorHud.style.pointerEvents = 'none';

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
  const moveX = tiltX || heldKeys.includes('g') - heldKeys.includes('L');
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

  cameraY = Math.max(0, sheepY - Math.min(cameraDeadzoneTop, Math.max(cameraDeadzoneBottom, sheepY - cameraY)));

  // Render sheep
  sheepWrap.style.transform = `translate(${sheepX - sheepSize / 2}svh, ${-sheepY}svh) scale(${sheepFacing},1)`;
  s.style.rotate = `${15 * moveX * sheepFacing}deg`;

  // Render platforms
  // Note that we always use two values for translate for consistency/compression
  a.style.transform = `translate(0, ${cameraY}svh)`;

  // Render background
  a.style.background = `color-mix(in hwb, #8de, #314 ${cameraY / 16}%)`;

  sensorHud.textContent =
`tiltX ${tiltX}
alpha ${formatSensor(alpha)} beta ${formatSensor(beta)} gamma ${formatSensor(gamma)}
acc ${formatSensor(accX)} ${formatSensor(accY)} ${formatSensor(accZ)}
grav ${formatSensor(gravX)} ${formatSensor(gravY)} ${formatSensor(gravZ)}
rot ${formatSensor(rotA)} ${formatSensor(rotB)} ${formatSensor(rotG)}
dt ${formatSensor(motionInterval)}`;

  // Just under 60 updates per second
  setTimeout(update, 16);
};

onkeydown = e => heldKeys += e.key;
onkeyup = e => heldKeys = heldKeys.replaceAll(e.key, '');
const onOrientation = e => {
  alpha = e.alpha;
  beta = e.beta;
  gamma = e.gamma;
  const g = gamma || 0;
  const a = Math.abs(g);
  tiltX = a < 10 ? 0 : Math.sign(g) * Math.min(1, (a - 10) / 10);
};
const onMotion = e => {
  accX = e.acceleration?.x;
  accY = e.acceleration?.y;
  accZ = e.acceleration?.z;
  gravX = e.accelerationIncludingGravity?.x;
  gravY = e.accelerationIncludingGravity?.y;
  gravZ = e.accelerationIncludingGravity?.z;
  rotA = e.rotationRate?.alpha;
  rotB = e.rotationRate?.beta;
  rotG = e.rotationRate?.gamma;
  motionInterval = e.interval;
};
ondeviceorientation = onOrientation;
ondevicemotion = onMotion;

update();