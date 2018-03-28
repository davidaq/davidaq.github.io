const TIE = 0;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const BOARD_SIZE = 7;
const WIN_CONDITION = 4;

class Board {
  constructor (board) {
    if (board) {
      this.board = board.map(line => line.slice());
    } else {
      this.board = [];
      var line = [];
      this.win = TIE;
      for (let i = 0; i < BOARD_SIZE; i++) {
        line.push(EMPTY);
      }
      for (let i = 0; i < BOARD_SIZE; i++) {
        this.board.push(line.slice());
      }
    }
  }

  cloneBoard () {
    return new Board(this.board);
  }

  emptyPos () {
    const available = [];
    this.board.forEach((line, y) => line.forEach((v, x) => {
      if (v === EMPTY) {
        available.push({ x, y });
      }
    }));
    return available;
  }

  hash () {
    const ret = []
    this.board.forEach((line) => line.forEach((v) => {
      ret.push(v);
    }));
    return ret.join('')
  }
}

class Game extends Board {
  constructor (black, white) {
    super();
    this.players = {
      [BLACK]: black,
      [WHITE]: white,
    };
    this.currentPlayer = BLACK;

    this.remainRound = BOARD_SIZE * BOARD_SIZE;
    this.elapseRound = 0;
  }

  async play () {
    const [x, y] = await this.players[this.currentPlayer].decide(this);
    this.remainRound--;
    this.elapseRound++;
    this.board[y][x] = this.currentPlayer;
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
            if (this.board[cy][cx] === this.currentPlayer) {
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
        this.players[BLACK].end(this, this.currentPlayer);
        this.players[WHITE].end(this, this.currentPlayer);
        return true;
      }
    }
    if (this.remainRound === 0) {
      this.players[BLACK].end(this, TIE);
      this.players[WHITE].end(this, TIE);
      return true;
    }
    return false
  }
}

