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
    const seq = this.coreInput || new Float32Array(BOARD_SIZE * BOARD_SIZE * 2);
    this.coreInput = seq;
    let i = 0;
    const candidates = {};
    game.board.forEach((line, y) => line.forEach((v, x) => {
      //seq[i++] = 1.0;
      if (v === EMPTY) {
        seq[i++] = 0.0;
        seq[i++] = 0.0;
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
          seq[i++] = 1.0;
          seq[i++] = 0.0;
        } else {
          seq[i++] = 0.0;
          seq[i++] = 1.0;
        }
      }
    }));
    if (game.prevPlay) {
      const [cx, cy] = game.prevPlay;
      //seq[(cx + cy * BOARD_SIZE) * 3] = 0.0;
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
      seq[j] = 1.0;
      const value = this.evaluate(seq) + 0.00001;
      if (value === NaN) {
        throw new Error('Evaluated NaN');
      }
      choice.push({
        pos: candidates[k],
        value,
      });
      sum += value;
      seq[j] = 0.0;
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

function createRandomCore () {
  return [
    nnLayer(BOARD_SIZE * BOARD_SIZE * 2, BOARD_SIZE),
    nnLayer(BOARD_SIZE, 1),
  ];
}

function inheritCore (parent) {
  if (Math.random() < 0.5) {
    return [
      inheritLayer(parent[0]),
      inheritLayer(parent[1]),
    ]
  } else {
    return parent;
  }
}

function crossCore (parentA, parentB) {
  return [
    crossLayer(parentA[0], parentB[0]),
    crossLayer(parentA[1], parentB[1]),
  ]
}

function nnLayer (inSize, outSize) {
  const ret = {
    bias: [],
    weight: [],
  };
  for (let i = 0 | 0; i < outSize; i++) {
    ret.bias[i] = Math.random();
    const oWeight = [];
    ret.weight.push(oWeight);
    for (let j = 0; j < inSize; j++) {
      oWeight[j] = Math.random();
    }
  }
  return ret;
}

function inheritLayer (parent) {
  return {
    bias: mutate(parent.bias, 0.2),
    weight: parent.weight.map(v => mutate(v, 0.2)),
  };
}

function crossLayer (parentA, parentB) {
  const selection = parentA.bias.map(v => Math.random());
  return {
    bias: cross(parentA.bias, parentB.bias, selection),
    weight: cross(parentA.weight, parentB.weight, selection),
  };
}

function mutate (arr, thresh) {
  return arr.map(v => {
    let d = Math.random();
    if (d < thresh) {
      return Math.random();
    }
    return v;
  });
}

function cross (arr1, arr2, crossSel) {
  return arr1.map((v, i) => {
    if (crossSel[i] < 0.5) {
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

