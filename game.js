const BLACK = 1;
const WHITE = -1;
const EMPTY = 0;
const SIZE = 8;

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0], [ 1, 1],
];

let board = [];
let currentPlayer = BLACK;
let gameOver = false;
let history = [];

function initBoard() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  board[3][3] = WHITE;
  board[3][4] = BLACK;
  board[4][3] = BLACK;
  board[4][4] = WHITE;
}

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function getFlips(r, c, player) {
  if (board[r][c] !== EMPTY) return [];
  const flips = [];
  for (const [dr, dc] of DIRECTIONS) {
    const line = [];
    let nr = r + dr, nc = c + dc;
    while (inBounds(nr, nc) && board[nr][nc] === -player) {
      line.push([nr, nc]);
      nr += dr;
      nc += dc;
    }
    if (line.length > 0 && inBounds(nr, nc) && board[nr][nc] === player) {
      flips.push(...line);
    }
  }
  return flips;
}

function getValidMoves(player) {
  const moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (getFlips(r, c, player).length > 0) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

function countDiscs() {
  let black = 0, white = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === BLACK) black++;
      else if (board[r][c] === WHITE) white++;
    }
  }
  return { black, white };
}

// --- DOM ---

function renderBoard(validMoves) {
  const boardEl = document.getElementById('board');
  boardEl.innerHTML = '';

  const validSet = new Set(validMoves.map(([r, c]) => `${r},${c}`));

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';

      if (board[r][c] !== EMPTY) {
        const piece = document.createElement('div');
        piece.className = `piece ${board[r][c] === BLACK ? 'black' : 'white'}`;
        cell.appendChild(piece);
      } else if (validSet.has(`${r},${c}`)) {
        cell.classList.add('hint');
        cell.addEventListener('click', () => handleMove(r, c));
      }

      boardEl.appendChild(cell);
    }
  }
}

function updateScoreboard() {
  const { black, white } = countDiscs();
  document.getElementById('count-black').textContent = black;
  document.getElementById('count-white').textContent = white;

  const discEl = document.getElementById('current-disc');
  const turnText = document.getElementById('turn-text');
  if (currentPlayer === BLACK) {
    discEl.className = 'disc black';
    turnText.textContent = '黒の番';
    document.getElementById('score-black').style.opacity = '1';
    document.getElementById('score-white').style.opacity = '0.5';
  } else {
    discEl.className = 'disc white';
    turnText.textContent = '白の番';
    document.getElementById('score-black').style.opacity = '0.5';
    document.getElementById('score-white').style.opacity = '1';
  }
}

function setMessage(text) {
  document.getElementById('message').textContent = text;
}

function saveHistory() {
  history.push({
    board: board.map(row => [...row]),
    currentPlayer,
  });
  updateUndoButton();
}

function undoMove() {
  if (history.length === 0) return;
  const prev = history.pop();
  board = prev.board;
  currentPlayer = prev.currentPlayer;
  gameOver = false;
  document.getElementById('game-over-overlay').classList.add('hidden');
  setMessage('');
  const validMoves = getValidMoves(currentPlayer);
  updateScoreboard();
  renderBoard(validMoves);
  updateUndoButton();
}

function updateUndoButton() {
  document.getElementById('undo-btn').disabled = history.length === 0;
}

function handleMove(r, c) {
  if (gameOver) return;

  const flips = getFlips(r, c, currentPlayer);
  if (flips.length === 0) return;

  saveHistory();

  board[r][c] = currentPlayer;

  flips.forEach(([fr, fc]) => {
    board[fr][fc] = currentPlayer;
  });

  currentPlayer = -currentPlayer;
  nextTurn();
}

function nextTurn() {
  const validMoves = getValidMoves(currentPlayer);

  if (validMoves.length > 0) {
    setMessage('');
    updateScoreboard();
    renderBoard(validMoves);
    return;
  }

  // パス判定
  const opponentMoves = getValidMoves(-currentPlayer);
  if (opponentMoves.length > 0) {
    const name = currentPlayer === BLACK ? '黒' : '白';
    setMessage(`${name}は置ける場所がないためパスします`);
    currentPlayer = -currentPlayer;
    updateScoreboard();
    renderBoard(opponentMoves);
    return;
  }

  // 両者パス → ゲーム終了
  endGame();
}

function endGame() {
  gameOver = true;
  renderBoard([]);

  const { black, white } = countDiscs();
  document.getElementById('final-black').textContent = black;
  document.getElementById('final-white').textContent = white;

  let title;
  if (black > white) title = '黒の勝ち！';
  else if (white > black) title = '白の勝ち！';
  else title = '引き分け！';

  document.getElementById('game-over-title').textContent = title;
  document.getElementById('game-over-overlay').classList.remove('hidden');
}

function resetGame() {
  gameOver = false;
  currentPlayer = BLACK;
  history = [];
  initBoard();
  document.getElementById('game-over-overlay').classList.add('hidden');
  setMessage('');
  const validMoves = getValidMoves(currentPlayer);
  updateScoreboard();
  renderBoard(validMoves);
  updateUndoButton();
}

// --- Init ---
document.getElementById('reset-btn').addEventListener('click', resetGame);
document.getElementById('undo-btn').addEventListener('click', undoMove);
document.getElementById('play-again-btn').addEventListener('click', resetGame);

resetGame();
