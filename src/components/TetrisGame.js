import React, { useState, useEffect, useCallback } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 1000;

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: 'cyan' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'blue' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'orange' },
  O: { shape: [[1, 1], [1, 1]], color: 'yellow' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' },
};

const createBoard = () => Array.from(Array(BOARD_HEIGHT), () => Array(BOARD_WIDTH).fill(0));

const TetrisGame = () => {
  const [board, setBoard] = useState(createBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [level, setLevel] = useState(1);

  const getRandomTetromino = useCallback(() => {
    const tetrominos = Object.keys(TETROMINOS);
    const randomTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
    return TETROMINOS[randomTetromino];
  }, []);

  const isColliding = useCallback((piece, pos) => {
    if (!piece) return false;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newY = pos.y + y;
          const newX = pos.x + x;
          if (
            newY >= BOARD_HEIGHT ||
            newX < 0 ||
            newX >= BOARD_WIDTH ||
            (board[newY] && board[newY][newX] !== 0)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, [board]);

  const rotatePiece = (piece) => {
    if (!piece) return null;
    const rotated = piece.shape[0].map((_, index) =>
      piece.shape.map((row) => row[index]).reverse()
    );
    return { ...piece, shape: rotated };
  };

  const movePiece = useCallback((dx, dy) => {
    if (!currentPiece || gameOver) return;
    const newPos = { x: position.x + dx, y: position.y + dy };
    if (!isColliding(currentPiece, newPos)) {
      setPosition(newPos);
    } else if (dy > 0) {
      placePiece();
    }
  }, [currentPiece, position, gameOver, isColliding]);

  const placePiece = useCallback(() => {
    if (!currentPiece) return;
    const newBoard = board.map((row) => [...row]);
    currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          newBoard[y + position.y][x + position.x] = currentPiece.color;
        }
      });
    });
    setBoard(newBoard);
    clearLines(newBoard);
    setCurrentPiece(nextPiece);
    setNextPiece(getRandomTetromino());
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - Math.floor(nextPiece.shape[0].length / 2), y: 0 });
    
    if (isColliding(nextPiece, { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(nextPiece.shape[0].length / 2), y: 0 })) {
      setGameOver(true);
    }
  }, [board, currentPiece, nextPiece, position, getRandomTetromino, isColliding]);

  const clearLines = useCallback((board) => {
    let linesCleared = 0;
    const newBoard = board.filter((row) => {
      if (row.every((cell) => cell !== 0)) {
        linesCleared++;
        return false;
      }
      return true;
    });

    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }

    if (linesCleared > 0) {
      setScore((prevScore) => prevScore + linesCleared * 100 * level);
      setBoard(newBoard);
    }
  }, [level]);

  const startGame = useCallback(() => {
    setBoard(createBoard());
    const newPiece = getRandomTetromino();
    const nextNewPiece = getRandomTetromino();
    setCurrentPiece(newPiece);
    setNextPiece(nextNewPiece);
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - Math.floor(newPiece.shape[0].length / 2), y: 0 });
    setGameOver(false);
    setScore(0);
    setGameStarted(true);
  }, [getRandomTetromino]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted || gameOver) return;
      switch (e.key) {
        case 'ArrowLeft':
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          const rotated = rotatePiece(currentPiece);
          if (rotated && !isColliding(rotated, position)) {
            setCurrentPiece(rotated);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameStarted, gameOver, currentPiece, position, movePiece, isColliding]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const speed = Math.max(INITIAL_SPEED - (level - 1) * 100, 100); // Adjust speed based on level
    const gameLoop = setInterval(() => {
      movePiece(0, 1);
    }, speed);

    return () => {
      clearInterval(gameLoop);
    };
  }, [gameStarted, gameOver, movePiece, level]);

  const handleLevelChange = (e) => {
    setLevel(Number(e.target.value));
  };

  const NextPiecePreview = ({ piece }) => {
    if (!piece) return null;
    const maxSize = Math.max(piece.shape.length, piece.shape[0].length);
    return (
      <div className="border-2 border-gray-300 p-2 bg-white">
        <div className="grid grid-cols-4 gap-1" style={{ width: `${maxSize * 24}px`, height: `${maxSize * 24}px` }}>
          {Array.from({ length: 4 * 4 }).map((_, index) => {
            const x = index % 4;
            const y = Math.floor(index / 4);
            const isFilled = piece.shape[y] && piece.shape[y][x];
            return (
              <div
                key={index}
                className={`w-6 h-6 ${isFilled ? `bg-${piece.color}-500` : 'bg-gray-100'}`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Tetris</h1>
      <div className="flex">
        <div className="border-4 border-gray-800 p-2 bg-white">
          {board.map((row, y) => (
            <div key={y} className="flex">
              {row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className={`w-6 h-6 border border-gray-300 ${
                    cell ? `bg-${cell}-500` : 'bg-white'
                  }`}
                >
                  {currentPiece &&
                    y >= position.y &&
                    y < position.y + currentPiece.shape.length &&
                    x >= position.x &&
                    x < position.x + currentPiece.shape[0].length &&
                    currentPiece.shape[y - position.y][x - position.x] === 1 && (
                      <div className={`w-full h-full bg-${currentPiece.color}-500`} />
                    )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="ml-4 flex flex-col items-center">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">Next Piece</h2>
            <NextPiecePreview piece={nextPiece} />
          </div>
          <div className="text-xl mb-2">Score: {score}</div>
          <div className="flex items-center mb-2">
            <label htmlFor="level" className="mr-2">Level:</label>
            <select
              id="level"
              value={level}
              onChange={handleLevelChange}
              className="border rounded p-1"
              disabled={gameStarted}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          {gameOver && (
            <div className="text-2xl font-bold text-red-600">Game Over!</div>
          )}
          {!gameStarted && (
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={startGame}
            >
              Start Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
};