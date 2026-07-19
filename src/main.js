const platformHeight = 2; // Height of platforms in svh
const platformStartWidth = 14;
const platformEndWidth = 4;
const horizontalRange = 24;
const platformSpacing = 40;
const sheepSize = 10;
const grassHeight = 4;
// id="s" instead of 'parent.children[0]' is good to avoid square brackets entirely
// The wrapper div handles position + movement transform so the sheep's own
// transform-origin stays correct for the rotate on the svg
const sheepHtml = `
  <p id=w>
    <svg id=s viewbox=0,0,36,36>
      <path d=m18,33,8-1,2,4c2,1,4-5,5-7q3-2,3-8,0-11-27-14C5,8-1,13,0,18q1,6,8,5,0,5,3,7,2,6,4,6 fill=#eee />
      <path d=m6,16c0,2-3,2-3,0s3-2,3,0 />
      <path d=m7,9q2-5,11-5,6,2,4,9-5,6-10,4-3-2,1-2t5-3q-1-4-6-2-3,1-5-1 fill="#fc5" />
    </svg>
`;

// Platform object: platformHitX = width/2 + sheep radius, platformTop = the
// y coord of the platform's top edge (used for landing collision)
let width = 0;
let x = 0;
let y = 0;
let platformsHtml = '';
const platforms = [...Array(99)].map((_,i) => (
  width = platformStartWidth - (platformStartWidth - platformEndWidth) * i / 98,
  x = -horizontalRange + Math.random() * (horizontalRange * 2),
  y = (i + 1) * platformSpacing,
  platformsHtml += `
    <p style="
      position: absolute;
      left: 50%;
      bottom: ${y}svh;
      width: ${width}svh;
      height: ${platformHeight}svh;
      background: #b72;
      translate: ${x - width / 2}svh 0;
    ">
  `,
  ({platformX: x, platformHitX: width / 2 + 2, platformTop: y + platformHeight})
));

let sheepX = 0;
let sheepY = 0;
let heldKeys = {'R': 0, 'L': 0};
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

const update = () => {
  // Set sheep position
  // heldKeys tracks each arrow separately via e.key[5], which is 'R' for
  // 'ArrowRight' and 'L' for 'ArrowLeft'. Holding both cancels out; releasing
  // one resumes movement in the other's direction
  const moveX = tiltX || heldKeys['R'] - heldKeys['L'];
  sheepX += moveX;
  moveX && (sheepFacing = moveX > 0 ? -1 : 1);
  sheepX = Math.max(-horizontalRange, Math.min(horizontalRange, sheepX));
  sheepVY -= gravity;
  sheepY += sheepVY;

  // Bounce the sheep if its in a platform or the ground
  // Using bitwise OR to save a character but might not be worth it if more '||' added
  if (sheepY <= 0 | platforms.some(platform => Math.abs(sheepX - platform.platformX) < platform.platformHitX
      & sheepY - sheepVY > platform.platformTop & sheepY < platform.platformTop)) {
    sheepVY = jumpVelocity;
  }

  cameraY = sheepY - Math.min(
    sheepY,
    cameraDeadzoneTop,
    Math.max(cameraDeadzoneBottom, sheepY - cameraY)
  );

  // Render sheep wrapper
  w.style = `
    position: absolute;
    left: 50%;
    bottom: 0;
    translate: ${sheepX - sheepSize / 2}svh ${-sheepY}svh;
    scale: ${sheepFacing} 1;
  `;

  // Render sheep. Height isn't needed because its implicit via viewBox + width
  s.style = `
    transition: rotate .2s;
    width: ${sheepSize}svh;
    rotate: ${15 * moveX * sheepFacing}deg;
  `;

  // Render body: base layout, camera translate (two values for
  // consistency/compression), and the background "sky"
  a.style = `
    margin: 0;
    height: ${100 - grassHeight}svh;
    border-bottom: ${grassHeight}svh solid #3a3;
    translate: 0 ${cameraY}svh;
    background: color-mix(in hwb, #8de, #314 ${cameraY / 40}%);
  `;
};

// 'ArrowRight' and 'ArrowLeft' are the only keys that matter for this game,
// so we can just use e.key[5] to get 'R' or 'L' and store it in heldKeys
onkeydown = e => heldKeys[e.key[5]] = 1;
onkeyup = e => heldKeys[e.key[5]] = 0;

ondevicemotion = e => {
  // Use only gravity-adjusted X acceleration for left/right movement.
  // Soft deadzone: subtract the clamped value (deadzone) then clamp the result.
  tiltX = Math.max(
    -1,
    Math.min(
      1,
      (
        -e.accelerationIncludingGravity.x
        - Math.max(-1, Math.min(1, -e.accelerationIncludingGravity.x))
      ) / tiltResponseRange
    )
  );
};

a.innerHTML = platformsHtml + sheepHtml;

setInterval(update, 16);
