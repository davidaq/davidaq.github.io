const TIE = 0;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const BOARD_SIZE = 11;

class Game {
  constructor (players) {
    this.players = players;
    this.currentPlayer = BLACK;
    this.prevPlay = null;
    this.remainRound = BOARD_SIZE * BOARD_SIZE;
    this.board = [];
    var line = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      line.push(EMPTY);
    }
    for (let i = 0; i < BOARD_SIZE; i++) {
      this.board.push(line.slice(0));
    }
  }

  play () {
    this.players[this.currentPlayer - 1].decide(this, (x, y) => {
      this.remainRound--;
      this.board[y][x] = this.currentPlayer;
      this.prevPlay = [x, y];
      if (!this.checkWin(x, y)) {
        if (this.currentPlayer === BLACK) {
          this.currentPlayer = WHITE;
        } else {
          this.currentPlayer = BLACK;
        }
        this.play();
      }
    });
  }

  checkWin (x, y) {
    const lines = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [dx, dy] = lines[i];
      let count = 1;
      const check = (dir) => {
        for (let j = 1; j < 5; j++) {
          var cx = x - dx * j * dir;
          var cy = y - dy * j * dir;
          if (cx < 0 || cx >= BOARD_SIZE || cy < 0 || cy >= BOARD_SIZE) {
            break;
          } else if (this.board[cy][cx] === this.currentPlayer) {
            count++;
          } else {
            break;
          }
        }
      }
      check(1);
      check(-1);
      if (count >= 5) {
        this.players.forEach(player => {
          player.end(this, this.currentPlayer);
        });
        this.onEnd && this.onEnd(this.currentPlayer);
        return true;
      }
    }
    if (this.remainRound === 0) {
      this.players.forEach(player => {
        player.end(this, TIE);
      });
      this.onEnd && this.onEnd(TIE);
      return true;
    }
    return false
  }
}

