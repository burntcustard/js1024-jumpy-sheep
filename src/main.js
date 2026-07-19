const grassHeight = 4;
const horizontalRange = 23; // Horizontal range of sheep movement & platform placement in svh
const platformEndWidth = 4; // Width of the last platform in svh
const platformHeight = 2; // Height of platforms in svh
const platformSpacing = 40; // Vertical distance between platforms in svh
const platformStartWidth = 14; // Width of the first platform in svh
const sheepSize = 10;

// id="s" instead of 'parent.children[0]' is good to avoid square brackets entirely
// The wrapper div handles position + movement transform so the sheep's own
// transform-origin stays correct for the rotate on the svg
const sheepHtml = `
  <p id=w>
    <svg id=s viewbox=0,0,36,36>
      <path d=m18,33,8-1,2,4q2,1,5-7,3-2,3-8,0-11-27-14-9,4-9,11,1,6,8,5,0,5,3,7,2,6,4,6 fill=#eee />
      <path d=m4,16a1,1,0,111,0 />
      <path d=m7,9q2-5,11-5,6,2,4,9-5,6-10,4-3-2,1-2t5-3q-1-4-6-2-3,1-5-1 fill="#fc5" />
    </svg>
`;

// Platform object: platformHitX = width/2 + sheep radius, platformTop = the
// y coord of the platform's top edge (used for landing collision)
let width = 0;
let x = 0;
let y = 0;
let i = 0;
let platformsHtml = '';
const platforms = [...Array(99)].map(() => (
  width = platformStartWidth - (platformStartWidth - platformEndWidth) * i / 98,
  x = -horizontalRange + Math.random() * (horizontalRange * 2),
  y = ++i * platformSpacing, // Here is where i is incremented
  platformsHtml += `
    <p style="
      position: absolute;
      left: 50%;
      bottom: ${y}svh;
      width: ${width}svh;
      border-bottom: solid #c82 ${platformHeight}svh;
      translate: ${x - width / 2}svh 0;
    ">
  `,
  ({platformX: x, platformHitX: width / 2 + 2, platformTop: y + platformHeight})
));

let sheepX = 0;
let sheepY = 0;
// let heldKeys = {'R': 0, 'L': 0};
let tiltX = 0;
const gravity = .09;
const jumpVelocity = 3;
const tiltDeadzone = .5;
const cameraDeadzoneTop = 60;
const cameraDeadzoneBottom = 8;
let sheepVY = jumpVelocity;
let cameraY = 0;
let sheepFacing = 1;

const update = (moveX) => {
  // Set sheep position
  // heldKeys tracks each arrow separately via e.key[5], which is 'R' for
  // 'ArrowRight' and 'L' for 'ArrowLeft'. Holding both cancels out; releasing
  // one resumes movement in the other's direction
  moveX = tiltX;
  sheepFacing = moveX ? moveX > 0 ? -1 : 1 : sheepFacing;
  sheepX = Math.max(-horizontalRange, Math.min(horizontalRange, sheepX + moveX));
  sheepVY -= gravity;
  sheepY += sheepVY;

  // Bounce the sheep if its in a platform or the ground
  // Using bitwise OR to save a character but might not be worth it if more '||' added
  sheepVY = (sheepY < 0 | platforms.some(platform => Math.abs(sheepX - platform.platformX) < platform.platformHitX
      & sheepY - sheepVY > platform.platformTop & sheepY < platform.platformTop)) ? jumpVelocity : sheepVY;

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
    rotate: ${.3 * moveX * sheepFacing}rad;
  `;

  // Render body: base layout, camera translate (two values for
  // consistency/compression), and the background "sky"
  a.style = `
    margin: 0;
    height: ${100 - grassHeight}svh;
    border-bottom: solid #3a3 ${grassHeight}svh;
    translate: 0 ${cameraY}svh;
    background: hsl(${190 + cameraY / 44} 60% ${73 - cameraY / 62}%);
  `;
};

// 'ArrowRight' and 'ArrowLeft' are the only keys that matter for this game,
// so we can just use e.key[5] to get 'R' or 'L' and store it in heldKeys
// onkeydown = e => heldKeys[e.key[5]] = 1;
// onkeyup = e => heldKeys[e.key[5]] = 0;
a.onclick = () => window.DeviceMotionEvent?.requestPermission?.();

ondevicemotion = e => {
  // Use only gravity-adjusted X acceleration for left/right movement.
  // Soft deadzone: subtract the clamped value (deadzone) then clamp the result.
  tiltX = Math.max(
    -1,
    Math.min(
      1,
      (
        -e.accelerationIncludingGravity.x
        - Math.max(-tiltDeadzone, Math.min(tiltDeadzone, -e.accelerationIncludingGravity.x))
      )
    )
  );
};

a.innerHTML = platformsHtml + sheepHtml;

setInterval(update, 16);
