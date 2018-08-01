import * as glMatrix from 'gl-matrix';
import * as svgParser from 'svg-path-parser';

interface Callable {
  call(stage: Stage): void
}

export class MoveLine implements Callable {
  private readonly cmds: svgParser.Command[];
  private readonly _point: glMatrix.mat2d;
  private readonly startCmdPoint: glMatrix.mat2d;
  private readonly startPoint: glMatrix.mat2d;
  private tick: number;

  constructor(path: string);
  constructor(
    cmds: svgParser.Command[],
    startPoint: glMatrix.mat2d,
    point: glMatrix.mat2d,
  );
  constructor(
    cmds: any,
    startPoint = glMatrix.mat2d.create(),
    point = glMatrix.mat2d.create(),
  ) {
    if (typeof cmds === 'string') {
      // TODO: make some alias commands into the generic commands as possible
      cmds = svgParser.makeAbsolute(svgParser.parseSVG(cmds));
    }
    this.cmds = cmds;
    this.startPoint = startPoint;
    this.startCmdPoint = glMatrix.mat2d.clone(point);
    this._point = glMatrix.mat2d.clone(point);
    this.tick = 0;
  }

  get point() { return glMatrix.mat2d.clone(this._point) }

  get x() { return this._point[4] }
  private setX(x: number) { this._point[4] = x }
  get y() { return this._point[5] }
  private setY(y: number) { this._point[5] = y }

  get initX() { return this.startCmdPoint[4] }
  get initY() { return this.startCmdPoint[5] }

  next() {
    if (this.cmds.length === 0) {
      return this;
    }
    const cmd = this.cmds[0];
    this.tick++;

    if (MoveLine.isMoveToCommand(cmd)) {
      return this.nextMoveTo(cmd);
    } else if (MoveLine.isLineToCommand(cmd)) {
      return this.nextLineTo(cmd);
    } else if (MoveLine.isHorizontalLineToCommand(cmd)) {
      return this.nextHorizontalLineTo(cmd);
    } else if (MoveLine.isVerticalLineToCommand(cmd)) {
      return this.nextVerticalLineTo(cmd);
    } else if (MoveLine.isClosePathCommand(cmd)) {
      return this.nextClosePath(cmd);
    } else if (MoveLine.isCurveToCommand(cmd)) {
      return this.nextCurveTo(cmd);
    } else if (MoveLine.isQuadraticCurveToCommand(cmd)) {
      return this.nextQuadraticCurveTo(cmd);
    } else if (MoveLine.isEllipticalArcCommand(cmd)) {
      return this.nextEllipticalArc(cmd);
    } else {
      throw new Error(`not implemented yet: cmd = ${JSON.stringify(cmd)}`);
    }
  }

  private static isMoveToCommand(cmd: svgParser.Command): cmd is svgParser.MoveToCommand {
    return cmd.command === 'moveto';
  }

  private nextMoveTo(cmd: svgParser.MoveToCommand) {
    const p = glMatrix.mat2d.clone(this._point);
    p[4] = cmd.x;
    p[5] = cmd.y;
    return new MoveLine(this.cmds.slice(1), p, p);
  }

  private static isLineToCommand(cmd: svgParser.Command): cmd is svgParser.LineToCommand {
    return cmd.command === 'lineto';
  }

  private nextLineTo(cmd: svgParser.LineToCommand) {
    const { initX, initY } = this;
    const signX = cmd.x < initX ? -1 : 1;
    const signY = cmd.y < initY ? -1 : 1;
    const tx = Math.abs(cmd.x - initX);
    const ty = Math.abs(cmd.y - initY);
    let x, y;
    if (tx > ty) {
      x = initX + signX * this.tick;
      y = initY + signY * ty / tx * this.tick;
    } else {
      x = initX + signX * tx / ty * this.tick;
      y = initY + signY * this.tick;
    }
    this.setX(x);
    this.setY(y);
    const d = Math.sqrt(Math.pow(cmd.x - x, 2) + Math.pow(cmd.y - y, 2));
    if (Math.round(d) === 0) {
      return new MoveLine(this.cmds.slice(1), this.startPoint, this._point);
    }
    return this;
  }

  private static isHorizontalLineToCommand(cmd: svgParser.Command): cmd is svgParser.HorizontalLineToCommand {
    return cmd.command === 'horizontal lineto';
  }

  private nextHorizontalLineTo(cmd: svgParser.HorizontalLineToCommand) {
    return this.nextLineTo(<svgParser.LineToCommand> {
      code: 'L',
      command: 'lineto',
      x: cmd.x,
      y: this.startCmdPoint[5],
    });
  }

  private static isVerticalLineToCommand(cmd: svgParser.Command): cmd is svgParser.VerticalLineToCommand {
    return cmd.command === 'vertical lineto';
  }

  private nextVerticalLineTo(cmd: svgParser.VerticalLineToCommand) {
    return this.nextLineTo(<svgParser.LineToCommand> {
      code: 'L',
      command: 'lineto',
      x: this.startCmdPoint[4],
      y: cmd.y,
    });
  }

  private static isClosePathCommand(cmd: svgParser.Command): cmd is svgParser.ClosePathCommand {
    return cmd.command === 'closepath';
  }

  private nextClosePath(cmd: svgParser.ClosePathCommand) {
    return this.nextLineTo(<svgParser.LineToCommand> {
      code: 'L',
      command: 'lineto',
      x: this.startPoint[4],
      y: this.startPoint[5],
    });
  }

  private static isCurveToCommand(cmd: svgParser.Command): cmd is svgParser.CurveToCommand {
    return cmd.command === 'curveto';
  }

  /**
   * cf.
   * https://postd.cc/bezier-curves/
   * https://en.wikipedia.org/wiki/B%C3%A9zier_curve
   */
  private nextCurveTo(cmd: svgParser.CurveToCommand) {
    const p0 = glMatrix.vec2.fromValues(this.startCmdPoint[4], this.startCmdPoint[5]);
    const p1 = glMatrix.vec2.fromValues(cmd.x1, cmd.y1);
    const p2 = glMatrix.vec2.fromValues(cmd.x2, cmd.y2);
    const p3 = glMatrix.vec2.fromValues(cmd.x, cmd.y);
    const t = this.tick / glMatrix.vec2.distance(p0, p3);

    if (1 - t < 0.001) {
      return new MoveLine(this.cmds.slice(1), this.startPoint, this._point);
    }

    // Calculate rotation angle from control points
    const theta1 = this.getAngle([1, 0], [p1[0] - p0[0], p1[1] - p0[1]]);
    const theta2 = this.getAngle([1, 0], [p3[0] - p2[0], p3[1] - p2[1]]);
    const angle = t * (theta2 - theta1);

    // Calculate current point on the curve
    const a = Math.pow(1 - t, 3);
    glMatrix.vec2.multiply(p0, glMatrix.vec2.fromValues(a, a), p0);

    const b = 3 * Math.pow(1 - t, 2) * t;
    glMatrix.vec2.multiply(p1, glMatrix.vec2.fromValues(b, b), p1);

    const c = 3 * (1 - t) * Math.pow(t, 2);
    glMatrix.vec2.multiply(p2, glMatrix.vec2.fromValues(c, c), p2);

    const d = Math.pow(t, 3);
    glMatrix.vec2.multiply(p3, glMatrix.vec2.fromValues(d, d), p3);

    const p = glMatrix.vec2.create();
    glMatrix.vec2.add(p, p0, p1);
    glMatrix.vec2.add(p, p, p2);
    glMatrix.vec2.add(p, p, p3);

    // Apply above results
    glMatrix.mat2d.fromRotation(this._point, angle);
    this._point[4] = p[0];
    this._point[5] = p[1];

    return this;
  }

  private static isQuadraticCurveToCommand(cmd: svgParser.Command): cmd is svgParser.QuadraticCurveToCommand {
    return cmd.command === 'quadratic curveto';
  }

  /**
   * cf.
   * https://postd.cc/bezier-curves/
   * https://en.wikipedia.org/wiki/B%C3%A9zier_curve
   */
  private nextQuadraticCurveTo(cmd: svgParser.QuadraticCurveToCommand) {
    const p0 = glMatrix.vec2.fromValues(this.startCmdPoint[4], this.startCmdPoint[5]);
    const p1 = glMatrix.vec2.fromValues(cmd.x1, cmd.y1);
    const p2 = glMatrix.vec2.fromValues(cmd.x, cmd.y);
    const t = this.tick / glMatrix.vec2.distance(p0, p2);

    if (1 - t < 0.001) {
      return new MoveLine(this.cmds.slice(1), this.startPoint, this._point);
    }

    // Calculate rotation angle from the control point
    const theta1 = this.getAngle([1, 0], [p1[0] - p0[0], p1[1] - p0[1]]);
    const theta2 = this.getAngle([1, 0], [p2[0] - p1[0], p2[1] - p1[1]]);
    const angle = t * (theta2 - theta1);

    // Calculate current point on the curve
    const a = Math.pow(1 - t, 2);
    glMatrix.vec2.multiply(p0, glMatrix.vec2.fromValues(a, a), p0);

    const b = 2 * (1 - t) * t;
    glMatrix.vec2.multiply(p1, glMatrix.vec2.fromValues(b, b), p1);

    const c = Math.pow(t, 2);
    glMatrix.vec2.multiply(p2, glMatrix.vec2.fromValues(c, c), p2);

    const p = glMatrix.vec2.create();
    glMatrix.vec2.add(p, p0, p1);
    glMatrix.vec2.add(p, p, p2);

    // Apply above results
    glMatrix.mat2d.fromRotation(this._point, angle);
    this._point[4] = p[0];
    this._point[5] = p[1];

    return this;
  }

  private static isEllipticalArcCommand(cmd: svgParser.Command): cmd is svgParser.EllipticalArcCommand {
    return cmd.command === 'elliptical arc';
  }

  /**
   * cf.
   * https://www.w3.org/TR/SVG11/implnote.html#ArcConversionEndpointToCenter
   */
  private nextEllipticalArc(cmd: svgParser.EllipticalArcCommand) {
    // NOTE: All values under constants are rectangular coordinate system based
    const constants = this.calcEllipticalArc(cmd);

    // 0 <= t <= 1
    const t = this.tick / glMatrix.vec2.distance(
      [this.startCmdPoint[4], this.startCmdPoint[5]],
      [cmd.x, cmd.y],
    );
    const angle = constants.theta1 + t * constants.deltaTheta;

    if (1 - t < 0.001) {
      return new MoveLine(this.cmds.slice(1), this.startPoint, this._point);
    }

    const p = glMatrix.vec2.fromValues(
      cmd.rx * Math.cos(angle),
      cmd.ry * Math.sin(angle),
    );
    glMatrix.vec2.transformMat2d(p, p, constants.finalMat2d);

    // Apply above results
    glMatrix.mat2d.fromRotation(this._point, angle - constants.theta1);
    this._point[4] = p[0];
    this._point[5] = p[1];

    return this;
  }

  private calcEllipticalArc(cmd: svgParser.EllipticalArcCommand) {
    const rot = cmd.xAxisRotation / 180 * Math.PI;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const x1 = this.startCmdPoint[4];
    const y1 = this.startCmdPoint[5];
    const x2 = cmd.x;
    const y2 = cmd.y;

    const dx1y1Vec2 = glMatrix.vec2.fromValues((x1 - x2) / 2, (y1 - y2) / 2);
    glMatrix.vec2.transformMat2(dx1y1Vec2, dx1y1Vec2, glMatrix.mat2.fromValues(cos, -sin, sin, cos));
    const [dx1, dy1] = [dx1y1Vec2[0], dx1y1Vec2[1]];

    const rxDouble = cmd.rx * cmd.rx;
    const ryDouble = cmd.ry * cmd.ry;
    const dx1Double = dx1 * dx1;
    const dy1Double = dy1 * dy1;
    let dcxyScalar = (rxDouble * ryDouble - rxDouble * dy1Double - ryDouble * dx1Double);
    dcxyScalar = dcxyScalar / (rxDouble * dy1Double + ryDouble * dx1Double);
    dcxyScalar = Math.sqrt(dcxyScalar);
    if (cmd.largeArc === cmd.sweep) {
      dcxyScalar = -dcxyScalar;
    }

    const dcxyVec2 = glMatrix.vec2.fromValues(
      cmd.rx * dy1 / cmd.ry,
      cmd.ry * dx1 / -cmd.rx,
    );
    glMatrix.vec2.multiply(dcxyVec2, dcxyVec2, glMatrix.vec2.fromValues(dcxyScalar, dcxyScalar));
    const [dcx, dcy] = [dcxyVec2[0], dcxyVec2[1]];

    const cxyVec2 = glMatrix.vec2.clone(dcxyVec2);
    glMatrix.vec2.transformMat2d(
      cxyVec2, cxyVec2, glMatrix.mat2d.fromValues(cos, sin, -sin, cos, (x1 + x2) / 2, (y1 + y2) / 2)
    );
    const [cx, cy] = [cxyVec2[0], cxyVec2[1]];

    const startVec = [
      (dx1 - dcx) / cmd.rx,
      (dy1 - dcy) / cmd.ry,
    ];
    const theta1 = this.getAngle(
      [1, 0],
      startVec,
    );
    let deltaTheta = this.getAngle(
      startVec,
      [(-dx1 - dcx) / cmd.rx, (-dy1 - dcy) / cmd.ry],
    ) % (Math.PI * 2);
    if (!cmd.sweep && deltaTheta > 0) {
      deltaTheta -= Math.PI * 2;
    } else if (cmd.sweep && deltaTheta < 0) {
      deltaTheta += Math.PI * 2;
    }

    const finalMat2d = glMatrix.mat2d.fromValues(
      cos, sin, -sin, cos, cx, cy
    );

    return { cx, cy, theta1, deltaTheta, finalMat2d };
  }

  private getAngle(u: number[], v: number[]) {
    const cross = u[0] * v[1] - u[1] * v[0];
    return (cross < 0 ? -1 : 1) * glMatrix.vec2.angle(u, v);
  }

  call(stage: Stage) {
    stage.moveLine = this;
  }
}

export class Block implements Callable {
  private width: number;
  private height: number;

  constructor(
    private readonly context: CanvasRenderingContext2D,
    private readonly col: number,
    private readonly row: number,
    public readonly bottomWall: boolean,
    private readonly blockLayers: BlockLayer[]) { }

  get x() { return this.width * this.col }
  get y() { return this.height * this.row }

  draw() {
    const { x, y } = this;

    this.context.fillStyle = this.bottomWall ? 'black' : 'white';
    this.context.fillRect(x, y, this.width, this.height);

    this.blockLayers.forEach(layer => layer.draw(this));
  }

  call(stage: Stage) {
    this.width = stage.width;
    this.height = stage.height;
    stage.setBlock(this.col, this.row, this);
  }
}

export class BlockLayer {
  constructor(private readonly objects: BlockObject[]) { }

  draw(block: Block) {
    this.objects.forEach(obj => obj.draw(this, block));
  }
}

interface BlockObject {
  draw(layer: BlockLayer, block: Block): void
}

export class BlockObjectText implements BlockObject {
  constructor(
    private readonly context: CanvasRenderingContext2D,
    private readonly text: string,
    private readonly x: number,
    private readonly y: number,
  ) {}

  draw(_: BlockLayer, block: Block) {
    const { x, y, bottomWall } = block;
    this.context.fillStyle = bottomWall ? 'white' : 'black';
    this.context.fillText(this.text, x + 20, y + 20);
  }
}

export class Stage {
  private _moveLine = new MoveLine('M 0 0');
  private readonly blocks = new Map<string, Block>();
  private currentTransform = glMatrix.mat2d.create();

  get point() { return glMatrix.mat2d.clone(this._moveLine.point) }

  get x() { return this._moveLine.point[4] }
  get y() { return this._moveLine.point[5] }

  get moveLine() { return this._moveLine }
  set moveLine(moveLine: MoveLine) { this._moveLine = moveLine }

  constructor(
    private readonly context: CanvasRenderingContext2D,
    public readonly width: number,
    public readonly height: number,
    private readonly ops: Callable[]) {
    ops.forEach(op => op.call(this));
  }

  public setBlock(col: number, row: number, block: Block) {
    this.blocks.set(`${col}-${row}`, block);
  }

  move() {
    this.moveLine = this.moveLine.next();
    const p = this.moveLine.point;
    if (!glMatrix.mat2d.invert(p, p)) {
      throw new Error('could not invert p = ' + Array.from(p).toString());
    }
    this.currentTransform = p;
    this.context.setTransform(p[0], p[1], p[2], p[3], p[4], p[5]);
  }

  draw() {
    this.clearViewport();
    // TODO: Draw visible blocks only
    Array.from(this.blocks.values())
         .forEach((block: Block) => block.draw());
  }

  private clearViewport() {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.width, this.height);
    const t = this.currentTransform;
    this.context.setTransform(t[0], t[1], t[2], t[3], t[4], t[5]);
  }
}
