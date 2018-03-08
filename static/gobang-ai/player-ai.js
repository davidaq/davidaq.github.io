class PlayerAI {
  constructor (coreJSON, learn) {
    this.learn = learn;
    this.shouldLearn = false;
    this.willReward = 0;
    this.initCore(coreJSON);
  }

  initCore (json) {
    const env = {
      getNumStates () {
        return BOARD_SIZE * BOARD_SIZE * 3;
      },
      getMaxNumActions () {
        return BOARD_SIZE * BOARD_SIZE;
      },
    };
    const spec = {
      alpha: 0.01,
      epsilon: this.learn ? 0.2 : 0,
      gamma: 0.5,
      num_hidden_units: BOARD_SIZE * 5,
      experience_add_every: 1,
      experience_size: 1000,
    };
    this.brain = new RL.DQNAgent(env, spec);
    if (json) {
      this.brain.fromJSON(json);
    }
    this.netInput = new Array(env.getNumStates());
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
    game.board.forEach((line, y) => line.forEach((v, x) => {
      input[i++] = 0.0;
      if (v === EMPTY) {
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
    if (game.prevPlay) {
      const [x, y] = game.prevPlay;
      input[(x + y * BOARD_SIZE) * 3] = 1.0;
    }
    while (true) {
      const decision = this.brain.act(input);
      const x = decision % BOARD_SIZE;
      const y = Math.floor(decision / BOARD_SIZE);
      if (game.board[y][x] === EMPTY) {
        this.willReward = 0;
        this.shouldLearn = true;
        callback(x, y);
        break;
      } else {
        this.brain.learn(-100);
      }
    }
  }

  learnFromReward () {
    if (this.shouldLearn) {
      this.brain.learn(this.willReward);
      this.shouldLearn = false;
    }
  }

  end () {
    this.learnFromReward();
  }
}

