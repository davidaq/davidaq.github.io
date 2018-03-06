class PlayerAI {
  constructor (core) {
    core = core || createRandomCore();
    this.evaluate = (seq) => {
      try {
        let out = seq;
        for (let i = 0; i < core.length; i++) {
          out = nnLayerEvaluate(out, core[i]);
        }
        return out[0];
      } catch (err) {
        console.error(err);
        return Math.random();
      }
    };
  }

  decide (game, callback) {
    const seq = new Float32Array(BOARD_SIZE * BOARD_SIZE * 3);
    let i = 0;
    const candidates = {};
    game.board.forEach((line, y) => line.forEach((v, x) => {
      if (v === EMPTY) {
        seq[i++] = 1;
        seq[i++] = 0;
        seq[i++] = 0;
      } else {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const cx = x + dx;
            const cy = y + dy;
            if (cx >= 0 && cx < BOARD_SIZE && cy >=0 && cy < BOARD_SIZE) {
              candidates[cx * 3 + cy * BOARD_SIZE] = 1;
            }
          }
        }
        if (v === game.currentPlayer) {
          seq[i++] = 0;
          seq[i++] = 1;
          seq[i++] = 0;
        } else {
          seq[i++] = 0;
          seq[i++] = 0;
          seq[i++] = 1;
        }
      }
    }));
    let max = false;
    let best = false;
    Object.keys(candidates).forEach(k => {
      let j = k | 0;
      if (seq[j] > 0.5) {
        seq[j] = 0;
        seq[j + 1] = 1;
        const value = this.evaluate(seq);
        if (max === false || value > max) {
          max = value;
          best = i;
        }
        seq[j] = 1;
        seq[j + 1] = 0;
      }
    });
    if (best !== false) {
      const x = best % BOARD_SIZE;
      const y = Math.floor(best / BOARD_SIZE);
      callback(x, y);
    } else {
      throw new Error('No place left to play');
    }
  }

  end () {
  }
}

function createRandomCore () {
  return [
    nnLayer(BOARD_SIZE * BOARD_SIZE * 3, BOARD_SIZE),
    nnLayer(BOARD_SIZE, 1),
  ];
}

function inheritCore (parent) {
  return [
    inheritLayer(parent[0]),
    inheritLayer(parent[1]),
  ]
}

function crossCore (parentA, parentB) {
  return [
    crossLayer(parentA[0], parentB[0]),
    crossLayer(parentA[1], parentB[1]),
  ]
}

function nnLayer (inSize, outSize) {
  const ret = {
    bias: new Float32Array(outSize),
    weight: [],
  };
  for (let i = 0 | 0; i < outSize; i++) {
    ret.bias[i] = Math.random();
    const oWeight = new Float32Array(inSize);
    ret.weight.push(oWeight);
    for (let j = 0; j < inSize; j++) {
      oWeight[j] = Math.random();
    }
  }
  return ret;
}

function inheritLayer (parent) {
  return {
    bias: mutate(parent.bias, 0.1),
    weight: parent.weight.map(v => mutate(v, 0.1)),
  };
}

function crossLayer (parentA, parentB) {
  return {
    bias: cross(parentA.bias, parentB.bias),
    weight: cross(parentA.weight, parentB.weight),
  };
}

function mutate (arr, thresh) {
  return arr.map(v => {
    let d = Math.random();
    if (d < thresh) {
      v += d - thresh / 2;
    }
    return v;
  });
}

const crossCache = [];
function cross (arr1, arr2) {
  return arr1.map((v, i) => {
    if (i <= crossCache.length) {
      crossCache.push(Math.random());
    }
    if (crossCore[i] < 0.5) {
      return v;
    } else {
      return arr2[i];
    }
  });
}

function nnLayerEvaluate (input, layer) {
  const out = layer.bias.slice(0);
  for (let i = 0; i < out.length; i++) {
    for (let j = 0; j < input.length; j++) {
      out[i] += input[j] * layer.weight[i][j];
    }
  }
  return out.map(v => Math.max(0, v)); // ReLU
}

