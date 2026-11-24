const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const toggle = document.querySelector('#motion');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let paused = preference.matches;
let phase = 0;
let frame;
let lastTime;
let target = 0;
let tilt = 0;

function draw() {
  const size = canvas.width;
  if (!size) return;
  context.clearRect(0, 0, size, size);
  const points = [];
  const roll = phase + tilt;
  for (let ring = 0; ring < 128; ring += 1) {
    const u = ring * Math.PI / 64;
    for (let slice = 0; slice < 23; slice += 1) {
      const v = slice * Math.PI * 2 / 23;
      const radius = 0.98 + 0.32 * Math.cos(v) + 0.17 * Math.cos(3 * u + phase);
      const x = radius * Math.cos(u);
      const y = radius * Math.sin(u);
      const z = 0.34 * Math.sin(v) + 0.38 * Math.sin(3 * u + phase);
      const depth = y * Math.sin(roll) + z * Math.cos(roll);
      const vertical = y * Math.cos(roll) - z * Math.sin(roll);
      const scale = size * 0.32 / (1 + depth * 0.21);
      points.push([size / 2 + (x * 0.91 - vertical * 0.42) * scale,
        size / 2 + (vertical * 0.91 + x * 0.42) * scale, depth, u, v]);
    }
  }
  points.sort((a, b) => b[2] - a[2]);
  for (const [x, y, depth, u, v] of points) {
    const hue = 250 + 48 * Math.sin(u + v * 0.7 + phase);
    const light = 63 + 17 * Math.cos(v) - 7 * depth;
    context.fillStyle = 'hsl(' + hue + ' 92% ' + light + '% / ' + (0.72 - depth * 0.16) + ')';
    context.beginPath();
    context.arc(x, y, size * (0.0026 - depth * 0.0005), 0, Math.PI * 2);
    context.fill();
  }
}
function animate(now) {
  phase += Math.min(now - (lastTime ?? now), 40) * 0.00038;
  lastTime = now;
  tilt += (target - tilt) * 0.05;
  draw();
  frame = requestAnimationFrame(animate);
}
function updateMotion() {
  cancelAnimationFrame(frame);
  lastTime = undefined;
  toggle.textContent = paused ? 'Animar peça' : 'Pausar animação';
  if (paused) draw();
  else frame = requestAnimationFrame(animate);
}
toggle.addEventListener('click', () => {
  paused = !paused;
  updateMotion();
});
preference.addEventListener('change', event => {
  paused = event.matches;
  updateMotion();
});
canvas.addEventListener('pointermove', event => {
  const bounds = canvas.getBoundingClientRect();
  target = (event.clientX - bounds.left) / bounds.width - 0.5;
});
canvas.addEventListener('pointerleave', () => { target = 0; });
new ResizeObserver(() => {
  const size = Math.round(canvas.clientWidth * Math.min(devicePixelRatio, 2));
  canvas.width = canvas.height = size;
  draw();
}).observe(canvas);
toggle.hidden = false;
updateMotion();
