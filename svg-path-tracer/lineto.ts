import * as glMatrix from 'gl-matrix';
import { LineToCommand } from 'svg-path-parser';
import { SVGFunction } from './index';
import { getAngle } from './util';

export function createLineToCommand(cmd: LineToCommand): SVGFunction {
  return function p0LineToCommand(p0: [number, number]) {
    const angle0 = getAngle([1, 0], [cmd.x - p0[0], cmd.y - p0[1]]);
    const angle = angle0 - Math.PI * 0.5;
    const distance = glMatrix.vec2.distance(p0, [cmd.x, cmd.y]);

    function lineToCommand(t: number) {
      const x = p0[0] + t * distance * Math.cos(angle0);
      const y = p0[1] + t * distance * Math.sin(angle0);
      return { x, y, angle };
    }

    return Object.assign(lineToCommand, { p0 });
  };
}
