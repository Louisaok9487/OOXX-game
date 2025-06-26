import React, { useState, useEffect } from 'react';

// Square component for each cell on the board
function Square({ value, onClick, isWinningSquare }) {
  const baseClasses = "w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center text-5xl sm:text-6xl font-bold transition-colors duration-200 hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-300";
  const winningClasses = "bg-yellow-300 border-yellow-500 ring-yellow-400 scale-105"; // Highlight winning squares

  return (
    <button
      className={`${baseClasses} ${isWinningSquare ? winningClasses : ''}`}
      onClick={onClick}
    >
      {value === 'X' && <span className="text-blue-600">X</span>}
      {value === 'O' && <span className="text-red-600">O</span>}
    </button>
  );
}

// Board component to render the 3x3 grid of squares
function Board({ squares, onClick, winningLine }) {
  // Renders a single square
  const renderSquare = (i) => {
    const isWinning = winningLine && winningLine.includes(i);
    return <Square value={squares[i]} onClick={() => onClick(i)} isWinningSquare={isWinning} />;
  };

  return (
    <div className="grid grid-cols-3 gap-2 p-4 bg-white rounded-xl shadow-lg border border-gray-300">
      <div className="flex justify-center">{renderSquare(0)}</div>
      <div className="flex justify-center">{renderSquare(1)}</div>
      <div className="flex justify-center">{renderSquare(2)}</div>
      <div className="flex justify-center">{renderSquare(3)}</div>
      <div className="flex justify-center">{renderSquare(4)}</div>
      <div className="flex justify-center">{renderSquare(5)}</div>
      <div className="flex justify-center">{renderSquare(6)}</div>
      <div className="flex justify-center">{renderSquare(7)}</div>
      <div className="flex justify-center">{renderSquare(8)}</div>
    </div>
  );
}

// Main Game component
function App() {
  // State for the board, initialized as an array of 9 nulls
  const [board, setBoard] = useState(Array(9).fill(null));
  // State to track whose turn it is (false for 'O' - human starts, true for 'X' - computer)
  const [xIsNext, setXIsNext] = useState(false); // Human 'O' starts
  // State to store the winner message
  const [winner, setWinner] = useState(null);
  // State to track if it's a draw
  const [isDraw, setIsDraw] = useState(false);
  // State for LLM generated game analysis
  const [gameAnalysis, setGameAnalysis] = useState('');
  // State for loading indicator during LLM call
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  // State to store the winning line for highlighting
  const [winningLine, setWinningLine] = useState(null);

  // useEffect to check for winner or draw whenever the board changes
  useEffect(() => {
    const winnerInfo = calculateWinner(board);
    if (winnerInfo) {
      setWinner(winnerInfo.winner);
      setWinningLine(winnerInfo.line);
    } else if (!board.includes(null)) {
      // If no winner and no empty squares, it's a draw
      setIsDraw(true);
    } else if (xIsNext && !winnerInfo) { // It's computer's turn ('X') and no winner yet
      // Add a small delay for better user experience
      setTimeout(() => {
        makeComputerMove(board);
      }, 500);
    }
  }, [board, xIsNext]); // Dependency array: run when board or xIsNext state changes

  // Function to handle a square click (human player 'O')
  const handleClick = (i) => {
    // If there's a winner, a draw, the square is already filled, or it's not O's turn, do nothing
    if (winner || isDraw || board[i] || xIsNext) { // xIsNext is true means it's X's (computer's) turn
      return;
    }

    // Create a copy of the board to modify (immutability is important in React)
    const newBoard = board.slice();
    // Fill the clicked square with 'O'
    newBoard[i] = 'O';
    // Update the board state
    setBoard(newBoard);
    // Toggle the turn to computer (X)
    setXIsNext(true);
  };

  // AI Logic for computer player 'X'
  const makeComputerMove = (currentBoard) => {
    const newBoard = currentBoard.slice();
    const availableSquares = newBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);

    // If no available squares, something went wrong or game is already over (handled by useEffect)
    if (availableSquares.length === 0) {
      return;
    }

    let bestMove = -1;

    // Strategy 1: Check if computer ('X') can win in the next move
    for (let i = 0; i < availableSquares.length; i++) {
      const tempBoard = newBoard.slice();
      tempBoard[availableSquares[i]] = 'X';
      if (calculateWinner(tempBoard)?.winner === 'X') {
        bestMove = availableSquares[i];
        break;
      }
    }

    // Strategy 2: Block human player ('O') if they can win in the next move
    if (bestMove === -1) {
      for (let i = 0; i < availableSquares.length; i++) {
        const tempBoard = newBoard.slice();
        tempBoard[availableSquares[i]] = 'O';
        if (calculateWinner(tempBoard)?.winner === 'O') {
          bestMove = availableSquares[i];
          break;
        }
      }
    }

    // Strategy 3: Take the center if available
    if (bestMove === -1 && newBoard[4] === null) {
      bestMove = 4;
    }

    // Strategy 4: Take a corner if available
    if (bestMove === -1) {
      const corners = [0, 2, 6, 8];
      for (let i = 0; i < corners.length; i++) {
        if (newBoard[corners[i]] === null) {
          bestMove = corners[i];
          break;
        }
      }
    }

    // Strategy 5: Take any remaining available square
    if (bestMove === -1) {
      bestMove = availableSquares[Math.floor(Math.random() * availableSquares.length)];
    }

    newBoard[bestMove] = 'X'; // Computer plays as 'X'
    setBoard(newBoard);
    setXIsNext(false); // Toggle turn back to human (O)
  };

  // Function to reset the game
  const resetGame = () => {
    setBoard(Array(9).fill(null)); // Reset board to empty
    setXIsNext(false); // 'O' (human) starts
    setWinner(null); // Clear winner
    setIsDraw(false); // Clear draw status
    setGameAnalysis(''); // Clear previous analysis
    setIsLoadingAnalysis(false); // Reset loading state
    setWinningLine(null); // Clear winning line
  };

  // Determine the status message for the game
  const getStatus = () => {
    if (winner) {
      return `Winner: ${winner}`;
    } else if (isDraw) {
      return `It's a Draw!`;
    } else {
      return xIsNext ? "Computer's turn (X)" : 'Your turn (O)';
    }
  };

  // Function to calculate the winner and the winning line
  function calculateWinner(squares) {
    // Define all possible winning lines (rows, columns, diagonals)
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    // Iterate through each winning line
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      // Check if the values in the squares match and are not null
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] }; // Return winner and the winning line
      }
    }
    return null; // No winner yet
  }

  // Helper to format the board for the LLM prompt
  const formatBoardForLLM = (currentBoard) => {
    let formatted = "";
    for (let i = 0; i < 9; i++) {
      formatted += (currentBoard[i] || " ") + ( (i + 1) % 3 === 0 ? "\n" : " | " );
    }
    return formatted.trim();
  };

  // Function to call Gemini API for game analysis
  const getLLMGameAnalysis = async () => {
    setIsLoadingAnalysis(true);
    setGameAnalysis(''); // Clear previous analysis while loading

    const formattedBoard = formatBoardForLLM(board);
    let prompt = `Analyze this Tic-Tac-Toe game. The final board state was:\n${formattedBoard}\n`;

    if (winner) {
      prompt += `The winner was ${winner}. `;
      if (winner === 'O') { // Human player is 'O'
        prompt += `Comment on the human player's (O) strategy or a key winning move.`;
      } else { // Computer player is 'X'
        prompt += `Comment on the computer opponent's (X) strategy or a key winning move.`;
      }
    } else if (isDraw) {
      prompt += `The game was a draw. Comment on the tight play and defensive strategies.`;
    }
    prompt += ` Keep the analysis concise, fun, and no more than two sentences.`;


    try {
        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = ""; // If you want to use models other than gemini-2.0-flash or imagen-3.0-generate-002, provide an API key here. Otherwise, leave this as-is.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            setGameAnalysis(text);
        } else {
            setGameAnalysis("Could not get analysis. Unexpected response from LLM.");
            console.error("LLM response structure unexpected:", result);
        }
    } catch (error) {
        setGameAnalysis("Failed to get game analysis. Please try again later.");
        console.error("Error calling Gemini API:", error);
    } finally {
        setIsLoadingAnalysis(false);
    }
  };


  return (
    // Main container with responsive styling
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-blue-200 p-4 font-inter text-gray-800">
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-8 text-purple-800 drop-shadow-md">Tic-Tac-Toe</h1>

      {/* Game status display */}
      <div className="text-2xl sm:text-3xl font-semibold mb-6 text-center">
        {getStatus()}
      </div>

      {/* Board component */}
      <Board squares={board} onClick={handleClick} winningLine={winningLine} />

      {/* Action buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          className="px-6 py-3 bg-green-500 text-white font-semibold rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
          onClick={resetGame}
        >
          Reset Game
        </button>

        {/* LLM Analysis Button - appears only when game is over */}
        {(winner || isDraw) && (
          <button
            className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
            onClick={getLLMGameAnalysis}
            disabled={isLoadingAnalysis}
          >
            {isLoadingAnalysis ? 'Analyzing... 🧠' : 'Get Game Analysis ✨'}
          </button>
        )}
      </div>

      {/* Results and Analysis Section (visible when game is over or analysis is loading/present) */}
      {(winner || isDraw || gameAnalysis || isLoadingAnalysis) && (
        <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border border-gray-300 max-w-lg w-full text-center">
          <h2 className="text-3xl font-bold mb-4 text-purple-700">
            {winner || isDraw ? 'Game Over!' : 'Analysis'}
          </h2>
          <p className="text-2xl font-semibold text-gray-800 mb-6">
            {getStatus()}
          </p>

          {isLoadingAnalysis && (
            <div className="text-xl text-gray-600 mb-6 flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating analysis...
            </div>
          )}

          {gameAnalysis && !isLoadingAnalysis && (
            <p className="text-xl text-gray-700 italic mb-6">
              "{gameAnalysis}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
