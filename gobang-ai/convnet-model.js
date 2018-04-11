
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

  predict (state) {
    this.initModel();
    const ret = new Float32Array(BOARD_SIZE * BOARD_SIZE);
    let i = 0;
    this.gameStateToInput(state);
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (state.get(x, y) === EMPTY) {
          this.inputVol.set(x, y, 0, 1.0);
          ret[i++] = this.net.forward(this.inputVol).w[0];
          this.inputVol.set(x, y, 0, 0.0);
        } else {
          ret[i++] = -999.0;
        }
      }
    }
    return ret;
  }

  learn (state, action, target) {
    this.initOptimizer();
    const { x, y } = state.actionToCoord(action);
    state.set(x, y, BLACK);
    this.gameStateToInput(state);
    state.set(x, y, EMPTY);
    this.optimizer.train(this.inputVol, target);

    const predict = this.net.forward(this.inputVol).w[0];
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
      const poolSize = BOARD_SIZE - WIN_CONDITION + 1;
      this.net.makeLayers([
        { type: 'input', out_sx: BOARD_SIZE, out_sy: BOARD_SIZE, out_depth: 2 },
        { type: 'conv', sx: WIN_CONDITION, filters: BOARD_SIZE * 4, stride: 1 },
        { type: 'pool', sx: poolSize, stride: poolSize },
        { type: 'relu', leak: 0.01 },
        { type: 'fc', num_neurons: BOARD_SIZE * BOARD_SIZE },
        { type: 'relu', leak: 0.01 },
        { type: 'regression', num_neurons: 1 }
      ]);
    }
  }
  
  initOptimizer () {
    if (!this.optimizer) {
      this.optimizer = new convnetjs.Trainer(this.net, {
        method: 'adagrad',
        batch_size: 10,
      });
    }
  }

  gameStateToInput (state) {
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        switch (state.get(x, y)) {
          case EMPTY:
            this.inputVol.set(x, y, 0, 0.0);
            this.inputVol.set(x, y, 1, 0.0);
            break;
          case BLACK:
            this.inputVol.set(x, y, 0, 1.0);
            this.inputVol.set(x, y, 1, 0.0);
            break;
          case WHITE:
            this.inputVol.set(x, y, 0, 0.0);
            this.inputVol.set(x, y, 1, 1.0);
            break;
        }
      }
    }
  }
}

