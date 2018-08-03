import * as glMatrix from 'gl-matrix';
import { Command, CurveToCommand } from 'svg-path-parser';
import { SVGFunction } from './index';
import { getAngle } from '../util';

/**
  * cf.
  * https://postd.cc/bezier-curves/
  * https://en.wikipedia.org/wiki/B%C3%A9zier_curve
  */
export function createCurveToCommand(cmd: CurveToCommand, originalCmd: Command): SVGFunction {
  const p1 = glMatrix.vec2.fromValues(cmd.x1, cmd.y1);
  const p2 = glMatrix.vec2.fromValues(cmd.x2, cmd.y2);
  const p3 = glMatrix.vec2.fromValues(cmd.x, cmd.y);
  const theta2 = getAngle([1, 0], [p3[0] - p2[0], p3[1] - p2[1]]);

  function p0CurveToCommand(p0: [number, number]) {
    const theta1 = getAngle([1, 0], [p1[0] - p0[0], p1[1] - p0[1]]);
    const deltaTheta = theta2 - theta1;

    function curveToCommand(t: number) {
      // Calculate angle from control points
      const angle0 = theta1 + t * deltaTheta;
      const angle = angle0 - Math.PI * 0.5;

      // Calculate current point on the curve
      let k;

      k = Math.pow(1 - t, 3);
      const v0 = glMatrix.vec2.create();
      glMatrix.vec2.multiply(v0, glMatrix.vec2.fromValues(k, k), p0);

      k = 3 * Math.pow(1 - t, 2) * t;
      const v1 = glMatrix.vec2.create();
      glMatrix.vec2.multiply(v1, glMatrix.vec2.fromValues(k, k), p1);

      k = 3 * (1 - t) * Math.pow(t, 2);
      const v2 = glMatrix.vec2.create();
      glMatrix.vec2.multiply(v2, glMatrix.vec2.fromValues(k, k), p2);

      k = Math.pow(t, 3);
      const v3 = glMatrix.vec2.create();
      glMatrix.vec2.multiply(v3, glMatrix.vec2.fromValues(k, k), p3);

      const xy = glMatrix.vec2.create();
      glMatrix.vec2.add(xy, v0, v1);
      glMatrix.vec2.add(xy, xy, v2);
      glMatrix.vec2.add(xy, xy, v3);

      const [x, y] = [xy[0], xy[1]];

      return { x, y, angle };
    }

    return Object.assign(curveToCommand, { p0 });
  }

  return Object.assign(p0CurveToCommand, { cmd, originalCmd });
}
