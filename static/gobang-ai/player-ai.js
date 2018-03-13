class PlayerAI {
  constructor (model, randomness) {
    this.gamma = 0.9;
    this.experienceLimit = 1000;

    this.randomness = randomness || 0.5;
    this.model = model;
    this.lastDecision = null;
    this.experience = [];
    this.experienceI = 0;
    this.errors = [];
    this.errorSum = 0;
  }

  decide (game) {
    this.reward(-1);
    this.me = game.currentPlayer;
    const input = this.model.createInput();
    const random = Math.random() < this.randomness;
    const available = [];
    game.board.forEach((line, y) => line.forEach((v, x) => {
      if (v === EMPTY) {
        available.push([x, y]);
      } else if (v === this.me) {
        input.set(x, y, 0, 1.0);
      } else {
        input.set(x, y, 1, 1.0);
      }
    }));
    if (available.length === 0) {
      throw new Error('No possible action');
    }
    if (random) {
      const [x, y] = available[this.randI(available.length)];
      this.lastDecision = {
        state: input,
        action: x + y * BOARD_SIZE,
      };
      return Promise.resolve([x, y]);
    } else {
      const prediction = this.model.predict(input);
      const action = this.bestPossibleAction(input, prediction);
      const { x, y } = this.actionToCoord(action);
      this.lastDecision = {
        state: input,
        action,
      };
      return Promise.resolve([x, y]);
    }
  }

  end (game, result) {
    if (result === TIE) {
      this.reward(-20, true);
    } else if (result === this.me) {
      this.reward(40, true);
    } else {
      this.reward(-80, true);
    }
    this.lastDecision = null;
    this.offlineModel = null;
  }

  reward (reward, endGame) {
    if (!this.lastDecision) {
      return;
    }
    const { state, action } = this.lastDecision;
    let stateForOpponent;
    if (!endGame) {
      stateForOpponent = this.model.createInput();
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          stateForOpponent.set(x, y, 0, state.get(x, y, 1));
          stateForOpponent.set(x, y, 1, state.get(x, y, 0));
        }
      }
      const { x, y } = this.actionToCoord(action);
      stateForOpponent.set(x, y, 1, 1.0);
    }
    const expr = { state, action, reward, stateForOpponent };
    if (endGame || this.experience.length < this.experienceLimit || Math.random() < 0.3) {
      this.experience[this.experienceI++] = expr;
      if (this.experienceI >= this.experienceLimit) {
        this.experienceI = 0;
      }
    }
    this.learn(expr);
    if (this.experience.length === this.experienceLimit) {
      for (let i = 0; i < 10; i++) {
        this.learn(this.experience[this.randI(this.experience.length)]);
      }
    }
  }

  learn (expr) {
    if (!this.offlineModel) {
      this.offlineModel = this.model.clone();
    }
    const { state, action, reward, stateForOpponent } = expr;
    let qmax = reward;
    if (stateForOpponent) {
      const opponentPrediction = this.model.predict(stateForOpponent);
      const opponentBestAction = this.bestPossibleAction(stateForOpponent, opponentPrediction);
      if (opponentBestAction > -1) {
        const { x: mx, y: my } = this.actionToCoord(action);
        const { x: ox, y: oy } = this.actionToCoord(opponentBestAction);
        state.set(mx, my, 0, 1.0);
        state.set(ox, oy, 1, 1.0);
        const futurePrediction = this.model.predict(state);
        const futureBestAction = this.bestPossibleAction(state, futurePrediction);
        state.set(mx, my, 0, 0.0);
        state.set(ox, oy, 1, 0.0);
        if (futureBestAction > -1) {
          const offlineFuturePrediction = this.offlineModel.predict(state);
          qmax += this.gamma * offlineFuturePrediction.w[futureBestAction];
        }
      }
    }
    const predict = this.model.predict(state);
    const predictError = Math.abs(qmax - predict.w[action]);
    predict[action] = qmax;
    this.errors.push(predictError);
    this.errorSum += predictError;
    if (this.errors.length > 1000) {
      this.errorSum -= this.errors.shift();
    }
    this.model.learn(state, predict);
  }

  avgError () {
    if (this.errors.length === 0) {
      return 0;
    }
    return this.errorSum / this.errors.length;
  }

  randI (max) {  // random integer within [0, max)
    return Math.floor(Math.random() * max);
  }

  actionToCoord (action) {
    return {
      x: action % BOARD_SIZE,
      y: Math.floor(action / BOARD_SIZE),
    }
  }

  bestPossibleAction (input, values) {
    let best = -1;
    let action = -1;
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        action++;
        if (input.get(x, y, 0) < 0.1 && input.get(x, y, 1) < 0.1) {
          if (best === -1 || values.w[action] > values.w[best]) {
            best = action;
          }
        }
      }
    }
    return best;
  }
  
}
