import * as glMatrix from 'gl-matrix';
import Color from './color';

export default class Player {
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
