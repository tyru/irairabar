import * as glMatrix from 'gl-matrix';
import { compileFast } from './index';

(() => {
  const WIDTH = 320;
  const HEIGHT = 320;
  const RADIUS = 150;

  const requestAnimationFrame = window.requestAnimationFrame ||
                                (window as any).mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame ||
                                (window as any).msRequestAnimationFrame;

  const bgCanvas = <HTMLCanvasElement> document.getElementById('bg');
  const bgContext = bgCanvas.getContext('2d');

  const fgCanvas = <HTMLCanvasElement> document.getElementById('fg');
  const fgContext = fgCanvas.getContext('2d');

  const cameraCanvas = <HTMLCanvasElement> document.getElementById('camera');
  const cameraContext = cameraCanvas.getContext('2d');

  function setup() {
    fgCanvas.width  = bgCanvas.width  = cameraCanvas.width  = WIDTH;
    fgCanvas.height = bgCanvas.height = cameraCanvas.height = HEIGHT;

    fgContext.setTransform(1, 0, 0, 1, WIDTH / 2, HEIGHT / 2);
    bgContext.setTransform(1, 0, 0, 1, WIDTH / 2, HEIGHT / 2);
    cameraContext.setTransform(1, 0, 0, 1, WIDTH / 2, HEIGHT / 2);

    const functions = compileFast([
      `M ${RADIUS} 0`,
      `A ${RADIUS} ${RADIUS} 0 0 1 ${-RADIUS} 0`,
      `A ${RADIUS} ${RADIUS} 0 0 1 ${RADIUS} 0`,
    ].join(' '), null, false);

    // circle
    bgContext.beginPath();
    bgContext.arc(0, 0, RADIUS, 0, Math.PI * 2);
    bgContext.stroke();
    // x axis
    bgContext.beginPath();
    bgContext.moveTo(0, -HEIGHT);
    bgContext.lineTo(0, HEIGHT);
    bgContext.stroke();
    // y axis
    bgContext.beginPath();
    bgContext.moveTo(-WIDTH, 0);
    bgContext.lineTo(WIDTH, 0);
    bgContext.stroke();
    // quadrants
    bgContext.font = '50px serif';
    [1, 2, 3, 4].forEach(n => {
      const text = n.toString();
      const info = bgContext.measureText(text);
      const angle = Math.PI * ((n - 1) * 0.5 + 0.25);
      const cx = 100 * Math.cos(angle);
      const cy = 100 * Math.sin(angle);
      bgContext.fillText(text, cx - info.width / 2, cy + 25);
    })
  }

  function drawLine(context: CanvasRenderingContext2D, p1: [number, number], p2: [number, number]) {
    context.beginPath();
    context.strokeStyle = 'red';
    context.moveTo(p1[0], p1[1]);
    context.lineTo(p2[0], p2[1]);
    context.stroke();
  }

  function drawLinearFuncText(
    context: CanvasRenderingContext2D,
    t: number,
    x: number,
    y: number,
    a: number,
    b: number,
  ) {
    const func = `y = ${a.toFixed(1)}x + ${b.toFixed(1)}`;
    const angle = `angle = ${t}`;

    context.fillText(func, -WIDTH / 2 + 5, HEIGHT / 2 - 20);
    context.fillText(angle, -WIDTH / 2 + 5, HEIGHT / 2 - 5);
  }

  let t = 0;
  const maxTick = 360;

  function tick() {
    fgContext.clearRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);

    const angle = t * Math.PI / 180;
    const x = RADIUS * Math.cos(angle);
    const y = RADIUS * Math.sin(angle);

    let p1: [number, number];
    let p2: [number, number];
    let funcText: string;

    if (t % 180 === 0) {
      p1 = [x, -HEIGHT / 2];
      p2 = [x, HEIGHT / 2];
      funcText = `x = ${x}`;
    } else if (t % 90 === 0) {
      p1 = [-WIDTH / 2, y];
      p2 = [WIDTH / 2, y];
      funcText = `y = ${y}`;
    } else {
      const a = Math.tan(angle + Math.PI * 0.5);
      const b = y - a * x;
      p1 = [(-HEIGHT / 2 - b) / a, -HEIGHT / 2];
      p2 = [(HEIGHT / 2 - b) / a, HEIGHT / 2];
      funcText = `y = ${a.toFixed(1)}x + ${b.toFixed(1)}`;
    }

    drawLine(fgContext, p1, p2);

    fgContext.fillText(funcText, -WIDTH / 2 + 5, HEIGHT / 2 - 20);
    fgContext.fillText(`angle = ${t}`, -WIDTH / 2 + 5, HEIGHT / 2 - 5);

    cameraContext.setTransform(1, 0, 0, 1, WIDTH / 2, HEIGHT / 2);
    cameraContext.clearRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);
    const m = glMatrix.mat2d.create();
    glMatrix.mat2d.fromRotation(m, angle + Math.PI);
    m[4] = x;
    m[5] = y;
    if (!glMatrix.mat2d.invert(m, m)) {
      throw new Error('could not invert matrix: ' + Array.from(m).toString());
    }
    m[5] += HEIGHT / 2;
    cameraContext.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
    cameraContext.drawImage(bgCanvas, -WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);
    cameraContext.drawImage(fgCanvas, -WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT);

    t = (t + 1) % maxTick;
    requestAnimationFrame(tick);
  }

  document.addEventListener('DOMContentLoaded', () => {
    setup();
    requestAnimationFrame(tick);
  });

})();
