import * as svgParser from 'svg-path-parser';
const { parseSVG, makeAbsolute } = svgParser;

// Make SVG path string to 'SVGCommand' instances.
// 'SVGCommand' only holds absolute paths
// unlike svg-path-parser.Command'.
export function parse(path: string): SVGCommand[] {
  // TODO: parse unique commands
  return <SVGCommand[]> makeAbsolute(parseSVG(path));
}

export interface SVGCommand extends svgParser.Command {
  relative?: false;
}

export interface MoveToCommand {
  code: 'M';
  command: 'moveto';
  relative?: false;
  x: number;
  y: number;
}

export interface LineToCommand {
  code: 'L';
  command: 'lineto';
  relative?: false;
  x: number;
  y: number;
}

export interface HorizontalLineToCommand {
  code: 'H';
  command: 'horizontal lineto';
  relative?: false;
  x: number;
}

export interface VerticalLineToCommand {
  code: 'V';
  command: 'vertical lineto';
  relative?: false;
  y: number;
}

export interface CurveToCommand {
  code: 'C';
  command: 'curveto';
  relative?: false;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x: number;
  y: number;
}

export interface SmoothCurveToCommand {
  code: 'S';
  command: 'smooth curveto';
  relative?: false;
  x2: number;
  y2: number;
  x: number;
  y: number;
}

export interface QuadraticCurveToCommand {
  code: 'Q';
  command: 'quadratic curveto';
  relative?: false;
  x1: number;
  y1: number;
  x: number;
  y: number;
}

export interface SmoothQuadraticCurveToCommand {
  code: 'T';
  command: 'smooth quadratic curveto';
  relative?: false;
  x: number;
  y: number;
}

export interface EllipticalArcCommand {
  code: 'A';
  command: 'elliptical arc';
  relative?: false;
  rx: number;
  ry: number;
  xAxisRotation: number;
  largeArc: boolean;
  sweep: boolean;
  x: number;
  y: number;
}

export interface ClosePathCommand {
  code: 'Z';
  command: 'closepath';
  relative?: false;
}
