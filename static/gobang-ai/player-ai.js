
class RoundQueue {
  constructor (limit) {
    this.limit = limit;
    this.list = [];
    this.i = 0;
  }

  add (item) {
    const droped = this.list[this.i];
    this.list[this.i] = item;
    this.i++;
    if (this.i >= this.limit) {
      this.i = 0;
    }
    return droped;
  }

  full () {
    return this.list.length >= this.limit;
  }

  getRandom () {
    return this.list[Math.floor(Math.random() * this.list.length)];
  }
}

class PlayerAI {
  constructor (model, randomness = 0.5) {
    this.model = model;
    this.randomness = randomness;

    this.gamma = 0.9;
    this.seenList = new RoundQueue(10000);
    this.experience = new RoundQueue(1000);

    this.lastDecision = null;
    this.seenSet = {};
    this.errors = [];
    this.errorSum = 0;
  }

  decide (game) {
    this.reward(-1);
    this.me = game.currentPlayer;
    const clonedGame = game.cloneBoard();
    const state = clonedGame.board;
    if (this.me === WHITE) {
      this.flipGameState(state);
    }
    const stateHash = clonedGame.hash();
    const random = Math.random() < this.randomness;
    let x, y;
    if (random) {
      const available = clonedGame.emptyPos();
      if (available.length === 0) {
        throw new Error('No possible action');
      }
      const availableNew = available.filter(({x, y}) => !this.seenSet[`${stateHash}.${x}.${y}`])
      const candidate = availableNew.length > 0 ? availableNew : available;
      ({ x, y }  = candidate[Math.floor(Math.random() * candidate.length)]);
    } else {
      const prediction = this.model.predict(state);
      const action = this.bestPossibleAction(state, prediction);
      ({ x, y } = this.actionToCoord(action));
    }
    const hash = `${stateHash}.${x}.${y}`;
    if (!this.seenSet[hash]) {
      this.seenSet[hash] = true;
      const droped = this.seenList.add(hash);
      if (droped) {
        delete this.seenSet[droped];
      }
    }
    this.lastDecision = { state, action: x + y * BOARD_SIZE };
    return Promise.resolve([x, y]);
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
      const { x, y } = this.actionToCoord(action);
      stateForOpponent[y][x] = BLACK;
      this.flipGameState(stateForOpponent);
    }
    const expr = { state, action, reward, stateForOpponent };
    if (endGame || Math.random() < 0.3) {
      this.experience.add(expr);
    }
    this.learn(expr);
    if (this.experience.full()) {
      for (let i = 0; i < 5; i++) {
        this.learn(this.experience.getRandom());
      }
    }
  }

  learn (expr) {
    if (!this.offlineModel) {
      //this.offlineModel = this.model.clone();
    }
    const { state, action, reward, stateForOpponent } = expr;
    let qmax = reward;
    if (stateForOpponent) {
      const opponentPrediction = this.model.predict(stateForOpponent);
      const opponentBestAction = this.bestPossibleAction(stateForOpponent, opponentPrediction);
      if (opponentBestAction > -1) {
        qmax -= this.gamma * opponentPrediction[opponentBestAction];
        const { x: mx, y: my } = this.actionToCoord(action);
        const { x: ox, y: oy } = this.actionToCoord(opponentBestAction);
        state[my][mx] = BLACK;
        state[oy][ox] = WHITE;
        const futurePrediction = this.model.predict(state);
        const futureBestAction = this.bestPossibleAction(state, futurePrediction);
        if (futureBestAction > -1) {
          //const offlineFuturePrediction = this.offlineModel.predict(state);
          //qmax += this.gamma * offlineFuturePrediction[futureBestAction];
          qmax += this.gamma * futurePrediction[futureBestAction];
        }
        state[my][mx] = EMPTY;
        state[oy][ox] = EMPTY;
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
