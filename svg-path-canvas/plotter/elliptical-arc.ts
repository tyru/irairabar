import * as glMatrix from 'gl-matrix';
import { Command, EllipticalArcCommand } from 'svg-path-parser';
import { SVGFunction } from './index';
import { getAngle } from '../util';


export function createEllipticalArcCommand(cmd: EllipticalArcCommand, originalCmd: Command): SVGFunction {
  // https://www.w3.org/TR/SVG11/implnote.html#ArcOutOfRangeParameters
  const rx = Math.abs(cmd.rx);
  const ry = Math.abs(cmd.ry);
  const xAxisRotation = cmd.xAxisRotation * Math.PI / 180 < 0 ?
    (cmd.xAxisRotation % 360) + 360 : cmd.xAxisRotation % 360;

  function p0EllipticalArcCommand(p0: [number, number]) {
    const { theta1, deltaTheta, finalMat2d } = calcConstants(
      p0[0], p0[1], rx, ry, xAxisRotation, cmd.largeArc, cmd.sweep, cmd.x, cmd.y,
    );

    function ellipticalArcCommand(t: number) {
      const angle = theta1 + t * deltaTheta;

      const xy = glMatrix.vec2.fromValues(
        rx * Math.cos(angle),
        ry * Math.sin(angle),
      );
      glMatrix.vec2.transformMat2d(xy, xy, finalMat2d);

      const [x, y] = [xy[0], xy[1]];

      return { x, y, angle };
    }

    return Object.assign(ellipticalArcCommand, { p0 });
  }

  return Object.assign(p0EllipticalArcCommand, { cmd, originalCmd });
}

/**
  * cf.
  * https://www.w3.org/TR/SVG11/implnote.html#ArcConversionEndpointToCenter
  */
function calcConstants(
  x1: number,
  y1: number,
  rx: number,
  ry: number,
  xAxisRotation: number,
  largeArc: boolean,
  sweep: boolean,
  x: number,
  y: number,
) {
  const rot = xAxisRotation / 180 * Math.PI;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const [x2, y2] = [x, y];

  const dx1y1Vec2 = glMatrix.vec2.fromValues((x1 - x2) / 2, (y1 - y2) / 2);
  glMatrix.vec2.transformMat2(dx1y1Vec2, dx1y1Vec2, glMatrix.mat2.fromValues(cos, -sin, sin, cos));
  const [dx1, dy1] = [dx1y1Vec2[0], dx1y1Vec2[1]];

  // https://www.w3.org/TR/SVG11/implnote.html#ArcCorrectionOutOfRangeRadii
  let delta = (dx1 * dx1) / (rx * rx) + (dy1 * dy1) / (ry * ry)
  if (delta > 1) {
    delta = Math.sqrt(delta);
    rx = delta * rx;
    ry = delta * ry;
  }

  const rxDouble = rx * rx;
  const ryDouble = ry * ry;
  const dx1Double = dx1 * dx1;
  const dy1Double = dy1 * dy1;
  let dcxyScalar = (rxDouble * ryDouble - rxDouble * dy1Double - ryDouble * dx1Double);
  dcxyScalar /= (rxDouble * dy1Double + ryDouble * dx1Double);
  dcxyScalar = Math.sqrt(dcxyScalar);
  if (largeArc === sweep) {
    dcxyScalar = -dcxyScalar;
  }

  const dcxyVec2 = glMatrix.vec2.fromValues(
    rx * dy1 / ry,
    ry * dx1 / -rx,
  );
  glMatrix.vec2.multiply(dcxyVec2, dcxyVec2, glMatrix.vec2.fromValues(dcxyScalar, dcxyScalar));
  const [dcx, dcy] = [dcxyVec2[0], dcxyVec2[1]];

  const cxyVec2 = glMatrix.vec2.clone(dcxyVec2);
  glMatrix.vec2.transformMat2d(
    cxyVec2, cxyVec2, glMatrix.mat2d.fromValues(cos, sin, -sin, cos, (x1 + x2) / 2, (y1 + y2) / 2)
  );
  const [cx, cy] = [cxyVec2[0], cxyVec2[1]];

  const startVec = <[number, number]> [
    (dx1 - dcx) / rx,
    (dy1 - dcy) / ry,
  ];
  const theta1 = getAngle(
    [1, 0],
    startVec,
  );
  let deltaTheta = getAngle(
    startVec,
    [(-dx1 - dcx) / rx, (-dy1 - dcy) / ry],
  ) % (Math.PI * 2);
  if (!sweep && deltaTheta > 0) {
    deltaTheta -= Math.PI * 2;
  } else if (sweep && deltaTheta < 0) {
    deltaTheta += Math.PI * 2;
  }

  const finalMat2d = glMatrix.mat2d.fromValues(
    cos, sin, -sin, cos, cx, cy
  );

  return { theta1, deltaTheta, finalMat2d };
}
