
class MonteCarloTreeSearch {
  constructor (options) {
    const { cExplore = 1, cBack = 1, emulator } = options;
    this.cExplore = cExplore;
    this.cBack = cBack;
    this.emulator = emulator;
  }

  search (initialState, iterations) {
    const root = {
      parent: null,
      action: null,
      state: initialState,
      children: [],
      n: 0,
      w: 0,
      q: 0,
      p: 0,
    };
    this.expand(root);
    for (let i = 0; i < iterations; i++) {
      this.iterate(root);
    }
    let maxNChild = null;
    root.children.forEach((child) => {
      if (!maxNChild || child.n > maxNChild.n) {
        maxNChild = child;
      }
    });
    console.log(root);
    return maxNChild.action;
  }

  iterate (node) {
    let selection = null;
    let maxU = 0;
    let maxUChild = null;
    node.children.forEach((child) => {
      const u = child.q + this.cExplore * child.p * Math.sqrt(node.n) / (1 + child.n);
      if (!maxUChild || u > maxU) {
        maxUChild = child;
        maxU = u;
      }
    });
    let wChange = 0;
    if (!maxUChild) {
    } else if (maxUChild.state) {
      wChange = this.iterate(maxUChild);
    } else {
      maxUChild.state = this.emulator.stateAfterAction(node.state, maxUChild.action);
      this.expand(maxUChild);
      wChange = this.emulator.evaluate(maxUChild.state, maxUChild.action);
    }
    wChange *= this.cBack;
    node.w += wChange;
    node.n++;
    node.q = node.w / node.n;
    return wChange;
  }

  expand (parent) {
    let pSum = 0;
    this.emulator.actionsForState(parent.state).forEach((action) => {
      const child = {
        parent,
        state: null,
        children: [],
        n: 0,
        w: 0,
        q: 0,
        action: action.id,
        p: Math.max(0.00001, action.priority),
      };
      parent.children.push(child);
      pSum += child.p;
    });
    parent.children.forEach((child) => {
      child.p /= pSum;
    });
  }
}

