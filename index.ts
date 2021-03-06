import * as plotter from './svg-path-canvas/plotter';

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
  const bgContext = <CanvasRenderingContext2D> bgCanvas.getContext('2d');
  if (!bgContext) {
    throw new Error('could not get 2d context of <canvas id="bg">');
  }

  const fgCanvas = <HTMLCanvasElement> document.getElementById('fg');
  const fgContext = <CanvasRenderingContext2D> fgCanvas.getContext('2d');
  if (!fgContext) {
    throw new Error('could not get 2d context of <canvas id="fg">');
  }

  function loadStage() {
    // const kappa = (-1 + Math.sqrt(2)) / 3 * 4;
    const func = plotter.compose([
      'M 0 640',
      'v -320',
      // 'l -50,-320',

      // `C 0 ${320 - kappa * 320} 320 ${320 - kappa * 320} 320 320`,
      // `C 0 ${320 - kappa * 320} ${320 - kappa * 320} 0 320 0`,

      // `Q 0 0 320 0`,
      // `Q 160 160 320 320`,

      // `A 160 160 0 0 1 320 320`,
      `A 320 320 0 0 1 320 0`,
      // `A 320 320 0 0 1 160 160`,
    ].join(' '), undefined, false);
    const ops = [
      new DSL.Block(bgContext, 0, 0, true, [
        new DSL.BlockLayer([
          new DSL.BlockObjectText(bgContext, '(0,0)', 20, 20),
        ]),
      ]),
      new DSL.Block(bgContext, 0, 1, false, [
        new DSL.BlockLayer([
          new DSL.BlockObjectText(bgContext, '(0,1)', 20, 20),
        ]),
      ]),
      new DSL.Block(bgContext, 0, 2, true, [
        new DSL.BlockLayer([
          new DSL.BlockObjectText(bgContext, '(0,2)', 20, 20),
        ]),
      ]),
    ];
    const maxTick = MAP_HEIGHT * func.functions.length;
    return new DSL.Stage(bgContext, MAP_WIDTH, MAP_HEIGHT, maxTick, func, ops);
  }

  const stage = loadStage();
  const player = new Player(
    fgContext, Color.RED, stage.width / 2, stage.height - 40
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
