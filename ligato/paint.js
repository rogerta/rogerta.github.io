
class Blue {
  static get inputProperties() {
    return ['--background-color', '--star-color'];
  }

  paint(ctx, geom, properties) {
    const bg = properties.get('--background-color') || 'blue';
    const fg = properties.get('--star-color') || 'gold';
    const dx = geom.width;
    const dy = geom.height;
    const inset = 5;
    const r = Math.min(dx, dy) / 2 - inset;
    const cx = inset + r;
    const cy = inset + r;
    const rInner = r * Math.cos(67 / 180 * Math.PI);

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, dx, dy);

    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(cx, inset);
    ctx.lineTo(cx + rInner * Math.sin(36 / 180 * Math.PI),
               cy - rInner * Math.cos(36 / 180 * Math.PI));

    ctx.lineTo(cx + r * Math.sin(72 / 180 * Math.PI),
               cy - r * Math.cos(72 / 180 * Math.PI));
    ctx.lineTo(cx + rInner * Math.sin(108 / 180 * Math.PI),
               cy - rInner * Math.cos(108 / 180 * Math.PI));

    ctx.lineTo(cx + r * Math.sin(144 / 180 * Math.PI),
               cy - r * Math.cos(144 / 180 * Math.PI));
    ctx.lineTo(cx + rInner * Math.sin(180 / 180 * Math.PI),
               cy - rInner * Math.cos(180 / 180 * Math.PI));

    ctx.lineTo(cx + r * Math.sin(216 / 180 * Math.PI),
               cy - r * Math.cos(216 / 180 * Math.PI));
    ctx.lineTo(cx + rInner * Math.sin(252 / 180 * Math.PI),
               cy - rInner * Math.cos(252 / 180 * Math.PI));

    ctx.lineTo(cx + r * Math.sin(288 / 180 * Math.PI),
               cy - r * Math.cos(288 / 180 * Math.PI));
    ctx.lineTo(cx + rInner * Math.sin(324 / 180 * Math.PI),
               cy - rInner * Math.cos(324 / 180 * Math.PI));

    ctx.fill();
    ctx.closePath();
  }
};

class Red {
  static get inputProperties() {
    return ['--background-color', '--sickle-color'];
  }

  paint(ctx, geom, properties) {
    const bg = properties.get('--background-color') || 'blue';
    const fg = properties.get('--star-color') || 'gold';
    const dx = geom.width;
    const dy = geom.height;
    const inset = 5;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, dx, dy);
  }
};

class ExBoard {
  static get inputProperties() {
    return ['--token-size'];
  }

  paint(ctx, geom, properties) {
    const dx = geom.width;
    const dy = geom.height;
    const tokenSize = dx / 8;  //  parseInt(properties.get('--token-size'));

    ctx.strokeStyle = 'black';
    for (let x = tokenSize * 2; x < dx - tokenSize; x += tokenSize) {
      ctx.moveTo(x, tokenSize);
      ctx.lineTo(x, dy - tokenSize);
    }
    for (let y = tokenSize * 2; y < dy - tokenSize; y += tokenSize) {
      ctx.moveTo(tokenSize, y);
      ctx.lineTo(dx - tokenSize, y);
    }
    ctx.stroke();
  }
};

registerPaint('paintBlue', Blue);
registerPaint('paintRed', Red);
registerPaint('paintExBoard', ExBoard);
