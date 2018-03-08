const TIE = 0;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const BOARD_SIZE = 11;

class Game {
  constructor (players, rated) {
    this.players = players;
    this.rated = rated;
    this.score = [0, 0];
    this.currentPlayer = BLACK;
    this.prevPlay = null;
    this.remainRound = BOARD_SIZE * BOARD_SIZE;
    this.elapseRound = 0;
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
      this.elapseRound++;
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
    const elapsePenalty = Math.floor((this.elapseRound - 1) / 2);
    this.score[this.currentPlayer - 1] -= elapsePenalty;
    for (let i = 0; i < lines.length; i++) {
      const [dx, dy] = lines[i];
      let count = 1;
      let open = 0;
      const check = (dir) => {
        for (let j = 1; j < 5; j++) {
          var cx = x - dx * j * dir;
          var cy = y - dy * j * dir;
          if (cx < 0 || cx >= BOARD_SIZE || cy < 0 || cy >= BOARD_SIZE) {
            break;
          } else if (this.board[cy][cx] === EMPTY) {
            open++;
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
        this.score[this.currentPlayer - 1] += 100;
        this.players.forEach(player => {
          player.end(this, this.currentPlayer);
        });
        this.onEnd && this.onEnd(this.currentPlayer, this.score);
        return true;
      }
      if (this.rated) {
        let score = 0;
        // 检查活连
        if (count === 4) {
          if (open === 2) {
            score += 120;
          } else if (open === 1) {
            score += 90
          }
        } else if (count === 3) {
          if (open === 2) {
            score += 50;
          } else if (open === 1) {
            score += 20;
          }
        } else if (count === 2) {
          if (open === 2) {
            score += 10;
          }
        }
        // 检查堵住对方
        count = 0;
        const check = (dir) => {
          for (let j = 1; j < 5; j++) {
            var cx = x - dx * j * dir;
            var cy = y - dy * j * dir;
            if (cx < 0 || cx >= BOARD_SIZE || cy < 0 || cy >= BOARD_SIZE) {
              break;
            } else if (this.board[cy][cx] === EMPTY) {
              break;
            } else if (this.board[cy][cx] !== this.currentPlayer) {
              count++;
            } else {
              break;
            }
          }
        };
        check(1);
        check(-1);
        if (count > 3) {
          score += count * 30;
        }
        this.score[this.currentPlayer - 1] += score;
      }
    }
    if (this.remainRound === 0) {
      this.players.forEach(player => {
        player.end(this, TIE);
      });
      this.onEnd && this.onEnd(TIE, this.score);
      return true;
    }
    return false
  }
}

