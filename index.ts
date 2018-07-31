import * as glMatrix from 'gl-matrix';

import * as DSL from './dsl';

const MAP_WIDTH = 320;
const MAP_HEIGHT = 240;

class Color {
  private constructor(
    public readonly r: number,
    public readonly g: number,
    public readonly b: number,
    public readonly a: number = 1,
  ) {
    if (r < 0 || r > 255) {
      throw new Error(`Color: r = ${r}`);
    }
    if (g < 0 || g > 255) {
      throw new Error(`Color: g = ${g}`);
    }
    if (b < 0 || b > 255) {
      throw new Error(`Color: b = ${b}`);
    }
    if (a < 0 || a > 1) {
      throw new Error(`Color: a = ${a}`);
    }
  }

  public static fromRGB(r: number, g: number, b: number) {
    return new Color(r, g, b);
  }

  toRGBAString() {
    return `rgba(${this.r},${this.g},${this.b},${this.a})`;
  }
}

class Player {
  private readonly point: glMatrix.vec2;
  private readonly prevPoint: glMatrix.vec2;
  private readonly radius: number;
  private readonly actualSizePer: number;

  constructor(
    private readonly context: CanvasRenderingContext2D,
    private readonly color: Color,
    x: number = 0,
    y: number = 0,
  ) {
    this.point = glMatrix.vec2.fromValues(x, y);
    this.prevPoint = glMatrix.vec2.clone(this.point);
    this.radius = 4;
    this.actualSizePer = 0.8;
  }

  move(trans: glMatrix.mat2d) {
    glMatrix.vec2.transformMat2d(this.point, this.point, trans);
  }

  draw() {
    const actRad = Math.round(this.radius / this.actualSizePer);

    // Clear previous area
    if (!glMatrix.vec2.equals(this.prevPoint, this.point)) {
      this.context.clearRect(
        this.prevPoint[0] - actRad,
        this.prevPoint[1] - actRad,
        actRad * 2,
        actRad * 2,
      );
      glMatrix.vec2.copy(this.prevPoint, this.point);
    }

    const radGrad = this.context.createRadialGradient(
      this.point[0], this.point[1], 0,
      this.point[0], this.point[1], actRad,
    );
    const { r, g, b } = this.color;
    radGrad.addColorStop(0, `rgba(${r},${g},${b},1)`);
    radGrad.addColorStop(0.5, `rgba(${r},${g},${b},${this.actualSizePer})`);
    radGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);

    this.context.fillStyle = radGrad;
    this.context.beginPath();
    this.context.arc(this.point[0], this.point[1], actRad, 0, Math.PI * 2, false);
    this.context.fill();
  }
}

class KeyInput {
  public left: boolean;
  public up: boolean;
  public right: boolean;
  public down: boolean;

  toMat2d(scalar: number = 1) {
    const x = this.left ? -1 : this.right ? 1 : 0;
    const y = this.up   ? -1 : this.down  ? 1 : 0;
    return glMatrix.mat2d.fromValues(1, 0, 0, 1, x * scalar, y * scalar);
  }
}

window.requestAnimationFrame = window.requestAnimationFrame ||
                                (window as any).mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame ||
                                (window as any).msRequestAnimationFrame;

(() => {
  const key = new KeyInput();

  window.onkeydown = (e) => {
    switch (e.keyCode) {
      case 37:
        key.left = true;
        break;
      case 38:
        key.up = true;
        break;
      case 39:
        key.right = true;
        break;
      case 40:
        key.down = true;
        break;
    }
  };

  window.onkeyup = (e) => {
    switch (e.keyCode) {
      case 37:
        key.left = false;
        break;
      case 38:
        key.up = false;
        break;
      case 39:
        key.right = false;
        break;
      case 40:
        key.down = false;
        break;
    }
  };

  const bgCanvas = <HTMLCanvasElement> document.getElementById('bg');
  bgCanvas.width = MAP_WIDTH;
  bgCanvas.height = MAP_HEIGHT;
  const bgContext = bgCanvas.getContext('2d');

  function loadStage() {
    return new DSL.Stage(bgContext, MAP_WIDTH, MAP_HEIGHT, [
      new DSL.MoveLine(`
      M 0 480
      L 0 240
      Z
      `),
      new DSL.Block(bgContext, 0, 0, true, [new DSL.BlockLayer()]),
      new DSL.Block(bgContext, 0, 1, false, [new DSL.BlockLayer()]),
      new DSL.Block(bgContext, 0, 2, true, [new DSL.BlockLayer()]),
    ]);
  }

  const stage = loadStage();
  const player = new Player(
    bgContext, Color.fromRGB(255, 255, 255), stage.width / 2, stage.height - 40
  );

  function tick() {
    stage.move();
    player.move(key.toMat2d());

    stage.draw();
    player.draw();

    requestAnimationFrame(tick);
  }

  document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(tick);
  });

})();
