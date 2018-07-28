import * as glMatrix from 'gl-matrix';

window.requestAnimationFrame = window.requestAnimationFrame ||
                                (window as any).mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame ||
                                (window as any).msRequestAnimationFrame;

const STAGE_WIDTH = 320;
const STAGE_HEIGHT = 240;
const bgCanvas = <HTMLCanvasElement> document.getElementById('bg');
bgCanvas.width = STAGE_WIDTH;
bgCanvas.height = STAGE_HEIGHT;
const bgContext = bgCanvas.getContext('2d');

class Background {
  constructor(
    private readonly context: CanvasRenderingContext2D,
    private readonly width: number,
    private readonly height: number,
    private readonly color: string) { }

  draw() {
    this.context.fillStyle = this.color;
    this.context.fillRect(0, 0, this.width, this.height);
  }
}

class Player {
  private readonly radius: number;
  private readonly point: glMatrix.vec2;
  constructor(
    private readonly context: CanvasRenderingContext2D,
    private readonly color: string) {
    this.point = glMatrix.vec2.create();
    this.point[0] = 120;
    this.point[1] = 120;
    this.radius = 10;
  }

  move(trans: glMatrix.mat2d) {
    glMatrix.vec2.transformMat2d(this.point, this.point, trans);
  }

  draw() {
    this.context.fillStyle = this.color;
    this.context.arc(this.point[0], this.point[1], this.radius, 0, Math.PI * 2, false);
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


const background = new Background(bgContext, STAGE_WIDTH, STAGE_HEIGHT, '#000000');
const player = new Player(bgContext, '#FFFFFF');
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

function tick() {
  player.move(key.toMat2d());

  background.draw();
  player.draw();

  requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(tick);
});

