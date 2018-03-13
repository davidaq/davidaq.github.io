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
    const state = game.cloneBoard();
    if (this.me === WHITE) {
      this.flipGameState(state);
    }
    const random = Math.random() < this.randomness;
    if (random) {
      const available = [];
      game.board.forEach((line, y) => line.forEach((v, x) => {
        if (v === EMPTY) {
          available.push([x, y]);
        }
      }));
      if (available.length === 0) {
        throw new Error('No possible action');
      }
      const [x, y] = available[Math.floor(Math.random() * available.length)];
      this.lastDecision = { state, action: x + y * BOARD_SIZE };
      return Promise.resolve([x, y]);
    } else {
      const prediction = this.model.predict(state);
      const action = this.bestPossibleAction(state, prediction);
      const { x, y } = this.actionToCoord(action);
      this.lastDecision = { state, action };
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
      stateForOpponent = state.map(v => v.slice());
      this.flipGameState(stateForOpponent);
      const { x, y } = this.actionToCoord(action);
      stateForOpponent[y][x] = BLACK;
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
        this.learn(this.experience[Math.floor(Math.random() * this.experience.length)]);
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
        state[my][mx] = BLACK;
        state[oy][ox] = WHITE;
        const futurePrediction = this.model.predict(state);
        const futureBestAction = this.bestPossibleAction(state, futurePrediction);
        state[my][mx] = EMPTY;
        state[oy][ox] = EMPTY;
        if (futureBestAction > -1) {
          const offlineFuturePrediction = this.offlineModel.predict(state);
          qmax += this.gamma * offlineFuturePrediction[futureBestAction];
        }
      }
    }
    const predict = this.model.predict(state);
    const predictError = Math.abs(qmax - predict[action]);
    predict[action] = qmax;
    this.errors.push(predictError);
    this.errorSum += predictError;
    if (this.errors.length > 1000) {
      this.errorSum -= this.errors.shift();
    }
    this.model.learn(state, predict);
  }

  flipGameState (state) {
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        switch (state[y][x]) {
          case WHITE:
            state[y][x] = BLACK;
            break;
          case BLACK:
            state[y][x] = WHITE;
            break;
        }
      }
    }
  }

  avgError () {
    if (this.errors.length === 0) {
      return 0;
    }
    return this.errorSum / this.errors.length;
  }

  actionToCoord (action) {
    return {
      x: action % BOARD_SIZE,
      y: Math.floor(action / BOARD_SIZE),
    }
  }

  bestPossibleAction (state, values) {
    let best = -1;
    let action = -1;
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        action++;
        if (state[y][x] === EMPTY) {
          if (best === -1 || values[action] > values[best]) {
            best = action;
          }
        }
      }
    }
    return best;
  }
  
}
