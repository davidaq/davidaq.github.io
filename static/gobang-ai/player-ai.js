class PlayerAI {
  constructor (coreJSON, learn) {
    this.learn = learn;
    this.shouldLearn = false;
    this.willReward = 0;
    this.initCore(coreJSON);
  }

  initCore (json) {
    const env = {
      getNumStates: () => BOARD_SIZE * BOARD_SIZE * 3,
      getMaxNumActions: () => BOARD_SIZE * BOARD_SIZE,
      isActionPossible: (a) => !!this.actionPosible[a],
      forTraining: () => this.learn,
    };
    const spec = {
      alpha: 0.01,
      epsilon: this.learn ? 0.3 : 0,
      gamma: 0.9,
      num_hidden_units: BOARD_SIZE * 5,
      experience_add_every: 3,
      learning_steps_per_iteration: 15,
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
    this.actionPosible = {};
    game.board.forEach((line, y) => line.forEach((v, x) => {
      input[i++] = 0.0;
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
    if (game.prevPlay) {
      const [x, y] = game.prevPlay;
      input[(x + y * BOARD_SIZE) * 3] = 1.0;
    }
    if (this.learn && game.suggest) {
      const [x, y] = game.suggest;
      this.brain.act(input, x + y * BOARD_SIZE);
      callback(x, y);
    } else {
      const decision = this.brain.act(input);
      const x = decision % BOARD_SIZE;
      const y = Math.floor(decision / BOARD_SIZE);
      if (game.board[y][x] !== EMPTY) {
        throw new Error('Trying to play on taken place');
      }
      this.willReward = 0;
      this.shouldLearn = this.learn;
      callback(x, y);
    }
  }

  learnFromReward () {
    if (this.shouldLearn) {
      this.brain.learn(this.willReward)
      this.shouldLearn = false;
    }
  }

  end () {
    this.learnFromReward();
    this.brain.endRound();
  }
}

