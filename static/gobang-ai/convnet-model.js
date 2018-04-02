
class ConvnetModel {
  constructor () {
    this.net = new convnetjs.Net();
    this.inputVol = new convnetjs.Vol(BOARD_SIZE, BOARD_SIZE, 2, 0.0);
  }

  clone () {
    const ret = new ConvnetModel();
    ret.fromJSON(this.toJSON());
    return ret;
  }

  predict (boardState) {
    this.initModel();
    const ret = new Float32Array(BOARD_SIZE * BOARD_SIZE);
    let i = 0;
    boardState.forEach((line, y) => {
      line.forEach((v, x) => {
        if (v === EMPTY) {
          boardState[y][x] = BLACK;
          this.gameStateToInput(boardState);
          boardState[y][x] = EMPTY;
          ret[i] = this.net.forward(this.inputVol).w[0];
        } else {
          ret[i] = -9999;
        }
        i++;
      })
    });
    return ret;
  }

  learn (boardState, action, target) {
    this.initOptimizer();
    const x = action % BOARD_SIZE;
    const y = Math.floor(action / BOARD_SIZE);
    boardState[y][x] = BLACK;
    this.gameStateToInput(boardState);
    boardState[y][x] = EMPTY;
    const predict = this.net.forward(this.inputVol).w[0];
    this.optimizer.train(this.inputVol, target);
    return Math.abs(predict - target);
  }

  toJSON () {
    this.initModel();
    return this.net.toJSON();
  }

  fromJSON (json) {
    this.net.fromJSON(json);
  }

  initModel () {
    if (this.net.layers.length === 0) {
      this.net.makeLayers([
        { type: 'input', out_sx: BOARD_SIZE, out_sy: BOARD_SIZE, out_depth: 2 },
        { type: 'fc', num_neurons: BOARD_SIZE * BOARD_SIZE, activation: 'relu' },
        { type: 'fc', num_neurons: BOARD_SIZE, activation: 'relu' },
        { type: 'regression', num_neurons: 1 }
      ]);
    }
  }
  
  initOptimizer () {
    if (!this.optimizer) {
      this.optimizer = new convnetjs.Trainer(this.net, {
        method: 'adagrad',
        batch_size: 200,
      });
    }
  }

  gameStateToInput (board) {
    board.forEach((line, y) => line.forEach((v, x) => {
      if (v === EMPTY) {
        this.inputVol.set(x, y, 0, 0.0);
        this.inputVol.set(x, y, 1, 0.0);
      } else if (v === BLACK) {
        this.inputVol.set(x, y, 0, 1.0);
        this.inputVol.set(x, y, 1, 0.0);
      } else {
        this.inputVol.set(x, y, 0, 0.0);
        this.inputVol.set(x, y, 1, 1.0);
      }
    }));
  }
}

