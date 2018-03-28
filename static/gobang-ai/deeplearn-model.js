
class DeeplearnModel {
  constructor () {
    this.tempInput = new Float32Array(BOARD_SIZE * BOARD_SIZE * 2);
    this.layers = [
      {
        calc: input => input,
        size: this.tempInput.length,
      }
    ];
    this.addLayer(BOARD_SIZE * BOARD_SIZE, dl.tanh);
    this.addLayer(BOARD_SIZE * BOARD_SIZE);
    this.optimizer = dl.train.sgd(0.01);
  }

  addLayer (size, activation) {
    const prevLayer = this.layers[this.layers.length - 1];
    const prevSize = prevLayer.size;
    const w = [];
    for (let i = 0; i < size; i++) {
      w.push(dl.variable(dl.tensor(new Float32Array(prevSize))));
    }
    const b = dl.variable(dl.tensor(new Float32Array(size)));
    let calc = input => {
      const r = [];
      for (let i = 0; i < size; i++) {
        const m = dl.sum(dl.mul(w[i], input)).expandDims(0);
        r.push(m);
      }
      return dl.add(b, dl.concat(r));
    };
    if (activation) {
      const o = calc;
      calc = input => activation(o(input));
    }
    const layer = { w, b, calc, size };
    this.layers.push(layer);
    return layer;
  }

  clone () {
    return this;
  }

  predict (boardState, gpu = false) {
    return dl.tidy(() => {
      let r = this.boardToTensor(boardState);
      this.layers.forEach((layer) => {
        r = layer.calc(r);
      });
      if (gpu) {
        return r;
      }
      return r.dataSync();
    });
  }
 
  learn (boardState, target) {
    return dl.tidy(() => {
      this.optimizer.minimize(() => {
        const predict = this.predict(boardState, true);
        const tderror = dl.sub(predict, dl.tensor(target));
        return dl.sum(dl.pow(tderror, dl.tensor(2).toInt()));
      });
    });
  }

  toJSON() {
  }

  fromJSON() {
  }

  boardToTensor (board) {
    if (!this.tempInput) {
    }
    let i = 0;
    board.forEach((line, y) => line.forEach((v, x) => {
      if (v === BLACK) {
        this.tempInput[i++] = 1.0;
        this.tempInput[i++] = 0.0;
      } else if (v === WHITE) {
        this.tempInput[i++] = 0.0;
        this.tempInput[i++] = 1.0;
      }
    }));
    return dl.tensor(this.tempInput);
  }
}
