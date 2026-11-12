// Draws the shabash bill (front on top half, back on bottom half) into a canvas
// that becomes the rain's WebGL texture. Stylised on purpose: a "one" note with
// «وای» in the portrait oval, never a copy of real currency.

export const BILL_W = 512;
export const BILL_H = 218; // 2.35 : 1

export function drawBillAtlas(fontFa: string, fontLatin: string) {
  const c = document.createElement("canvas");
  c.width = BILL_W;
  c.height = BILL_H * 2 + 4;
  const g = c.getContext("2d")!;

  const paper = (y: number, a: string, b: string) => {
    const grd = g.createLinearGradient(0, y, BILL_W, y + BILL_H);
    grd.addColorStop(0, a);
    grd.addColorStop(1, b);
    g.fillStyle = grd;
    g.beginPath();
    g.roundRect(2, y + 2, BILL_W - 4, BILL_H - 4, 10);
    g.fill();
    // engraving texture: fine diagonal lines
    g.save();
    g.clip();
    g.globalAlpha = 0.08;
    g.strokeStyle = "#1f3320";
    g.lineWidth = 1;
    for (let x = -BILL_H; x < BILL_W; x += 5) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + BILL_H, y + BILL_H);
      g.stroke();
    }
    g.restore();
  };

  const frame = (y: number, color: string) => {
    g.strokeStyle = color;
    g.lineWidth = 6;
    g.strokeRect(14, y + 14, BILL_W - 28, BILL_H - 28);
    g.lineWidth = 1.5;
    g.strokeRect(24, y + 24, BILL_W - 48, BILL_H - 48);
  };

  const corner = (y: number, color: string) => {
    g.fillStyle = color;
    g.font = `700 40px ${fontLatin}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (const [x, yy] of [
      [52, y + 50],
      [BILL_W - 52, y + 50],
      [52, y + BILL_H - 48],
      [BILL_W - 52, y + BILL_H - 48],
    ]) {
      g.beginPath();
      g.arc(x, yy, 25, 0, Math.PI * 2);
      g.lineWidth = 2;
      g.strokeStyle = color;
      g.stroke();
      g.fillText("1", x, yy + 2);
    }
  };

  // ---------- front
  paper(0, "#d7dfc8", "#b9c7a9");
  frame(0, "#2f4a31");
  corner(0, "#2f4a31");
  // portrait oval
  g.save();
  g.beginPath();
  g.ellipse(BILL_W / 2, BILL_H / 2, 66, 78, 0, 0, Math.PI * 2);
  g.fillStyle = "#c3cfb2";
  g.fill();
  g.lineWidth = 5;
  g.strokeStyle = "#2f4a31";
  g.stroke();
  g.restore();
  g.fillStyle = "#24402a";
  g.font = `84px ${fontFa}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.direction = "rtl";
  g.fillText("وای", BILL_W / 2, BILL_H / 2 + 6);
  g.direction = "ltr";
  g.font = `600 17px ${fontLatin}`;
  g.fillStyle = "#2f4a31";
  g.fillText("SHABASH  NOTE", BILL_W / 2, 38);
  g.fillText("ONE", 140, BILL_H / 2 + 4);
  g.fillText("ONE", BILL_W - 140, BILL_H / 2 + 4);
  // red serial, like the real thing feels
  g.fillStyle = "#9b2a2a";
  g.font = `600 15px ${fontLatin}`;
  g.fillText("K 1405 0821 M", 140, BILL_H - 40);

  // ---------- back
  const y0 = BILL_H + 4;
  paper(y0, "#7f9a73", "#5f7b56");
  frame(y0, "#e5ecd9");
  corner(y0, "#e5ecd9");
  g.fillStyle = "#eef3e4";
  g.font = `700 72px ${fontLatin}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("ONE", BILL_W / 2, y0 + BILL_H / 2 + 4);
  g.font = `40px ${fontFa}`;
  g.direction = "rtl";
  g.fillText("شاباش", BILL_W / 2, y0 + 48);
  g.direction = "ltr";

  return c;
}
