import * as parser from './parser';
export const parse = parser.parse;

import { vec2 } from 'gl-matrix';
const equalsPoint = vec2.equals;

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

declare type SVGFastFunction_ = (t: number) => LinearFunctionResult;
export interface SVGFastFunction extends SVGFastFunction_ {
  p0: [number, number];
}
declare type SVGFunction_ = (p0: [number, number]) => SVGFastFunction;
export interface SVGFunction extends SVGFunction_ {
  cmd: parser.SVGCommand;
  originalCmd: parser.SVGCommand;
}
declare type SVGComposedFunction_ = (t: number) => LinearFunctionResult;
export interface SVGComposedFunction extends SVGComposedFunction_ {
  p0: [number, number];
  functions: SVGFastFunction[];
  index(t: number): number;
  time(i: number, t: number): number;
}

export function isSVGFastFunction(value: any): value is SVGFastFunction {
  return typeof value === 'function' && Array.isArray(value.p0) && value.p0.length === 2;
}
export function isSVGFastFunctionArray(value: any[]): value is SVGFastFunction[] {
  return value.every(isSVGFastFunction);
}

export function compile(path: string | parser.SVGCommand[], interpolate = true): [[number, number], SVGFunction[]] {
  const parsedCmds = typeof path === 'string' ? parse(path) : path;
  if (parsedCmds.length === 0) {
    throw new Error('empty svg path');
  }
  const [moveTo, ...rest] = parsedCmds;
  if (!isMoveToCommand(moveTo)) {
    throw new Error('the first command must be M command');
  }

  const first = <[number, number]> [moveTo.x, moveTo.y];
  let current = <[number, number]> [moveTo.x, moveTo.y];
  const prevCmds = <parser.SVGCommand[]> [];

  // Convert SVG commands to SVGFunction[]
  const functions = rest.reduce((results: SVGFunction[], originalCmd: parser.SVGCommand) => {
    const cmd = normalizeCmd(originalCmd, prevCmds, current, first);
    prevCmds.push(cmd);
    const p = getDestPoint(cmd);
    if (equalsPoint(p, current)) {
      return results;
    }
    current = p;
    return [...results, getFuncByCmd(cmd, originalCmd)];
  }, <SVGFunction[]> []);

  // Check the current point == the first point
  if (interpolate && !equalsPoint(current, first)) {
    const cmd = lineToCmd(first[0], first[1]);
    const closePathFunc = getFuncByCmd(cmd, cmd);
    functions.push(closePathFunc);
  }

  return [first, functions];
}

function normalizeCmd(
  cmd: parser.SVGCommand,
  _prevCmds: parser.SVGCommand[],
  current: [number, number],
  first: [number, number],
): parser.SVGCommand {
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
  return <parser.LineToCommand> {
    code: 'L', command: 'lineto', x, y,
  };
}

function getDestPoint(cmd: parser.SVGCommand): [number, number] {
  if (isLineToCommand(cmd) || isCurveToCommand(cmd) ||
      isQuadraticCurveToCommand(cmd) || isEllipticalArcCommand(cmd)) {
    return [cmd.x, cmd.y];
  } else {
    // All SVG commands takes destination point!
    throw new Error(`could not get point from ${cmd.code}: cmd = ${JSON.stringify(cmd)}`);
  }
}

function getFuncByCmd(cmd: parser.SVGCommand, originalCmd: parser.SVGCommand): SVGFunction {
  if (isLineToCommand(cmd)) {
    return createLineToCommand(cmd, originalCmd);
  } else if (isCurveToCommand(cmd)) {
    return createCurveToCommand(cmd, originalCmd);
  } else if (isQuadraticCurveToCommand(cmd)) {
    return createQuadraticCurveToCommand(cmd, originalCmd);
  } else if (isEllipticalArcCommand(cmd)) {
    return createEllipticalArcCommand(cmd, originalCmd);
  } else {
    throw new Error(`${cmd.code} command is not implemented yet: cmd = ${JSON.stringify(cmd)}`);
  }
}

function isMoveToCommand(cmd: parser.SVGCommand): cmd is parser.MoveToCommand {
  return cmd.command === 'moveto';
}

function isLineToCommand(cmd: parser.SVGCommand): cmd is parser.LineToCommand {
  return cmd.command === 'lineto';
}

function isHorizontalLineToCommand(cmd: parser.SVGCommand): cmd is parser.HorizontalLineToCommand {
  return cmd.command === 'horizontal lineto';
}

function isVerticalLineToCommand(cmd: parser.SVGCommand): cmd is parser.VerticalLineToCommand {
  return cmd.command === 'vertical lineto';
}

function isClosePathCommand(cmd: parser.SVGCommand): cmd is parser.ClosePathCommand {
  return cmd.command === 'closepath';
}

function isSmoothCurveToCommand(cmd: parser.SVGCommand): cmd is parser.SmoothCurveToCommand {
  return cmd.command === 'smooth curveto';
}

function isSmoothQuadraticCurveToCommand(cmd: parser.SVGCommand): cmd is parser.SmoothQuadraticCurveToCommand {
  return cmd.command === 'smooth quadratic curveto';
}

function isCurveToCommand(cmd: parser.SVGCommand): cmd is parser.CurveToCommand {
  return cmd.command === 'curveto';
}

function isQuadraticCurveToCommand(cmd: parser.SVGCommand): cmd is parser.QuadraticCurveToCommand {
  return cmd.command === 'quadratic curveto';
}

function isEllipticalArcCommand(cmd: parser.SVGCommand): cmd is parser.EllipticalArcCommand {
  return cmd.command === 'elliptical arc';
}


export function compileFast(path: string | SVGFunction[], first?: [number, number], interpolate = true): SVGFastFunction[] {
  let functions: SVGFunction[];
  if (typeof path === 'string') {
    [first, functions] = compile(path, interpolate);
  } else if (Array.isArray(path)) {
    if (!first) {
      throw new Error('compileFast(): must specify first point to the 2nd argument');
    }
    functions = path;
  } else {
    throw new Error('compileFast(): invalid type arguments');
  }
  if (functions.length === 0) {
    throw new Error('compileFast(): no functions were given');
  }
  return doCompileFast(first, functions);
}

function doCompileFast(p0: [number, number], [f, ...xs] : SVGFunction[]): SVGFastFunction[] {
  const fast = f(p0);
  if (xs.length === 0) {
    return [fast];
  }
  const next = fast(1);
  return [fast, ...doCompileFast([next.x, next.y], xs)];
}

export function compose(path: string | SVGFunction[] | SVGFastFunction[], first?: [number, number], interpolate = true): SVGComposedFunction {
  let functions: SVGFastFunction[];
  if (Array.isArray(path) && isSVGFastFunctionArray(path)) {
    functions = path;
  } else {
    functions = compileFast(path, first, interpolate);
  }
  if (functions.length === 0) {
    throw new Error('compose(): no functions were given');
  }
  return doCompose(functions);
}

function doCompose(functions: SVGFastFunction[]): SVGComposedFunction {
  function index(t: number) {
    let i = t * functions.length;
    if (i === functions.length) {
      i = functions.length - 1;
    }
    return Math.floor(i);
  }
  function time(i: number, t: number) {
    return functions.length * t - i;
  }
  function composedFunc(t: number): LinearFunctionResult {
    const i = index(t);
    return functions[i](time(i, t));
  }

  const p0 = functions[0].p0;
  return Object.assign(composedFunc, {
    p0, functions, index, time
  });
}
