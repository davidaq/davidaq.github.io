
class PlayerZero {
  constructor (model) {
    this.model = model;
    this.stateHistory = [];

    this.exploreFactor = 1.5;
  }

  decide (state) {
    if (state.currentPlayer === WHITE) {
      state.flip();
    }
    this.stateHistory.push(state.clone());
    const treeRoot = { state, w: 0, n: 0, v: 0, children: null };
    for (let i = 0 ; i < 1000; i++) {
      this.simulate(treeRoot, 0);
    }
    console.log(treeRoot);
    treeRoot.children.sort((a, b) => b.n - a.n);
    const { x, y } = treeRoot.children[0];
    return Promise.resolve({ x, y });
  }

  simulate (node) {
    if (!node.children) {
      this.expand(node);
    }
    node.n++;
    if (node.children.length > 0) {
      if (node.n < node.children.length) {
        const leaves = node.children.filter(n => n.leaf);
        const leaf = leaves[Math.floor(Math.random() * leaves.length)];
        leaf.leaf = false;
        node.w += this.model.predict(leaf.state);
      } else {
        let max = null;
        let maxP = 0;
        for (const child of node.children) {
          const p = child.v + Math.sqrt(Math.log(node.n + 1) / (child.n + 1)) * this.exploreFactor;
          child.xp = p;
          if (!max || p > maxP) {
            max = child;
            maxP = p;
          }
        }
        node.w -= max.w;
        this.simulate(max);
        node.w += max.w;
      }
    }
    node.v = node.w / node.n;
  }

  expand (node) {
    node.children = [];
    const empty = node.state.emptyPos();
    const opponentStateView = node.state.clone();
    opponentStateView.flip();
    let maxChild;
    empty.forEach(({ x, y }) => {
      const childState = node.state.clone();
      childState.set(x, y, BLACK);
      opponentStateView.set(x, y, WHITE);
      let opponentMaxVal = 0;
      let opponentPos = { x: -1, y: -1 };
      empty.forEach(({ x: ox, y: oy }) => {
        if (ox !== x || oy !== y) {
          opponentStateView.set(ox, oy, BLACK);
          const opponentVal = this.model.predict(opponentStateView, ox, oy);
          if (opponentPos.x === -1 || opponentVal > opponentMaxVal) {
            opponentMaxVal = opponentVal;
            opponentPos.x = ox;
            opponentPos.y = oy;
          }
          opponentStateView.set(ox, oy, EMPTY);
        }
      });
      if (opponentPos.x !== -1) {
        const { x: ox, y: oy } = opponentPos;
        childState.set(ox, oy, WHITE);
        const child = {
          n: 0,
          v: 0,
          w: 0,
          leaf: true,
          x, y,
          state: childState,
          children: null,
        };
        node.children.push(child);
      }
      opponentStateView.set(x, y, EMPTY);
    });
  }

  end (state, isWin, isTie) {
    for (const state of this.stateHistory) {
      this.model.learn(state, isWin);
    }
  }
}

