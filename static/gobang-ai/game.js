const TIE = 0;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const BOARD_SIZE = 9;

class Game {
  constructor (players, train) {
    this.players = players;
    this.train = train;
    this.currentPlayer = BLACK;
    this.prevPlay = null;
    this.suggest = null;
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
    this.suggest = null;
    const lines = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ];
    let reward = 0;
    for (let i = 0; i < lines.length; i++) {
      const [dx, dy] = lines[i];
      const stat = {
        count: [0, 0],
        open: [0, 0],
        openPos: [null, null],
      };
      const check = (dir, side) => {
        const statI = (dir + 1) / 2;
        for (let j = 1; j < 5; j++) {
          var cx = x - dx * j * dir;
          var cy = y - dy * j * dir;
          if (cx < 0 || cx >= BOARD_SIZE || cy < 0 || cy >= BOARD_SIZE) {
            break;
          } else if (this.board[cy][cx] === EMPTY) {
            stat.open[statI]++;
            stat.openPos[statI] = [cx, cy];
            break;
          } else if (this.board[cy][cx] === side) {
            stat.count[statI]++;
          } else {
            break;
          }
        }
      }
      check(1, this.currentPlayer);
      check(-1, this.currentPlayer);
      let count = 1 + stat.count[0] + stat.count[1];
      let open = stat.open[0] + stat.open[1];
      if (count >= 4) {
        this.isWin = true;
        this.onReward && this.onReward(this.currentPlayer, 1);
        this.players.forEach(player => {
          player.end(this, this.currentPlayer);
        });
        this.onEnd && this.onEnd(this.currentPlayer);
        return true;
      }
      // if (this.train) {
      //   // 检查活连
      //   if (count === 3) {
      //     if (open === 2) {
      //       reward += 0.2;
      //     } else if (open === 1) {
      //       reward += 0.1;
      //       this.suggest = stat.openPos[0] || stat.openPos[1];
      //     }
      //   }
      // }
    }
    reward /= Math.ceil((this.elapseRound + 1) / 2);
    // this.onReward && this.onReward(this.currentPlayer, reward);
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

