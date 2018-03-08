class PlayerAI {
  constructor (coreJSON) {
    coreJSON = null;
    this.initCore(coreJSON);
  }

  initCore (json) {
    this.net = new convnetjs.Net();
    if (json) {
      this.net.fromJSON(json);
    } else {
      this.net.makeLayers([
        { type: 'input', out_sx: BOARD_SIZE, out_sy: BOARD_SIZE, out_depth: 2 },
        { type: 'conv', sx: 4, filters: 8, stride: 1, pad: 0, activation: 'relu' },
        { type: 'pool', sx: 2, stride: 2 },
        { type: 'regression', num_neurons: 1 }
      ]);
    }
    this.netInput = new convnetjs.Vol(BOARD_SIZE, BOARD_SIZE, 2);
  }

  decide (game, callback) {
    const input = this.netInput;
    let i = 0;
    const candidates = {};
    game.board.forEach((line, y) => line.forEach((v, x) => {
      if (v === EMPTY) {
        input.set(x, y, 0, 0.0);
        input.set(x, y, 0, 0.0);
      } else {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const cx = x + dx;
            const cy = y + dy;
            if (cx >= 0 && cx < BOARD_SIZE && cy >=0 && cy < BOARD_SIZE) {
              if (game.board[cy][cx] === EMPTY) {
                candidates[cx + cy * BOARD_SIZE] = [cx, cy];
              }
            }
          }
        }
        if (v === game.currentPlayer) {
          input.set(x, y, 0, 1.0);
          input.set(x, y, 0, 0.0);
        } else {
          input.set(x, y, 0, 0.0);
          input.set(x, y, 0, 1.0);
        }
      }
    }));
    if (game.prevPlay) {
      const [cx, cy] = game.prevPlay;
    } else {
      candidates[Math.floor(BOARD_SIZE * BOARD_SIZE / 2)] = [
        Math.floor(BOARD_SIZE / 2),
        Math.floor(BOARD_SIZE / 2),
      ];
    }
    let sum = 0;
    const choice = [];
    Object.keys(candidates).forEach(k => {
      k = k | 0;
      let j = k * 2;
      const pos = candidates[k];
      input.set(pos[0], pos[1], 0, 1.0);
      const value = this.net.forward(input).w[0] + 0.00001;
      if (value === NaN) {
        throw new Error('Evaluated NaN');
      }
      choice.push({ pos, value });
      sum += value;
      input.set(pos[0], pos[1], 0, 0.0);
    });
    if (choice.length > 0) {
      choice.sort((a, b) => b.value - a.value);
      let decision = choice[0];
      let watermark = 0;
      choice.forEach(v => {
        const propability = v.value / sum;
        watermark += propability;
        v.propability = propability;
        v.watermark = watermark;
      });
      //const r = Math.random();
      //for (let i = 0; i < choice.length; i++) {
      //  if (r < choice[i].watermark) {
      //    decision = choice[i];
      //    break;
      //  }
      //}
      const [x, y] = decision.pos;
      callback(x, y);
    } else {
      throw new Error('No place left to play');
    }
  }

  end () {
  }
}

