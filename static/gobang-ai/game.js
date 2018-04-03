const TIE = 0;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const BOARD_SIZE = 7;
const WIN_CONDITION = 4;

class GameState {
  constructor (board, currentPlayer) {
    if (board) {
      this.board = board;
    } else {
      this.board = [];
      const line = [];
      for (let i = 0; i < BOARD_SIZE; i++) {
        line.push(EMPTY);
      }
      for (let i = 0; i < BOARD_SIZE; i++) {
        this.board.push(line.slice());
      }
    }
    this.currentPlayer = currentPlayer || BLACK;
  }

  clone () {
    return new GameState(this.board.map(line => line.slice()), this.currentPlayer);
  }

  set (x, y, val) {
    this.board[y][x] = val;
  }

  get (x, y) {
    return this.board[y][x];
  }

  emptyPos () {
    const ret = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        switch (this.board[y][x]) {
          case EMPTY:
            ret.push({ x, y });
            break;
        }
      }
    }
    return ret;
  }

  flip () {
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        switch (this.board[y][x]) {
          case WHITE:
            this.board[y][x] = BLACK;
            break;
          case BLACK:
            this.board[y][x] = WHITE;
            break;
        }
      }
    }
    this.currentPlayer = this.currentPlayer === WHITE ? BLACK : WHITE;
  }

  actionToCoord (action) {
    const x = action % BOARD_SIZE;
    const y = Math.floor(action / BOARD_SIZE);
    return { x, y };
  }

  hash () {
    return this.board.map(line => line.join('')).join('');
  }
}

class Game {
  constructor (blackPlayer, whitePlayer) {
    this.players = {
      [BLACK]: blackPlayer,
      [WHITE]: whitePlayer,
    };
    this.state = new GameState();
    this.currentPlayer = BLACK;
    this.remainRound = BOARD_SIZE * BOARD_SIZE;
    this.elapseRound = 0;
  }

  async play () {
    const currentPlayerInst = this.players[this.currentPlayer];
    const state = this.state.clone();
    state.currentPlayer = this.currentPlayer;
    const { x, y } = await currentPlayerInst.decide(state);
    this.remainRound--;
    this.elapseRound++;
    this.state.set(x, y, this.currentPlayer);
    if (!this.checkWin(x, y)) {
      this.currentPlayer = this.currentPlayer === WHITE ? BLACK : WHITE;
      await this.play();
    }
  }

  checkWin (x, y) {
    this.suggest = null;
    const lines = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [dx, dy] = lines[i];
      let count = 1;
      const check = (dir, side) => {
        const statI = (dir + 1) / 2;
        for (let j = 1; j < WIN_CONDITION; j++) {
          var cx = x - dx * j * dir;
          var cy = y - dy * j * dir;
          if (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE) {
            if (this.state.get(cx, cy) === this.currentPlayer) {
              count++;
              continue;
            }
          }
          break;
        }
      }
      check(1);
      check(-1);
      if (count >= WIN_CONDITION) {
        this.win = this.currentPlayer;
        this.players[BLACK].end(this.state, this.currentPlayer === BLACK);
        this.players[WHITE].end(this.state, this.currentPlayer === WHITE);
        return true;
      }
    }
    if (this.remainRound === 0) {
      this.players[BLACK].end(this.state, false);
      this.players[WHITE].end(this.state, false);
      return true;
    }
    return false
  }
}

