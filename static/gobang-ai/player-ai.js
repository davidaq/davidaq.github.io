class PlayerAI {
  constructor (coreJSON, learn, randomess = 0) {
    this.learn = learn;
    this.randomess = randomess;
    this.learner = null;
    this.willReward = 0;
    this.initCore(coreJSON);
  }

  initCore (json) {
    const env = {
      getNumStates: () => BOARD_SIZE * BOARD_SIZE * 2,
      getMaxNumActions: () => BOARD_SIZE * BOARD_SIZE,
      isActionPossible: (a, s) => s.w[a * 2] < 0.1 && s.w[a * 2 + 1] < 0.1,
      forTraining: () => this.learn,
      opponentStateAfterAction: (a) => this.opponentStateAfterAction(a),
    };
    const spec = {
      alpha: 0.002 * this.randomess,
      epsilon: this.randomess,
      gamma: -0.9,
      num_hidden_units: BOARD_SIZE * BOARD_SIZE * BOARD_SIZE,
      experience_size: 5000,
    };
    this.brain = new RL.DQNAgent(env, spec);
    if (json) {
      this.brain.fromJSON(json);
    }
    this.netInput = new Array(env.getNumStates());
  }

  shareBrain (player) {
    this.brain.net = player.brain.net;
  }

  getCore () {
    return this.brain.toJSON();
  }

  reward (value) {
    this.willReward += value;
  }

  decide (game, callback) {
    this.learnFromReward();
    const input = this.netInput;
    let i = 0;
    this.actionPosible = {};
    game.board.forEach((line, y) => line.forEach((v, x) => {
      // input[i++] = 0.0;
      if (v === EMPTY) {
        this.actionPosible[x + y * BOARD_SIZE] = true;
        input[i++] = 0.0;
        input[i++] = 0.0;
      } else {
        if (v === game.currentPlayer) {
          input[i++] = 1.0;
          input[i++] = 0.0;
        } else {
          input[i++] = 0.0;
          input[i++] = 1.0;
        }
      }
    }));
    // if (game.prevPlay) {
    //   const [x, y] = game.prevPlay;
    //   input[(x + y * BOARD_SIZE) * 3] = 1.0;
    // }
    if (false && this.learn && game.suggest) {
      const [x, y] = game.suggest;
      this.brain.act(input, x + y * BOARD_SIZE);
      callback(x, y);
    } else {
      while (true) {
        const { action, learn } = this.brain.act(input);
        const x = action % BOARD_SIZE;
        const y = Math.floor(action / BOARD_SIZE);
        if (game.board[y][x] !== EMPTY) {
          learn(-1);
        } else {
          this.willReward = 0;
          this.learner = this.learn ? learn : null;
          callback(x, y);
          break;
        }
      }
    }
  }

  opponentStateAfterAction (a) {
    const input = this.netInput;
    input[a * 2] = 1.0;
    for (let i = 0; i< BOARD_SIZE * BOARD_SIZE; i++) {
      const t = input[i];
      input[i] = input[i + 1];
      input[i + 1] = t;
    }
    return input;
  }

  learnFromReward () {
    if (this.learner) {
      this.learner(this.willReward);
      this.learner = null;
    }
  }

  end () {
    this.learnFromReward();
    this.brain.endRound();
  }
}

