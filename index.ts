import * as glMatrix from 'gl-matrix';

import * as DSL from './dsl';
import Color from './color';
import Player from './player';
import KeyInput from './key-input';


(() => {
  const MAP_WIDTH = 320;
  const MAP_HEIGHT = 320;

  const requestAnimationFrame = window.requestAnimationFrame ||
                                (window as any).mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame ||
                                (window as any).msRequestAnimationFrame;

  const key = new KeyInput();

  window.onkeydown = (e) => {
    switch (e.keyCode) {
      case 37:
        key.left = true;
        break;
      case 38:
        key.up = true;
        break;
      case 39:
        key.right = true;
        break;
      case 40:
        key.down = true;
        break;
    }
  };

  window.onkeyup = (e) => {
    switch (e.keyCode) {
      case 37:
        key.left = false;
        break;
      case 38:
        key.up = false;
        break;
      case 39:
        key.right = false;
        break;
      case 40:
        key.down = false;
        break;
    }
  };

  const bgCanvas = <HTMLCanvasElement> document.getElementById('bg');
  const bgContext = bgCanvas.getContext('2d');

  const fgCanvas = <HTMLCanvasElement> document.getElementById('fg');
  const fgContext = fgCanvas.getContext('2d');

  function loadStage() {
    const kappa = (-1 + Math.sqrt(2)) / 3 * 4;
    const cx = MAP_WIDTH;
    const cy = MAP_HEIGHT;
    const rx = MAP_WIDTH;
    const ry = MAP_HEIGHT;
    return new DSL.Stage(bgContext, MAP_WIDTH, MAP_HEIGHT, [
      new DSL.MoveLine(`
        M 0 640
        L 0 320
        C ${cx - rx} ${cy - kappa * ry} ${cx - kappa * rx} ${cy - ry} ${cx} ${cy - ry}
      `),
      new DSL.Block(bgContext, 0, 0, true, [new DSL.BlockLayer()]),
      new DSL.Block(bgContext, 0, 1, false, [new DSL.BlockLayer()]),
      new DSL.Block(bgContext, 0, 2, true, [new DSL.BlockLayer()]),
    ]);
  }

  const stage = loadStage();
  const player = new Player(
    fgContext, Color.fromRGB(255, 255, 255), stage.width / 2, stage.height - 40
  );

  function tick() {
    stage.move();
    player.move(key.toMat2d());

    stage.draw();
    player.draw();

    requestAnimationFrame(tick);
  }

  document.addEventListener('DOMContentLoaded', () => {
    fgCanvas.width  = bgCanvas.width  = MAP_WIDTH;
    fgCanvas.height = bgCanvas.height = MAP_HEIGHT;
    requestAnimationFrame(tick);
  });

})();
