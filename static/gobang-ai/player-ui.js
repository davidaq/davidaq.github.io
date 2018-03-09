const CELL_SIZE = 50;

class PlayerUI {
  constructor ($dom) {
    this.$dom = $dom;
  }

  decide (game, callback) {
    this.$dom.innerHTML = '';
    const boardWidth = CELL_SIZE * (BOARD_SIZE - 0.25)
    Object.assign(this.$dom.style, {
      width: `${boardWidth}px`,
      height: `${boardWidth}px`,
      background: '#9D9',
      transform: `scale(${(Math.min(window.innerWidth, window.innerHeight - 100) - 30) / boardWidth})`,
      transformOrigin: '0 0'
    });
    for (let y = 0; y < BOARD_SIZE; y++) {
      const $row = document.createElement('div');
      Object.assign($row.style, {
        position: 'absolute',
        boxSizing: 'border-box',
        left: `${CELL_SIZE * 0.5}px`,
        top: `${CELL_SIZE * (y + 0.5)}px`,
        width: `${1 + CELL_SIZE * (BOARD_SIZE - 1)}px`,
        height: '1px',
        background: '#000',
        zIndex: 0,
      });
      this.$dom.appendChild($row);
      const $col = document.createElement('div');
      Object.assign($col.style, {
        position: 'absolute',
        boxSizing: 'border-box',
        left: `${CELL_SIZE * (y + 0.5)}px`,
        top: `${CELL_SIZE * 0.5}px`,
        width: '1px',
        height: `${1 + CELL_SIZE * (BOARD_SIZE - 1)}px`,
        background: '#000',
        zIndex: 0,
      });
      this.$dom.appendChild($col);
      const line = game.board[y];
      for (let x = 0; x < BOARD_SIZE; x++) {
        const positionState = line[x];
        const $pos = document.createElement('div');
        Object.assign($pos.style, {
          position: 'absolute',
          width: `${CELL_SIZE * 0.8}px`,
          height: `${CELL_SIZE * 0.8}px`,
          borderRadius: `${CELL_SIZE}px`,
          top: `${CELL_SIZE * (0.1 + y)}px`,
          left: `${CELL_SIZE * (0.1 + x)}px`,
          zIndex: 1,
        });
        if (positionState === EMPTY) {
          if (!callback) {
            continue;
          }
          Object.assign($pos.style, {
            width: `${CELL_SIZE * 0.4}px`,
            height: `${CELL_SIZE * 0.4}px`,
            top: `${CELL_SIZE * (0.3 + y)}px`,
            left: `${CELL_SIZE * (0.3 + x)}px`,
            cursor: 'pointer',
            background: 'rgba(0, 100, 0, 0.0)',
            transition: 'background 0.3s',
          });
          $pos.addEventListener('mouseover', () => {
            $pos.style.background = 'rgba(0, 100, 0, 0.3)';
          });
          $pos.addEventListener('mouseout', () => {
            $pos.style.background = 'rgba(0, 100, 0, 0.0)';
          });
          $pos.addEventListener('click', () => {
            callback(x, y);
          });
        } else {
          Object.assign($pos.style, {
            boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.2)',
            background: positionState === BLACK ? '#000' : '#FFF',
          });
        }
        this.$dom.appendChild($pos);
      }
    }
  }

  end (game, winner) {
    this.decide(game);
  }
}
