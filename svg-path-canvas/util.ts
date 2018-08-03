import * as glMatrix from 'gl-matrix';

export function getAngle(v1: [number, number], v2: [number, number]) {
  const cross = v1[0] * v2[1] - v1[1] * v2[0];
  return (cross < 0 ? -1 : 1) * glMatrix.vec2.angle(v1, v2);
}
