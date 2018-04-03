
class PlayerAI {
  constructor (model, randomness = 0.5, train = true) {
    this.model = model;
    this.randomness = randomness;
    this.shouldTrain = train;

    this.gamma = 0.9;
    this.seenSet = {};
    this.seenList = new RoundQueue(100000);
    this.experience = new RoundQueue(100);

    this.lastDecision = null;
  }

  decide (state) {
    this.reward(-0.01);
    if (state.currentPlayer === WHITE) {
      state.flip();
    }
    const stateHash = state.hash();
    const random = Math.random() < this.randomness;
    let x, y;
    if (random) {
      const available = state.emptyPos();
      if (available.length === 0) {
        throw new Error('No possible action');
      }
      const availableNew = available.filter(({x, y}) => {
        state.set(x, y, BLACK);
        const hash = state.hash();
        state.set(x, y, EMPTY);
        return !this.seenSet[hash];
      });
      const candidate = availableNew.length > 0 ? availableNew : available;
      ({ x, y } = candidate[Math.floor(Math.random() * candidate.length)]);
    } else {
      const prediction = this.model.predict(state);
      const action = this.bestPossibleAction(state, prediction);
      ({ x, y } = state.actionToCoord(action));
    }
    state.set(x, y, BLACK);
    const hash = state.hash();
    state.set(x, y, EMPTY);
    if (!this.seenSet[hash]) {
      this.seenSet[hash] = true;
      const droped = this.seenList.add(hash);
      if (droped) {
        delete this.seenSet[droped];
      }
    }
    this.lastDecision = { state, action: x + y * BOARD_SIZE };
    return Promise.resolve({ x, y });
  }

  end (state, isWin) {
    if (isWin) {
      this.reward(0.2, true);
    } else {
      this.reward(-0.4, true);
    }
    this.lastDecision = null;
  }

  reward (reward, endGame) {
    if (!this.lastDecision || !this.shouldTrain) {
      return;
    }
    const { state, action } = this.lastDecision;
    let stateForOpponent;
    if (!endGame) {
      stateForOpponent = state.clone();
      const { x, y } = state.actionToCoord(action);
      stateForOpponent.set(x, y, BLACK);
      stateForOpponent.flip();
    }
    const expr = { state, action, reward, stateForOpponent };
    if (endGame || Math.random() < 0.2) {
      this.experience.add(expr);
    }
    this.learn(expr);
    if (this.experience.full()) {
      for (let i = 0; i < 20; i++) {
        this.learn(this.experience.getRandom());
      }
    }
  }

  learn (expr) {
    const { state, action, reward, stateForOpponent } = expr;
    let qmax = reward;
    if (stateForOpponent) {
      const opponentPrediction = this.model.predict(stateForOpponent);
      const opponentBestAction = this.bestPossibleAction(stateForOpponent, opponentPrediction);
      if (opponentBestAction > -1) {
        const { x: mx, y: my } = state.actionToCoord(action);
        const { x: ox, y: oy } = state.actionToCoord(opponentBestAction);
        state.set(mx, my, BLACK);
        state.set(ox, oy, WHITE);
        const futurePrediction = this.model.predict(state);
        const futureBestAction = this.bestPossibleAction(state, futurePrediction);
        if (futureBestAction > -1) {
          qmax += this.gamma * futurePrediction[futureBestAction];
        }
        state.set(mx, my, EMPTY);
        state.set(ox, oy, EMPTY);
      }
    }
    this.model.learn(state, action, qmax);
  }

  bestPossibleAction (state, values) {
    let best = -1;
    let action = -1;
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        action++;
        if (state.get(x, y) === EMPTY) {
          if (best === -1 || values[action] > values[best]) {
            best = action;
          }
        }
      }
    }
    return best;
  }
  
}

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

