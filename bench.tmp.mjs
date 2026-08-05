import { createCanvas } from "@napi-rs/canvas";

const SCALE = 10;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, w, h, r, color) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

function tile(ctx, x, y, w, h, mode) {
  if (mode === "blur") {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.06)";
    ctx.shadowBlur = 6 * SCALE;
    ctx.shadowOffsetY = 2 * SCALE;
    fillRoundRect(ctx, x, y, w, h, 10 * SCALE, "#EEE2C7");
    ctx.restore();
  } else if (mode === "hard") {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.08)";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 3 * SCALE;
    fillRoundRect(ctx, x, y, w, h, 10 * SCALE, "#EEE2C7");
    ctx.restore();
  } else {
    fillRoundRect(ctx, x, y, w, h, 10 * SCALE, "#EEE2C7");
  }
  ctx.font = "120px Segoe UI";
  ctx.fillStyle = "#3D3025";
  ctx.textAlign = "center";
  ctx.fillText("Label", x + w / 2, y + 40 * SCALE);
}

async function bench(name, mode) {
  const W = 5200, H = 4920;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  fillRoundRect(ctx, 0, 0, W, H, 20 * SCALE, "#FFF6E3");

  for (let i = 0; i < 9; i++) tile(ctx, 240 + (i % 3) * 1620, 240 + Math.floor(i / 3) * 1400, 1500, 1200, mode);

  const enc0 = performance.now();
  const buf = await canvas.encode("png");
  const enc1 = performance.now();
  console.log(`${name}: encode=${(enc1 - enc0).toFixed(1)}ms size=${(buf.length / 1024).toFixed(0)}KB`);
}

for (const [name, mode] of [
  ["blur shadow  ", "blur"],
  ["hard shadow  ", "hard"],
  ["no shadow    ", "none"],
]) {
  await bench(name, mode);
  await bench(`${name} #2`, mode);
}
