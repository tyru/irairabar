import * as glMatrix from 'gl-matrix';
import * as svgParser from 'svg-path-parser';
const { parseSVG, makeAbsolute } = svgParser;
import { getAngle } from './util';

import { createLineToCommand } from './lineto';
import { createCurveToCommand } from './curveto';
import { createQuadraticCurveToCommand } from './quadratic-curveto';
import { createEllipticalArcCommand } from './elliptical-arc';

export interface LinearFunction {
  a: number;
  b: number;
}

export interface LinearFunctionResult {
  x: number;
  y: number;
  angle: number;
}

declare type SVGFastFunction_ = (t: number) => LinearFunctionResult
export interface SVGFastFunction extends SVGFastFunction_ {
  p0: [number, number];
}
export type SVGFunction = (p0: [number, number]) => SVGFastFunction;

export module SVGFastFunction {
  let p0: [number, number];
}

const equalsPoint = glMatrix.vec2.equals;

export function compileSVGPath(path: string, interpolate = true): [[number, number], SVGFunction[]] {
  const parsedCmds = makeAbsolute(parseSVG(path));
  if (parsedCmds.length === 0) {
    throw new Error('empty svg path');
  }
  const [moveTo, ...rest] = parsedCmds;
  if (!isMoveToCommand(moveTo)) {
    throw new Error('the first command must be M command');
  }

  const first = <[number, number]> [moveTo.x, moveTo.y];
  let current = <[number, number]> [moveTo.x, moveTo.y];
  const prevCmds = <svgParser.Command[]> [];

  // Convert SVG commands to SVGFunction[]
  const functions = rest.reduce((results: SVGFunction[], originalCmd: svgParser.Command) => {
    const cmd = normalizeCmd(originalCmd, prevCmds, current, first);
    prevCmds.push(cmd);
    const p = getDestPoint(cmd);
    if (equalsPoint(p, current)) {
      return results;
    }
    current = p;
    return [...results, getFuncByCmd(cmd)];
  }, <SVGFunction[]> []);

  // Check the current point == the first point
  if (interpolate && !equalsPoint(current, first)) {
    const closePathFunc = getFuncByCmd(lineToCmd(first[0], first[1]));
    functions.push(closePathFunc);
  }

  return [first, functions];
}

function normalizeCmd(
  cmd: svgParser.Command,
  prevCmds: svgParser.Command[],
  current: [number, number],
  first: [number, number],
): svgParser.Command {
  if (isHorizontalLineToCommand(cmd)) {
    return lineToCmd(cmd.x, current[1]);
  }
  if (isVerticalLineToCommand(cmd)) {
    return lineToCmd(current[0], cmd.y);
  }
  if (isClosePathCommand(cmd)) {
    return lineToCmd(first[0], first[1]);
  }
  // https://www.w3.org/TR/SVG11/implnote.html#ArcOutOfRangeParameters
  if (isEllipticalArcCommand(cmd) && cmd.rx === 0 && cmd.ry === 0) {
    return lineToCmd(cmd.x, cmd.y);
  }
  if (isSmoothCurveToCommand(cmd)) {
    throw new Error('s,S command is not implemented yet');    // TODO
  }
  if (isSmoothQuadraticCurveToCommand(cmd)) {
    throw new Error('t,T command is not implemented yet');    // TODO
  }
  return cmd;
}

function lineToCmd(x: number, y: number) {
  return <svgParser.LineToCommand> {
    code: 'L', command: 'lineto', x, y,
  };
}

function getDestPoint(cmd: svgParser.Command): [number, number] {
  if (isLineToCommand(cmd) || isCurveToCommand(cmd) ||
      isQuadraticCurveToCommand(cmd) || isEllipticalArcCommand(cmd)) {
    return [cmd.x, cmd.y];
  } else {
    // All SVG commands takes destination point!
    throw new Error(`could not get point from ${cmd.code}: cmd = ${JSON.stringify(cmd)}`);
  }
}

function getFuncByCmd(cmd: svgParser.Command): SVGFunction {
  if (isLineToCommand(cmd)) {
    return createLineToCommand(cmd);
  } else if (isCurveToCommand(cmd)) {
    return createCurveToCommand(cmd);
  } else if (isQuadraticCurveToCommand(cmd)) {
    return createQuadraticCurveToCommand(cmd);
  } else if (isEllipticalArcCommand(cmd)) {
    return createEllipticalArcCommand(cmd);
  } else {
    throw new Error(`${cmd.code} command is not implemented yet: cmd = ${JSON.stringify(cmd)}`);
  }
}

function isMoveToCommand(cmd: svgParser.Command): cmd is svgParser.MoveToCommand {
  return cmd.command === 'moveto';
}

function isLineToCommand(cmd: svgParser.Command): cmd is svgParser.LineToCommand {
  return cmd.command === 'lineto';
}

function isHorizontalLineToCommand(cmd: svgParser.Command): cmd is svgParser.HorizontalLineToCommand {
  return cmd.command === 'horizontal lineto';
}

function isVerticalLineToCommand(cmd: svgParser.Command): cmd is svgParser.VerticalLineToCommand {
  return cmd.command === 'vertical lineto';
}

function isClosePathCommand(cmd: svgParser.Command): cmd is svgParser.ClosePathCommand {
  return cmd.command === 'closepath';
}

function isSmoothCurveToCommand(cmd: svgParser.Command): cmd is svgParser.SmoothCurveToCommand {
  return cmd.command === 'smooth curveto';
}

function isSmoothQuadraticCurveToCommand(cmd: svgParser.Command): cmd is svgParser.SmoothQuadraticCurveToCommand {
  return cmd.command === 'smooth quadratic curveto';
}

function isCurveToCommand(cmd: svgParser.Command): cmd is svgParser.CurveToCommand {
  return cmd.command === 'curveto';
}

function isQuadraticCurveToCommand(cmd: svgParser.Command): cmd is svgParser.QuadraticCurveToCommand {
  return cmd.command === 'quadratic curveto';
}

function isEllipticalArcCommand(cmd: svgParser.Command): cmd is svgParser.EllipticalArcCommand {
  return cmd.command === 'elliptical arc';
}


export function compileAndOptimizeSVGPath(path: string, interpolate = true): SVGFastFunction[] {
  const [first, functions] = compileSVGPath(path, interpolate);
  return optimizeFunctions(first, functions);
}

export function optimizeFunctions(first: [number, number], functions: SVGFunction[]): SVGFastFunction[] {
  if (functions.length === 0) {
    throw new Error('no functions');
  }
  return optimize(first, functions);
}

function optimize(p0: [number, number], [head, ...rest] : SVGFunction[]): SVGFastFunction[] {
  const fast = head(p0);
  if (rest.length === 0) {
    return [fast];
  }
  const next = fast(1);
  return [fast, ...optimize([next.x, next.y], rest)];
}
