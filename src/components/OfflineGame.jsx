import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFullscreen, MdFullscreenExit } from 'react-icons/md';
import '../styles/offline-game.css';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const COLORS = ['#8b5cf6', '#38bdf8', '#f472b6', '#facc15', '#34d399', '#fb923c', '#60a5fa'];
const SHAPES = [
  [[1, 1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 1, 0], [0, 1, 1]]
];

const createBoard = () => Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
const cloneShape = (shape) => shape.map((row) => [...row]);
const createPiece = () => {
  const type = Math.floor(Math.random() * SHAPES.length);
  const shape = cloneShape(SHAPES[type]);
  return { shape, color: COLORS[type], x: Math.floor((BOARD_WIDTH - shape[0].length) / 2), y: 0 };
};
const rotate = (shape) => shape[0].map((_, column) => shape.map((row) => row[column]).reverse());
const collides = (board, piece, nextX = piece.x, nextY = piece.y, nextShape = piece.shape) => nextShape.some((row, rowIndex) => row.some((cell, columnIndex) => {
  if (!cell) return false;
  const x = nextX + columnIndex;
  const y = nextY + rowIndex;
  return x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT || (y >= 0 && board[y][x]);
}));

const OfflineGame = ({ attemptedUrl = '', onRetry, onGoHome, errorKind = 'offline', standalone = false }) => {
  const { t } = useTranslation('common');
  const isSiteError = errorKind === 'site';
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const gameRef = useRef({ board: createBoard(), piece: createPiece(), started: false, gameOver: false, score: 0, lines: 0, best: Number(localStorage.getItem('bluefox-tetris-best') || 0) });
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (attemptedUrl && !standalone) onRetry?.();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [attemptedUrl, onRetry, standalone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    const game = gameRef.current;
    const cell = 30;
    let animationFrame;
    let lastDrop = performance.now();

    const reset = () => {
      game.board = createBoard();
      game.piece = createPiece();
      game.started = true;
      game.gameOver = false;
      game.score = 0;
      game.lines = 0;
      lastDrop = performance.now();
    };

    const lockPiece = () => {
      game.piece.shape.forEach((row, rowIndex) => row.forEach((filled, columnIndex) => {
        if (filled && game.piece.y + rowIndex >= 0) game.board[game.piece.y + rowIndex][game.piece.x + columnIndex] = game.piece.color;
      }));
      const remaining = game.board.filter((row) => row.some((cellValue) => !cellValue));
      const cleared = BOARD_HEIGHT - remaining.length;
      game.board = [...Array.from({ length: cleared }, () => Array(BOARD_WIDTH).fill(0)), ...remaining];
      game.lines += cleared;
      game.score += cleared ? [0, 100, 300, 500, 800][cleared] : 10;
      game.piece = createPiece();
      if (collides(game.board, game.piece)) {
        game.gameOver = true;
        game.best = Math.max(game.best, game.score);
        localStorage.setItem('bluefox-tetris-best', String(game.best));
      }
    };

    const moveDown = () => {
      if (!game.started || game.gameOver) return;
      if (!collides(game.board, game.piece, game.piece.x, game.piece.y + 1)) game.piece.y += 1;
      else lockPiece();
      lastDrop = performance.now();
    };

    const moveSideways = (direction) => {
      if (!game.started || game.gameOver) return;
      const nextX = game.piece.x + direction;
      if (!collides(game.board, game.piece, nextX, game.piece.y)) game.piece.x = nextX;
    };

    const rotatePiece = () => {
      if (!game.started || game.gameOver) return;
      const nextShape = rotate(game.piece.shape);
      if (!collides(game.board, game.piece, game.piece.x, game.piece.y, nextShape)) game.piece.shape = nextShape;
    };

    const hardDrop = () => {
      if (!game.started || game.gameOver) return;
      while (!collides(game.board, game.piece, game.piece.x, game.piece.y + 1)) game.piece.y += 1;
      lockPiece();
    };

    const handleKeyDown = (event) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(event.code)) event.preventDefault();
      if (event.code === 'Space' || event.code === 'Enter') {
        if (!game.started || game.gameOver) reset();
        else hardDrop();
      } else if (event.code === 'ArrowLeft') moveSideways(-1);
      else if (event.code === 'ArrowRight') moveSideways(1);
      else if (event.code === 'ArrowDown') moveDown();
      else if (event.code === 'ArrowUp') rotatePiece();
    };

    const drawCell = (x, y, color) => {
      context.fillStyle = color;
      context.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
      context.fillStyle = 'rgba(255,255,255,.22)';
      context.fillRect(x * cell + 3, y * cell + 3, cell - 8, 3);
    };

    const draw = () => {
      const isDark = document.documentElement.dataset.theme === 'dark';
      const surface = isDark ? '#17131f' : '#ffffff';
      const grid = isDark ? 'rgba(255,255,255,.055)' : 'rgba(91,72,117,.10)';
      const overlay = isDark ? 'rgba(23,19,31,.86)' : 'rgba(255,255,255,.88)';
      const title = isDark ? '#c084fc' : '#7346bc';
      const copy = isDark ? '#e7dff0' : '#5f5668';
      context.fillStyle = surface;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = grid;
      context.lineWidth = 1;
      for (let x = 0; x <= BOARD_WIDTH; x += 1) { context.beginPath(); context.moveTo(x * cell, 0); context.lineTo(x * cell, canvas.height); context.stroke(); }
      for (let y = 0; y <= BOARD_HEIGHT; y += 1) { context.beginPath(); context.moveTo(0, y * cell); context.lineTo(canvas.width, y * cell); context.stroke(); }
      game.board.forEach((row, y) => row.forEach((color, x) => color && drawCell(x, y, color)));
      if (game.started) game.piece.shape.forEach((row, rowIndex) => row.forEach((filled, columnIndex) => filled && drawCell(game.piece.x + columnIndex, game.piece.y + rowIndex, game.piece.color)));
      context.textAlign = 'center';
      if (!game.started || game.gameOver) {
        context.fillStyle = overlay;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = title;
        context.font = '800 28px Inter, sans-serif';
        context.fillText(game.gameOver ? t('game.gameOver') : 'TETRIS', canvas.width / 2, canvas.height / 2 - 14);
        context.fillStyle = copy;
        context.font = '600 13px Inter, sans-serif';
        context.fillText(game.gameOver ? t('game.restart') : t('game.start'), canvas.width / 2, canvas.height / 2 + 18);
      }
      context.textAlign = 'left';
      context.fillStyle = copy;
      context.font = '700 11px Inter, sans-serif';
      context.fillText(`${t('game.score')} ${game.score}`, 12, 18);
      context.textAlign = 'right';
      context.fillText(`${t('game.lines')} ${game.lines}`, canvas.width - 12, 18);
    };

    const frame = (now) => {
      const speed = Math.max(140, 720 - game.lines * 25);
      if (game.started && !game.gameOver && now - lastDrop > speed) moveDown();
      draw();
      animationFrame = requestAnimationFrame(frame);
    };

    canvas.width = BOARD_WIDTH * cell;
    canvas.height = BOARD_HEIGHT * cell;
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('pointerdown', () => { if (!game.started || game.gameOver) reset(); });
    animationFrame = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await stageRef.current?.requestFullscreen?.();
  };

  return (
    <section ref={stageRef} className={`bluefox-offline-page ${standalone ? 'is-standalone' : ''}`} aria-labelledby="bluefox-offline-title">
      {!standalone && attemptedUrl && (
        <div className="bluefox-offline-redirect" role="status">
          <span>{isSiteError ? t('game.siteErrorText') : t('game.offlineText')}</span>
          <code title={attemptedUrl}>{attemptedUrl}</code>
        </div>
      )}
      <header className="bluefox-offline-header">
        <h1 id="bluefox-offline-title">{isSiteError ? <>{t('game.siteErrorTitle')}</> : <>{t('game.offlineTitle')}</>}</h1>
        <p className="bluefox-offline-subtitle">{isSiteError ? t('game.siteErrorText') : isOnline ? t('app.connectionOnline') : t('game.offlineText')}</p>
      </header>
      <div className="bluefox-offline-tetris-heading">
        <strong>{t('game.playTetris')}</strong>
        <button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? t('game.goHome') : t('game.playTetris')} title={isFullscreen ? t('game.goHome') : t('game.playTetris')}>
          {isFullscreen ? <MdFullscreenExit aria-hidden="true" /> : <MdFullscreen aria-hidden="true" />}
        </button>
      </div>
      <div className="bluefox-offline-tetris-stage">
        <canvas ref={canvasRef} aria-label={t('game.playTetris')} />
      </div>
    </section>
  );
};

export default OfflineGame;
