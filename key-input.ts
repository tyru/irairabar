import * as glMatrix from 'gl-matrix';

export default class KeyInput {
  public left = false;
  public up = false;
  public right = false;
  public down = false;

  toMat2d(scalar: number = 1) {
    const x = this.left ? -1 : this.right ? 1 : 0;
    const y = this.up   ? -1 : this.down  ? 1 : 0;
    return glMatrix.mat2d.fromValues(1, 0, 0, 1, x * scalar, y * scalar);
  }
}
