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
    } else {
      throw new Error(`not implemented yet: cmd = ${cmd.toString()}`);
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
    const dx = Math.abs(cmd.x - initX);
    const dy = Math.abs(cmd.y - initY);
    let x, y;
    if (dx > dy) {
      x = initX + signX * this.tick;
      y = initY + signY * dy / dx * this.tick;
    } else {
      x = initX + signX * dx / dy * this.tick;
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

  call(stage: Stage) {
    stage.moveLine = this;
  }
}

export class Block implements Callable {
  constructor(
    private readonly context: CanvasRenderingContext2D,
    private readonly col: number,
    private readonly row: number,
    private readonly bottomWall: boolean,
    private readonly blockLayers: BlockLayer[]) { }

  draw(stage: Stage, point: glMatrix.mat2d) {
    const x = point[4];
    const y = point[5];

    this.context.fillStyle = this.bottomWall ? 'black' : 'white';
    this.context.fillRect(x, y, stage.width, stage.height);

    // TODO: debug
    this.context.fillStyle = this.bottomWall ? 'white' : 'black';
    this.context.fillText(`(${this.col},${this.row})`, x + 20, y + 20);
  }

  call(stage: Stage) {
    stage.setBlock(this.col, this.row, this);
  }
}

export class BlockLayer {
}

export class Stage {
  private _moveLine = new MoveLine('M 0 0');
  private readonly blocks = new Map<string, Block>();

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
  public getBlockFromPoint(x: number, y: number) {
    const col = Math.floor(x / this.width);
    const row = Math.floor(y / this.height);
    return this.blocks.get(`${col}-${row}`);
  }

  move() {
    this.moveLine = this.moveLine.next();
    const p = this.moveLine.point;
    this.context.setTransform(p[0], p[1], p[2], p[3], 0, 0);
  }

  draw() {
    const topLeft = [this.x, this.y];
    const topRight = [this.x + this.width, this.y];
    const bottomLeft = [this.x, this.y + this.height];
    const bottomRight = [this.x + this.width, this.y + this.height];
    const point = this.point;

    [topLeft, topRight, bottomLeft, bottomRight].forEach(([x, y]) => {
      const col = Math.floor(x / this.width);
      const row = Math.floor(y / this.height);
      const block = this.blocks.get(`${col}-${row}`);
      if (block) {
        point[4] = this.width * col - this.x;
        point[5] = this.height * row - this.y;
        block.draw(this, point);
      }
    });
  }
}
