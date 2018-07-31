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
    } else if (MoveLine.isClosePathCommand(cmd)) {
      return this.nextClosePath(cmd);
    } else if (MoveLine.isCurveToCommand(cmd)) {
      return this.nextCurveTo(cmd);
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

  private nextCurveTo(cmd: svgParser.CurveToCommand) {
    const p0 = glMatrix.vec2.fromValues(this.startCmdPoint[4], this.startCmdPoint[5]);
    const p1 = glMatrix.vec2.fromValues(cmd.x1, cmd.y1);
    const p2 = glMatrix.vec2.fromValues(cmd.x2, cmd.y2);
    const p3 = glMatrix.vec2.fromValues(cmd.x, cmd.y);
    const t = this.tick / glMatrix.vec2.distance(p0, p3);
    console.log('t =', t);

    if (1 - t < 0.001) {
      return new MoveLine(this.cmds.slice(1), this.startPoint, this._point);
    }

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

    // const dx = (3 * Math.pow(t, 2) * (3 * p1[0] + p3[0] - 3 * p2[0] - p0[0])) +
    //            (2 * t * (3 * (p0[0] - 2 * p1[0] + p2[0]))) +
    //            (3 * (p1[0] - p0[0]));
    // const dy = (3 * Math.pow(t, 2) * (3 * p1[1] + p3[1] - 3 * p2[1] - p0[1])) +
    //            (2 * t * (3 * (p0[1] - 2 * p1[1] + p2[1]))) +
    //            (3 * (p1[1] - p0[1]));
    // console.log('a =', (dy / dx), dx, dy);
    //
    // const acosArg = Math.min(Math.max(1 / (dy / dx), -1), 1);
    // const angle = Math.acos(acosArg);
    // const angleForYaxis = angle - Math.PI / 2;
    // console.log('angle', angle, angle * 180 / Math.PI);
    // console.log('angleForYaxis', angleForYaxis, angleForYaxis * 180 / Math.PI);

    // glMatrix.mat2d.fromRotation(this._point, angleForYaxis);

    const angle = Math.PI / 2 * t;
    glMatrix.mat2d.fromRotation(this._point, angle);
    this._point[4] = p[0];
    this._point[5] = p[1];

    console.log('point', this._point);

    return this;
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
    private readonly bottomWall: boolean,
    private readonly blockLayers: BlockLayer[]) { }

  draw() {
    const x = this.width * this.col;
    const y = this.height * this.row;

    this.context.fillStyle = this.bottomWall ? 'black' : 'white';
    this.context.fillRect(x, y, this.width, this.height);

    this.context.fillStyle = this.bottomWall ? 'white' : 'black';
    this.context.fillText(`(${this.col},${this.row})`, x + 20, y + 20);
  }

  call(stage: Stage) {
    this.width = stage.width;
    this.height = stage.height;
    stage.setBlock(this.col, this.row, this);
  }
}

export class BlockLayer {
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
