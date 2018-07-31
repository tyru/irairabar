
export default class Color {
  private constructor(
    public readonly r: number,
    public readonly g: number,
    public readonly b: number,
    public readonly a: number = 1,
  ) {
    if (r < 0 || r > 255) {
      throw new Error(`Color: r = ${r}`);
    }
    if (g < 0 || g > 255) {
      throw new Error(`Color: g = ${g}`);
    }
    if (b < 0 || b > 255) {
      throw new Error(`Color: b = ${b}`);
    }
    if (a < 0 || a > 1) {
      throw new Error(`Color: a = ${a}`);
    }
  }

  public static fromRGB(r: number, g: number, b: number) {
    return new Color(r, g, b);
  }

  toRGBAString() {
    return `rgba(${this.r},${this.g},${this.b},${this.a})`;
  }
}
