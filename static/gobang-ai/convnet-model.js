
class ConvnetModel {
  constructor () {
    this.net = new convnetjs.Net();
    this.inputVol = new convnetjs.Vol(BOARD_SIZE, BOARD_SIZE, 2, 0.0);
  }

  initModel () {
    if (this.net.layers.length === 0) {
      this.net.makeLayers([
        { type: 'input', out_sx: BOARD_SIZE, out_sy: BOARD_SIZE, out_depth: 2 },
        { type: 'conv', sx: 2, stride: 1, pad: 0, filters: BOARD_SIZE * 5 },
        { type: 'pool', sx: 2, stride: 2 },
        { type: 'conv', sx: 2, stride: 1, pad: 0, filters: BOARD_SIZE * 20 },
        { type: 'pool', sx: 2, stride: 2 },
        { type: 'regression', num_neurons: BOARD_SIZE * BOARD_SIZE },
      ]);
    }
  }

  clone () {
    const ret = new ConvnetModel();
    ret.fromJSON(this.toJSON());
    return ret;
  }
  
  initOptimizer () {
    if (!this.optimizer) {
      this.optimizer = new convnetjs.Trainer(this.net, {
        method: 'adagrad',
        batch_size: 1,
      });
    }
  }

  gameStateToInput (board) {
    board.forEach((line, y) => line.forEach((v, x) => {
      if (v === EMPTY) {
        this.inputVol.set(x, y, 0, 0.0);
        this.inputVol.set(x, y, 1, 0.0);
      } else if (v === this.me) {
        this.inputVol.set(x, y, 0, 1.0);
        this.inputVol.set(x, y, 1, 0.0);
      } else {
        this.inputVol.set(x, y, 0, 0.0);
        this.inputVol.set(x, y, 1, 1.0);
      }
    }));
  }

  createInput () {
    return new convnetjs.Vol(BOARD_SIZE, BOARD_SIZE, 2, 0.0);
  }

  predict (boardState) {
    this.initModel();
    this.gameStateToInput(boardState);
    return this.net.forward(this.inputVol).w;
  }

  learn (boardState, target, rate) {
    this.initOptimizer();
    this.gameStateToInput(boardState);
    if (rate > 0) {
      this.optimizer.learning_rate = rate;
    }
    this.optimizer.train(this.inputVol, target);
  }

  toJSON () {
    this.initModel();
    return this.net.toJSON();
  }

  fromJSON (json) {
    this.net.fromJSON(json);
  }
}