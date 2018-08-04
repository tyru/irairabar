
export default class Color {
  private static cache = new Map<string, Color>();

  // https://developer.mozilla.org/ja/docs/Web/CSS/color_value
  public static readonly BLACK = Color.fromRGB(0, 0, 0);
  public static readonly SILVER = Color.fromRGB(192, 192, 192);
  public static readonly GRAY = Color.fromRGB(128, 128, 128);
  public static readonly WHITE = Color.fromRGB(255, 255, 255);
  public static readonly MAROON = Color.fromRGB(128, 0, 0);
  public static readonly RED = Color.fromRGB(255, 0, 0);
  public static readonly PURPLE = Color.fromRGB(128, 0, 128);
  public static readonly FUCHSIA = Color.fromRGB(255, 0, 255);
  public static readonly GREEN = Color.fromRGB(0, 128, 0);
  public static readonly LIME = Color.fromRGB(0, 255, 0);
  public static readonly OLIVE = Color.fromRGB(128, 128, 0);
  public static readonly YELLOW = Color.fromRGB(255, 255, 0);
  public static readonly NAVY = Color.fromRGB(0, 0, 128);
  public static readonly BLUE = Color.fromRGB(0, 0, 255);
  public static readonly TEAL = Color.fromRGB(0, 128, 128);
  public static readonly AQUA = Color.fromRGB(0, 255, 255);
  // CSS Level 2 (Revision 1);
  public static readonly ORANGE = Color.fromRGB(255, 165, 0);
  // CSS Color Module Level 3
  public static readonly ALICEBLUE = Color.fromRGB(240, 248, 255);
  public static readonly ANTIQUEWHITE = Color.fromRGB(250, 235, 215);
  public static readonly AQUAMARINE = Color.fromRGB(127, 255, 212);
  public static readonly AZURE = Color.fromRGB(240, 255, 255);
  public static readonly BEIGE = Color.fromRGB(245, 245, 220);
  public static readonly BISQUE = Color.fromRGB(255, 228, 196);
  public static readonly BLANCHEDALMOND = Color.fromRGB(255, 235, 205);
  public static readonly BLUEVIOLET = Color.fromRGB(138, 43, 226);
  public static readonly BROWN = Color.fromRGB(165, 42, 42);
  public static readonly BURLYWOOD = Color.fromRGB(222, 184, 135);
  public static readonly CADETBLUE = Color.fromRGB(95, 158, 160);
  public static readonly CHARTREUSE = Color.fromRGB(127, 255, 0);
  public static readonly CHOCOLATE = Color.fromRGB(210, 105, 30);
  public static readonly CORAL = Color.fromRGB(255, 127, 80);
  public static readonly CORNFLOWERBLUE = Color.fromRGB(100, 149, 237);
  public static readonly CORNSILK = Color.fromRGB(255, 248, 220);
  public static readonly CRIMSON = Color.fromRGB(220, 20, 60);
  public static readonly CYAN = Color.fromRGB(0, 255, 255);
  public static readonly DARKBLUE = Color.fromRGB(0, 0, 139);
  public static readonly DARKCYAN = Color.fromRGB(0, 139, 139);
  public static readonly DARKGOLDENROD = Color.fromRGB(184, 134, 11);
  public static readonly DARKGRAY = Color.fromRGB(169, 169, 169);
  public static readonly DARKGREEN = Color.fromRGB(0, 100, 0);
  public static readonly DARKGREY = Color.fromRGB(169, 169, 169);
  public static readonly DARKKHAKI = Color.fromRGB(189, 183, 107);
  public static readonly DARKMAGENTA = Color.fromRGB(139, 0, 139);
  public static readonly DARKOLIVEGREEN = Color.fromRGB(85, 107, 47);
  public static readonly DARKORANGE = Color.fromRGB(255, 140, 0);
  public static readonly DARKORCHID = Color.fromRGB(153, 50, 204);
  public static readonly DARKRED = Color.fromRGB(139, 0, 0);
  public static readonly DARKSALMON = Color.fromRGB(233, 150, 122);
  public static readonly DARKSEAGREEN = Color.fromRGB(143, 188, 143);
  public static readonly DARKSLATEBLUE = Color.fromRGB(72, 61, 139);
  public static readonly DARKSLATEGRAY = Color.fromRGB(47, 79, 79);
  public static readonly DARKSLATEGREY = Color.fromRGB(47, 79, 79);
  public static readonly DARKTURQUOISE = Color.fromRGB(0, 206, 209);
  public static readonly DARKVIOLET = Color.fromRGB(148, 0, 211);
  public static readonly DEEPPINK = Color.fromRGB(255, 20, 147);
  public static readonly DEEPSKYBLUE = Color.fromRGB(0, 191, 255);
  public static readonly DIMGRAY = Color.fromRGB(105, 105, 105);
  public static readonly DIMGREY = Color.fromRGB(105, 105, 105);
  public static readonly DODGERBLUE = Color.fromRGB(30, 144, 255);
  public static readonly FIREBRICK = Color.fromRGB(178, 34, 34);
  public static readonly FLORALWHITE = Color.fromRGB(255, 250, 240);
  public static readonly FORESTGREEN = Color.fromRGB(34, 139, 34);
  public static readonly GAINSBORO = Color.fromRGB(220, 220, 220);
  public static readonly GHOSTWHITE = Color.fromRGB(248, 248, 255);
  public static readonly GOLD = Color.fromRGB(255, 215, 0);
  public static readonly GOLDENROD = Color.fromRGB(218, 165, 32);
  public static readonly GREENYELLOW = Color.fromRGB(173, 255, 47);
  public static readonly GREY = Color.fromRGB(128, 128, 128);
  public static readonly HONEYDEW = Color.fromRGB(240, 255, 240);
  public static readonly HOTPINK = Color.fromRGB(255, 105, 180);
  public static readonly INDIANRED = Color.fromRGB(205, 92, 92);
  public static readonly INDIGO = Color.fromRGB(75, 0, 130);
  public static readonly IVORY = Color.fromRGB(255, 255, 240);
  public static readonly KHAKI = Color.fromRGB(240, 230, 140);
  public static readonly LAVENDER = Color.fromRGB(230, 230, 250);
  public static readonly LAVENDERBLUSH = Color.fromRGB(255, 240, 245);
  public static readonly LAWNGREEN = Color.fromRGB(124, 252, 0);
  public static readonly LEMONCHIFFON = Color.fromRGB(255, 250, 205);
  public static readonly LIGHTBLUE = Color.fromRGB(173, 216, 230);
  public static readonly LIGHTCORAL = Color.fromRGB(240, 128, 128);
  public static readonly LIGHTCYAN = Color.fromRGB(224, 255, 255);
  public static readonly LIGHTGOLDENRODYELLOW = Color.fromRGB(250, 250, 210);
  public static readonly LIGHTGRAY = Color.fromRGB(211, 211, 211);
  public static readonly LIGHTGREEN = Color.fromRGB(144, 238, 144);
  public static readonly LIGHTGREY = Color.fromRGB(211, 211, 211);
  public static readonly LIGHTPINK = Color.fromRGB(255, 182, 193);
  public static readonly LIGHTSALMON = Color.fromRGB(255, 160, 122);
  public static readonly LIGHTSEAGREEN = Color.fromRGB(32, 178, 170);
  public static readonly LIGHTSKYBLUE = Color.fromRGB(135, 206, 250);
  public static readonly LIGHTSLATEGRAY = Color.fromRGB(119, 136, 153);
  public static readonly LIGHTSLATEGREY = Color.fromRGB(119, 136, 153);
  public static readonly LIGHTSTEELBLUE = Color.fromRGB(176, 196, 222);
  public static readonly LIGHTYELLOW = Color.fromRGB(255, 255, 224);
  public static readonly LIMEGREEN = Color.fromRGB(50, 205, 50);
  public static readonly LINEN = Color.fromRGB(250, 240, 230);
  public static readonly MAGENTA = Color.fromRGB(255, 0, 255);
  public static readonly MEDIUMAQUAMARINE = Color.fromRGB(102, 205, 170);
  public static readonly MEDIUMBLUE = Color.fromRGB(0, 0, 205);
  public static readonly MEDIUMORCHID = Color.fromRGB(186, 85, 211);
  public static readonly MEDIUMPURPLE = Color.fromRGB(147, 112, 219);
  public static readonly MEDIUMSEAGREEN = Color.fromRGB(60, 179, 113);
  public static readonly MEDIUMSLATEBLUE = Color.fromRGB(123, 104, 238);
  public static readonly MEDIUMSPRINGGREEN = Color.fromRGB(0, 250, 154);
  public static readonly MEDIUMTURQUOISE = Color.fromRGB(72, 209, 204);
  public static readonly MEDIUMVIOLETRED = Color.fromRGB(199, 21, 133);
  public static readonly MIDNIGHTBLUE = Color.fromRGB(25, 25, 112);
  public static readonly MINTCREAM = Color.fromRGB(245, 255, 250);
  public static readonly MISTYROSE = Color.fromRGB(255, 228, 225);
  public static readonly MOCCASIN = Color.fromRGB(255, 228, 181);
  public static readonly NAVAJOWHITE = Color.fromRGB(255, 222, 173);
  public static readonly OLDLACE = Color.fromRGB(253, 245, 230);
  public static readonly OLIVEDRAB = Color.fromRGB(107, 142, 35);
  public static readonly ORANGERED = Color.fromRGB(255, 69, 0);
  public static readonly ORCHID = Color.fromRGB(218, 112, 214);
  public static readonly PALEGOLDENROD = Color.fromRGB(238, 232, 170);
  public static readonly PALEGREEN = Color.fromRGB(152, 251, 152);
  public static readonly PALETURQUOISE = Color.fromRGB(175, 238, 238);
  public static readonly PALEVIOLETRED = Color.fromRGB(219, 112, 147);
  public static readonly PAPAYAWHIP = Color.fromRGB(255, 239, 213);
  public static readonly PEACHPUFF = Color.fromRGB(255, 218, 185);
  public static readonly PERU = Color.fromRGB(205, 133, 63);
  public static readonly PINK = Color.fromRGB(255, 192, 203);
  public static readonly PLUM = Color.fromRGB(221, 160, 221);
  public static readonly POWDERBLUE = Color.fromRGB(176, 224, 230);
  public static readonly ROSYBROWN = Color.fromRGB(188, 143, 143);
  public static readonly ROYALBLUE = Color.fromRGB(65, 105, 225);
  public static readonly SADDLEBROWN = Color.fromRGB(139, 69, 19);
  public static readonly SALMON = Color.fromRGB(250, 128, 114);
  public static readonly SANDYBROWN = Color.fromRGB(244, 164, 96);
  public static readonly SEAGREEN = Color.fromRGB(46, 139, 87);
  public static readonly SEASHELL = Color.fromRGB(255, 245, 238);
  public static readonly SIENNA = Color.fromRGB(160, 82, 45);
  public static readonly SKYBLUE = Color.fromRGB(135, 206, 235);
  public static readonly SLATEBLUE = Color.fromRGB(106, 90, 205);
  public static readonly SLATEGRAY = Color.fromRGB(112, 128, 144);
  public static readonly SLATEGREY = Color.fromRGB(112, 128, 144);
  public static readonly SNOW = Color.fromRGB(255, 250, 250);
  public static readonly SPRINGGREEN = Color.fromRGB(0, 255, 127);
  public static readonly STEELBLUE = Color.fromRGB(70, 130, 180);
  public static readonly TAN = Color.fromRGB(210, 180, 140);
  public static readonly THISTLE = Color.fromRGB(216, 191, 216);
  public static readonly TOMATO = Color.fromRGB(255, 99, 71);
  public static readonly TURQUOISE = Color.fromRGB(64, 224, 208);
  public static readonly VIOLET = Color.fromRGB(238, 130, 238);
  public static readonly WHEAT = Color.fromRGB(245, 222, 179);
  public static readonly WHITESMOKE = Color.fromRGB(245, 245, 245);
  public static readonly YELLOWGREEN = Color.fromRGB(154, 205, 50);
  // CSS Color Module Level 4
  public static readonly REBECCAPURPLE = Color.fromRGB(102, 51, 153);

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

  public static fromRGB(r: number, g: number, b: number): Color {
    const key = String.fromCharCode(r) + String.fromCharCode(g) + String.fromCharCode(b);
    const value = Color.cache.get(key);
    if (value !== undefined) {
      return value;
    }
    const color = new Color(r, g, b)
    Color.cache.set(key, color);
    return color;
  }

  public toRGBAString() {
    return `rgba(${this.r},${this.g},${this.b},${this.a})`;
  }
}
