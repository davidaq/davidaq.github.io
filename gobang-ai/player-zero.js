
class PlayerZero {
  constructor (model) {
    this.model = model;
    this.mtcs = new MonteCarloTreeSearch({
      cExplore: 1,
      cBack: -1,
      emulator: this,
    });
  }

  actionsForState (state) {
    return state.emptyPos().map(({ x, y }) => {
      return {
        id: state.coordToAction(x, y),
        priority: 1, //this.model.predict(state, x, y),
      };
    });
  }

  stateAfterAction (state, action) {
    state = state.clone();
    const { x, y } = state.actionToCoord(action);
    state.set(x, y, state.currentPlayer);
    return state;
  }

  evaluate (state, action) {
    const { x, y } = state.actionToCoord(action);
    return this.model.predict(state, x, y);
  }

  decide (state) {
    const action = this.mtcs.search(state, 10000);
    return Promise.resolve(state.actionToCoord(action));
  }

  end (state, isWin, isTie) {
    //for (const state of this.stateHistory) {
    //  this.model.learn(state, isWin);
    //}
  }
}

