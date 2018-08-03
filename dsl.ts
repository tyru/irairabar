import * as glMatrix from 'gl-matrix';
import * as svgParser from 'svg-path-parser';
import { plotter } from './svg-path-canvas';

interface Callable {
  call(stage: Stage): void
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
  private readonly blocks = new Map<string, Block>();
  private tick = 0;
  private currentTransform = glMatrix.mat2d.create();

  constructor(
    private readonly context: CanvasRenderingContext2D,
    public readonly width: number,
    public readonly height: number,
    private readonly maxTick: number,
    private readonly svgFunctions: plotter.SVGFastFunction[],
    private readonly ops: Callable[]) {
    ops.forEach(op => op.call(this));
  }

  public setBlock(col: number, row: number, block: Block) {
    this.blocks.set(`${col}-${row}`, block);
  }

  move(): void {
    if (this.svgFunctions.length === 0) {
      return;
    }
    if (this.tick > this.maxTick) {
      this.tick = 0;
      this.svgFunctions.splice(0, 1);
      return this.move();
    }
    const t = this.tick++ / this.maxTick; // 0 <= t <= 1
    const { x, y, angle } = this.svgFunctions[0](t);
    const inverseAngle = (angle + Math.PI) % (Math.PI * 2)

    const { name, p0 } = this.svgFunctions[0];
    console.log(`${name}([${p0[0].toFixed(1)}, ${p0[1].toFixed(1)}])(${t}) = { x:${x.toFixed(1)}, y:${y.toFixed(1)}, angle:${angle} (${(angle * 180 / Math.PI).toFixed(1)}) }`);
    console.log(`${name}: inverseAngle = ${inverseAngle} (${(inverseAngle * 180 / Math.PI).toFixed(1)})`);

    const m = glMatrix.mat2d.create();
    glMatrix.mat2d.fromRotation(m, inverseAngle);
    m[4] = x;
    m[5] = y;
    if (!glMatrix.mat2d.invert(m, m)) {
      throw new Error('could not invert matrix: ' + Array.from(m).toString());
    }
    console.log(`${name}: m =`, m);
    this.currentTransform = m;
    this.context.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
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
    const m = this.currentTransform;
    this.context.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
  }
}
