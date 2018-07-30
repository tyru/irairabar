import * as glMatrix from 'gl-matrix';

interface Callable {
  call(stage: Stage): void
}

export class StartFrom implements Callable {
  constructor(
    private readonly x: number,
    private readonly y: number) { }

  call(stage: Stage) {
    glMatrix.vec2.set(stage.point, stage.width * this.x, stage.height * this.y);
  }
}

export class Block implements Callable {
  constructor(
    private readonly context: CanvasRenderingContext2D,
    private readonly col: number,
    private readonly row: number,
    private readonly bottomWall: boolean,
    private readonly blockLayers: BlockLayer[]) { }

  draw(stage: Stage, x: number, y: number) {
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
  public readonly point = glMatrix.vec2.create();
  private readonly moveVec = glMatrix.vec2.fromValues(0, -1);
  private readonly blocks = new Map<string, Block>();

  get x() { return this.point[0] }
  get y() { return this.point[1] }

  constructor(
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
    glMatrix.vec2.add(this.point, this.point, this.moveVec);
  }

  draw() {
    const topLeft = [this.x, this.y];
    const topRight = [this.x + this.width, this.y];
    const bottomLeft = [this.x, this.y + this.height];
    const bottomRight = [this.x + this.width, this.y + this.height];

    [topLeft, topRight, bottomLeft, bottomRight].forEach(([x, y]) => {
      const col = Math.floor(x / this.width);
      const row = Math.floor(y / this.height);
      const block = this.blocks.get(`${col}-${row}`);
      if (block) {
        block.draw(this, this.width * col - this.x, this.height * row - this.y);
      }
    });
  }
}
