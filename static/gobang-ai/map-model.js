class MapModel {
  constructor () {
    this.map = {};
    this.keyArr = [];
  }

  clone () {
    const ret = new MapModel();
    ret.map = Object.assign({}, this.map);
    return ret;
  }

  predict (boardState) {
    const key = this.stateToKey(boardState);
    if (!this.map.hasOwnProperty(key)) {
      const rand = [];
      for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        rand[i] = Math.random();
      }
      this.map[key] = rand;
    }
    return this.map[key];
  }

  learn (boardState, target) {
    const key = this.stateToKey(boardState);
    this.map[key] = target;
  }

  toJSON () {
    return Object.assign({}, this.map);
  }

  fromJSON (map) {
    this.map = Object.assign({}, map);
  }

  stateToKey (state) {
    let i = 0;
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        this.keyArr[i++] = state[y][x];
      }
    }
    return this.keyArr.join('');
  }
}