var lal = 1;
var lalKing = 1.1
var black = -1;
var blackKing = -1.1
var empty = 0;
var player = lal;
var computer = black;
var currentBoard = {};
var INFINITY = 10000;
var NEG_INFINITY = -10000;
var cell_width = 0;
var board_origin = 0;
var RandomButtons = 0;
var MiniMaxButton = 0;
var game_tie = 0;

function MiniMaxB() {
	MiniMaxButton = 1;
	RandomButtons = 0;
}

function RandomButton() {
	RandomButtons = 1;
	MiniMaxButton = 0;
}


function createboard() {
	var initialBoard = [
		[lal, empty, lal, empty, lal, empty, lal, empty],
		[empty, lal, empty, lal, empty, lal, empty, lal],
		[lal, empty, lal, empty, lal, empty, lal, empty],
		[empty, empty, empty, empty, empty, empty, empty, empty],
		[empty, empty, empty, empty, empty, empty, empty, empty],
		[empty, black, empty, black, empty, black, empty, black],
		[black, empty, black, empty, black, empty, black, empty],
		[empty, black, empty, black, empty, black, empty, black]
	];

	var cells = new Array();
	var pieces = new Array();
	for (var i = 0; i < initialBoard.length; i++) {
		var row = initialBoard[i];
		for (var j = 0; j < row.length; j++) {
			var colValue = row[j];
			if (colValue != empty) {
				var piece = {
					row: i,
					col: j,
					state: colValue
				};
				pieces.push(piece);
			}
			var cell = {
				row: i,
				col: j,
				state: colValue
			};
			cells.push(cell);
		}
	}

	return {
		cells: cells,
		pieces: pieces,
		turn: lal
	};
}

function cell_matching(origin, width, cell) {
	var key = "" + cell.row + ":" + cell.col;
	if (!cell_matching.answers) cell_matching.answers = {};
	if (cell_matching.answers[key] != null) {
		return cell_matching.answers[key];
	}
	var x = origin.x + (cell.col * width);
	var y = origin.y + (cell.row * width);
	return cell_matching.answers[key] = {
		x: x,
		y: y
	};
}

function mapCoordinatesToCell(origin, width, cells, x, y) {
	var numSquares = 8;
	var boardLength = numSquares * width;
	if (x > (origin.x + boardLength)) return null;
	if (y > (origin.y + boardLength)) return null;
	var col = Math.ceil((x - origin.x) / width) - 1;
	var row = Math.ceil((y - origin.y) / width) - 1;
	var index = ((row * numSquares) + col);
	var cell = cells[index];

	return cell;
}

function startGame(origin, cellWidth, boardCanvas) {
	game_tie= 0;
	movePiece.moves = [];
	d3.select("#btnReplay").style("display", "none");
	cell_width = cellWidth;
	board_origin = origin;
	currentBoard = placement_of_pieces_initial(origin, cellWidth, boardCanvas);
	currentBoard.ui = true;
	showBoardState();
}


function movePiece(boardState, piece, fromCell, toCell, moveNum) {
	if (boardState.ui) {
		if (movePiece.moves == null) {
			movePiece.moves = [];
		}
		movePiece.moves.push({
			piece: {
				col: piece.col,
				row: piece.row,
				state: piece.state
			},
			from: {
				col: fromCell.col,
				row: fromCell.row
			},
			to: {
				col: toCell.col,
				row: toCell.row
			}
		});
	}

	// Get jumped piece
	var jumpedPiece = getJumpedPiece(boardState.cells, boardState.pieces, fromCell, toCell);

	// Update states
	var fromIndex = getCellIndex(fromCell.row, fromCell.col);
	var toIndex = getCellIndex(toCell.row, toCell.col);
	if ((toCell.row === 0 || toCell.row === 8) && Math.abs(piece.state) === 1) {
		boardState.cells[toIndex].state = piece.state * 1.1;
	} else {
		boardState.cells[toIndex].state = piece.state;
	}
	boardState.cells[fromIndex].state = empty;
	if ((toCell.row === 0 || toCell.row === 7) && Math.abs(piece.state) === 1) {
		piece.state = piece.state * 1.1
	}
	piece.col = toCell.col;
	piece.row = toCell.row;

	if (boardState.ui && (boardState.turn === computer || moveNum > 1)) {
		placement_change(toCell, moveNum);
	}

	if (jumpedPiece != null) {
		var jumpedIndex = getPieceIndex(boardState.pieces, jumpedPiece.row, jumpedPiece.col);
		var originialJumpPieceState = jumpedPiece.state;
		jumpedPiece.state = 0;

		var cellIndex = getCellIndex(jumpedPiece.row, jumpedPiece.col);
		var jumpedCell = boardState.cells[cellIndex];
		jumpedCell.state = empty;
		boardState.pieces[jumpedIndex].lastCol = boardState.pieces[jumpedIndex].col;
		boardState.pieces[jumpedIndex].lastRow = boardState.pieces[jumpedIndex].row;
		boardState.pieces[jumpedIndex].col = -1;
		boardState.pieces[jumpedIndex].row = -1;
		if (boardState.ui) {
			cut(jumpedCell, moveNum);
		}

		if (boardState.ui) {
			movePiece.moves.push({
				piece: {
					col: jumpedPiece.col,
					row: jumpedPiece.row,
					state: originialJumpPieceState
				},
				from: {
					col: jumpedCell.col,
					row: jumpedCell.row
				},
				to: {
					col: -1,
					row: -1
				}
			});
		}
		var more_moves = get_available_piece_moves(boardState, piece, boardState.turn);
		var another_move = null;
		for (var i = 0; i < more_moves.length; i++) {
			more_move = more_moves[i];
			if (more_move.move_type === "jump") {
				another_move = more_move;
				break;
			}
		}
		if (another_move != null) {
			moveNum += 1;
			boardState = movePiece(boardState, piece, another_move.from, another_move.to, moveNum);
			if (boardState.ui && boardState.turn === player) {
				boardState.numPlayerMoves += moveNum;
			}
		}
	}
	return boardState;
}

function getCellIndex(row, col) {
	var numSquares = 8;
	var index = ((row * numSquares) + col);
	return index;
}

function getPieceIndex(pieces, row, col) {
	var index = -1;
	for (var i = 0; i < pieces.length; i++) {
		var piece = pieces[i];
		if (piece.row === row && piece.col === col) {
			index = i;
			break;
		}
	}
	return index;
}

function getPieceCount(boardState) {
	var numRed = 0;
	var numBlack = 0;
	var pieces = boardState.pieces;
	for (var i = 0; i < pieces.length; i++) {
		var piece = pieces[i];
		if (piece.col >= 0 && piece.row >= 0) {
			if (piece.state === lal || piece.state === lalKing) {
				numRed += 1;
			} else if (piece.state === black || piece.state === blackKing) {
				numBlack += 1;
			}
		}
	}

	return {
		lal: numRed,
		black: numBlack
	};
}

function getScore(boardState) {
	var pieceCount = getPieceCount(boardState);
	var score = pieceCount.lal - pieceCount.black;
	return score;
}

function getWinner(boardState) {
	var pieceCount = getPieceCount(boardState);
	var kramank = get_available_moves(player, boardState);
	var okay = get_available_moves(computer, boardState);


	if(kramank.length === 0) {
		return black;
	}
	else if(okay.length === 0)
	{
		return lal;
	}

	if (pieceCount.lal > 0 && pieceCount.black === 0) {
		return lal;
	} else if (pieceCount.black > 0 && pieceCount.lal === 0) {
		return black;
	} else{
			//console.log(game_tie);
			if(game_tie>=2){
				return -2;
			}
	 return 0;
	}
}
//allow dragging of pieces from initial to final
function dragStart(d) {
	d3.select(this).classed("dragging", true);
}

function dragged(d) {
	if (currentBoard.gameOver) return;
	if (currentBoard.turn != lal && currentBoard.turn != lalKing) return;
	if (currentBoard.turn != player) return;
	var c = d3.select(this);
	d3.select(this)
		.attr("cx", d.x = d3.event.x)
		.attr("cy", d.y = d3.event.y);
}
//this function moves the circles/pieces from initial to final
function placement_change(cell, moveNum) {	
	var cellCoordinates = cell_matching(board_origin, cell_width, cell); 
	currentBoard.delay = (moveNum * 500) + 500;
	d3.selectAll("circle").each(function (d, i) {
		if (d.col === cell.col && d.row === cell.row) {
			d3.select(this)
				.transition()
				.delay(500 * moveNum)
				.attr("cx", d.x = cellCoordinates.x + cell_width / 2)
				.attr("cy", d.y = cellCoordinates.y + cell_width / 2);
		}
	});
}

//hide the circles or pieces when cut occurs
function cut(cell, moveNum) {
	currentBoard.delay = (moveNum * 600) + 500;
	d3.selectAll("circle").each(function (d, i) {
		if (d.state === 0 && d.lastRow === cell.row && d.lastCol === cell.col) {
			console.log("cut piece at col=" + cell.col + ", row=" + cell.row);
			d3.select(this).transition().delay(600 * moveNum)
				.style("display", "none");
				game_tie=-1;
		}
	});
}

function dragEnded(origin, width, node, d) {
	if (currentBoard.turn != lal && currentBoard.turn != lalKing) return;
	if (currentBoard.turn != player) return;
	var cell = mapCoordinatesToCell(origin, width, currentBoard.cells, d.x, d.y);
	var from = d;
	var to = cell;
	var legal = Legal(currentBoard.cells, currentBoard.pieces, d, from, to);
	var index = getCellIndex(d.row, d.col);
	var originalCell = currentBoard.cells[index];
	if (!legal) {
		var cellCoordinates = cell_matching(origin, width, originalCell);
		node
			.attr("cx", d.x = cellCoordinates.x + width / 2)
			.attr("cy", d.y = cellCoordinates.y + width / 2);
	} else {
		// Update global board state
		currentBoard = movePiece(currentBoard, d, originalCell, cell, 1);

		// Center circle in cell
		var cellCoordinates = cell_matching(origin, width, cell);
		node
			.attr("cx", d.x = cellCoordinates.x + width / 2)
			.attr("cy", d.y = cellCoordinates.y + width / 2);

		var score = getScore(currentBoard);
		showBoardState();

		currentBoard.turn = computer;

		// Computer's move
		var delayCallback = function () {
			var winner = getWinner(currentBoard);
			if (winner != 0) {
				currentBoard.gameOver = true;
			} else {
				if(MiniMaxButton === 1){
					console.log("minimax");
					computerMove();
				}
				else if(RandomButtons === 1){
					console.log("Random");
			    	RandomMove();
				}
			}
			updateScoreboard();
			return true;
		};

		var moveDelay = currentBoard.delay;
		setTimeout(delayCallback, moveDelay);

	}
}
function getJumpedPiece(cells, pieces, from, to) {
	var distance = {
		x: to.col - from.col,
		y: to.row - from.row
	};
	if (abs(distance.x) == 2) {
		var jumpRow = from.row + sign(distance.y);
		var jumpCol = from.col + sign(distance.x);
		var index = getPieceIndex(pieces, jumpRow, jumpCol);
		var jumpedPiece = pieces[index];
		return jumpedPiece;
	} else return null;

}

function Legal(cells, pieces, piece, from, to) {
	if ((to.col < 0) || (to.row < 0) || (to.col > 7) || (to.row > 7)) {
		//console.log("ILLEGAL MOVE: piece going off board");
		return false;
	}
	var distance = {
		x: to.col - from.col,
		y: to.row - from.row
	};
	if ((distance.x == 0) || (distance.y == 0)) {
		//console.log("ILLEGAL MOVE: horizontal or vertical move");
		return false;
	}
	if (abs(distance.x) != abs(distance.y)) {
		//console.log("ILLEGAL MOVE: non-diagonal move");
		return false;
	}
	if (abs(distance.x) > 2) {
		//console.log("ILLEGAL MOVE: more than two diagonals");
		return false;
	}

	if (to.state != empty) {
		return false;
	}
	if (abs(distance.x) == 2) {
		var jumpedPiece = getJumpedPiece(cells, pieces, from, to);
		if (jumpedPiece == null) {
			return false;
		}
		var pieceState = integ(piece.state);
		var jumpedState = integ(jumpedPiece.state);
		if (pieceState != -jumpedState) {
			return false;
		}
	}
	if ((integ(piece.state) === piece.state) && (sign(piece.state) != sign(distance.y))) {
		return false;
	}

	return true;
}

//drawing the board
function placement_of_pieces_initial(origin, cellWidth, boardCanvas) {
	var boardState = createboard();
	var cells = boardState.cells;
	var pieces = boardState.pieces;

	
	boardCanvas.append("g")
		.selectAll("rect")
		.data(cells)
		.enter().append("rect")
		.attr("x", function (d) {
			return cell_matching(origin, cellWidth, d).x
		})
		.attr("y", function (d) {
			return cell_matching(origin, cellWidth, d).y
		})
		.attr("height", cellWidth)
		.attr("width", cellWidth)
		.style("fill", function(d) {
			if(d.row % 2 === 0){
				if(d.col % 2 === 0) 
					return "azure";
				else
					return "#334756";
			}else{
				if(d.col % 2 === 0) 
					return "#334756";
				else
					return "azure";
			}
		})
		.style("stroke", "black")
		.style("stroke-width", "2px");

	//Draw pieces
	var dragEndedDimensions = function (d) {
		node = d3.select(this);
		dragEnded(origin, cellWidth, node, d);
	}

	var drag = d3.drag()
		.on("start", dragStart)
		.on("drag", dragged)
		.on("end", dragEndedDimensions);

	boardCanvas.append("g")
		.selectAll("circle")
		.data(pieces)
		.enter().append("circle")
		.attr("r", cellWidth / 2 - 6)
		.attr("cx", function (d) {
			var x = cell_matching(origin, cellWidth, d).x;
			return x + cellWidth / 2;
		})
		.attr("cy", function (d) {
			var y = cell_matching(origin, cellWidth, d).y;
			return y + cellWidth / 2;
		})
		.style("fill", function (d) {
			if (d.state == lal) return "red";
			else return "black";
		})
		.call(drag);

	//Draw scoreboard
	d3.select("#divScoreboard").remove();
	d3.select("body").append("div")
		.attr("id", "divScoreboard")
		.style("font-size", "40")
		.html("SCOREBOARD")

	d3.select("#divScoreboard")
		.append("div")
		.style("font-size", "24")
		.attr("id", "winner");

	d3.select("#divScoreboard")
		.append("div")
		.attr("id", "redScore")
		.style("font-size", "30")
		.html("Human: 0")

	d3.select("#divScoreboard")
		.append("div")
		.attr("id", "blackScore")
		.style("font-size", "30")
		.html("Computer: 0");

	return boardState;
}

function updateScoreboard() {
	var pieceCount = getPieceCount(currentBoard);
	var redLabel = "Human: " + Math.abs(12 - pieceCount.black);
	var blackLabel = "Computer: " + Math.abs(12 - pieceCount.lal);

	d3.select("#redScore")
		.html(redLabel);
	d3.select("#blackScore")
		.html(blackLabel);
	game_tie = game_tie + 1;
	var winner = getWinner(currentBoard);
	var winnerLabel = "";
	if (winner === player) {
		winnerLabel = "You Won!!";
	} else if (winner === computer) {
		winnerLabel = "Computer Won!!";
	}else if(winner === -2){
		winnerLabel = ' Game Draw!!'
	}

	if (winner != 0) {
		d3.select("#btnReplay")
			.style("display", "inline");
	}

	d3.select("#winner")
		.html(winnerLabel);
}

function integ(num) {
	if (num != null)
		return Math.round(num);
	else
		return null;
}

function abs(num) {
	return Math.abs(num);
}

function sign(num) {
	if (num < 0) return -1;
	else return 1;
}

function drawText(data) {
	boardCanvas.append("g")
		.selectAll("text")
		.data(data)
		.enter().append("text")
		.attr("x", function (d) {
			var x = cell_matching(board_origin, cell_width, d).x;
			return x + cell_width / 2;
		})
		.attr("y", function (d) {
			var y = cell_matching(board_origin, cell_width, d).y;
			return y + cell_width / 2;
		})
		.style("fill", function (d) {
			if (d.state === lal) return "black";
			else return "white";
		})
		.text(function (d) {
			if (d.state === lalKing || d.state === blackKing) return "King";
			else return "";
		});
}

function showBoardState() {
	d3.selectAll("text").each(function (d, i) {
		d3.select(this)
			.style("display", "none");
	});

	var cells = currentBoard.cells;
	var pieces = currentBoard.pieces;
	//drawText(cells);
	drawText(pieces);
}

// AI MOVEMENTS
function copy_board(board) {
	var newBoard = {};
	newBoard.ui = false;
	var cells = new Array();
	var pieces = new Array();

	for (var i = 0; i < board.cells.length; i++) {
		var cell = board.cells[i];
		var newCell = {
			row: cell.row,
			col: cell.col,
			state: cell.state
		};
		cells.push(newCell);
	}
	for (var i = 0; i < board.pieces.length; i++) {
		var piece = board.pieces[i];
		var newPiece = {
			row: piece.row,
			col: piece.col,
			state: piece.state
		};
		pieces.push(newPiece);
	}

	return {
		cells: cells,
		pieces: pieces,
		turn: board.turn
	};
}

function get_player_pieces(player, target_board) {
	player_pieces = new Array();
	for (var i = 0; i < target_board.pieces.length; i++) {
		var piece = target_board.pieces[i];
		if (piece.state === player || piece.state === (player + .1) || piece.state === (player - .1)) {
			player_pieces.push(piece);
		}
	}
	return player_pieces;
}

function get_cell_index(target_board, col, row) {
	var index = -1;
	for (var i = 0; i < target_board.cells.length; i++) {
		var cell = target_board.cells[i];
		if (cell.col === col && cell.row === row) {
			index = i;
			break;
		}
	}
	return index;
}

function get_available_piece_moves(target_board, target_piece, player) {
	var moves = [];
	var from = target_piece;

	// check for slides
	var x = [-1, 1];
	x.forEach(function (entry) {
		var cell_index = get_cell_index(target_board, from.col + entry, from.row + (player * 1));
		if (cell_index >= 0) {
			var to = target_board.cells[cell_index];
			if (Legal(target_board.cells, target_board.pieces, from, from, to)) {
				move = {
					move_type: 'slide',
					piece: player,
					from: {
						col: from.col,
						row: from.row
					},
					to: {
						col: to.col,
						row: to.row
					}
				};
				moves[moves.length] = move;
			}
		}
	});

	x = [-2, 2];
	x.forEach(function (entry) {
		var cell_index = get_cell_index(target_board, from.col + entry, from.row + (player * 2));
		if (cell_index >= 0) {
			var to = target_board.cells[cell_index];
			if (Legal(target_board.cells, target_board.pieces, from, from, to)) {
				move = {
					move_type: 'jump',
					piece: player,
					from: {
						col: from.col,
						row: from.row
					},
					to: {
						col: to.col,
						row: to.row
					}
				};
				moves[moves.length] = move;
			}
		}
	});

	// kings
	if (Math.abs(from.state) === 1.1) {
		// check for slides
		var x = [-1, 1];
		var y = [-1, 1];
		x.forEach(function (xmove) {
			y.forEach(function (ymove) {
				var cell_index = get_cell_index(target_board, from.col + xmove, from.row + ymove);
				if (cell_index >= 0) {
					var to = target_board.cells[cell_index];
					if (Legal(target_board.cells, target_board.pieces, from, from, to)) {
						move = {
							move_type: 'slide',
							piece: player,
							from: {
								col: from.col,
								row: from.row
							},
							to: {
								col: to.col,
								row: to.row
							}
						};
						moves[moves.length] = move;
					}
				}
			});
		});

		// check for jumps
		x = [-2, 2];
		y = [-2, 2];
		x.forEach(function (xmove) {
			y.forEach(function (ymove) {
				var cell_index = get_cell_index(target_board, from.col + xmove, from.row + ymove);
				if (cell_index >= 0) {
					var to = target_board.cells[cell_index];
					if (Legal(target_board.cells, target_board.pieces, from, from, to)) {
						move = {
							move_type: 'jump',
							piece: player,
							from: {
								col: from.col,
								row: from.row
							},
							to: {
								col: to.col,
								row: to.row
							}
						};
						moves[moves.length] = move;
					}
				}
			});
		});
	}

	return moves;
}

function get_available_moves(player, target_board) {

	var moves = [];
	var move = null;
	var player_pieces = get_player_pieces(player, target_board);

	for (var i = 0; i < player_pieces.length; i++) {
		var from = player_pieces[i];
		var piece_moves = get_available_piece_moves(target_board, from, player);
		moves.push.apply(moves, piece_moves);
	}

	//prune non-jumps, if applicable
	var jump_moves = [];
	for (var i = 0; i < moves.length; i++) {
		var move = moves[i];
		if (move.move_type == "jump") {
			jump_moves.push(move);
		}
	}
	if (jump_moves.length > 0) {
		moves = jump_moves;	
	}

	return moves;
}

function select_random(moves) {
	// Randomly select move
	var index = Math.floor(Math.random() * (moves.length - 1));
	var selected_move = moves[index];

	return selected_move;
}

function minimax(calc_board, limit) {

	//get available moves for computer
	var available_moves = get_available_moves(computer, calc_board);

	//get max value for each available move
	var max = max_value(calc_board, available_moves, limit);

	//find all moves that have max-value
	//min
	var best_moves = [];
	var max_move = null;
	for (var i = 0; i < available_moves.length; i++) {
		var next_move = available_moves[i];
		if (next_move.score === max) {
			max_move = next_move;
			best_moves.push(next_move);
		}
	}

	//randomize selection, if multiple moves have same max-value
	if (best_moves.length > 1) {
		max_move = select_random(best_moves);
	}

	return max_move;
}

function computerMove() {

	// Copy board into simulated board
	var new_board = copy_board(currentBoard);

	// Run algorithm to select next move
	var selected_move = minimax(new_board,2);
	console.log("best move: " + selected_move.from.col + ":" + selected_move.from.row + " to " + selected_move.to.col + ":" + selected_move.to.row);

	// Make computer's move
	var pieceIndex = getPieceIndex(currentBoard.pieces, selected_move.from.row, selected_move.from.col);
	var piece = currentBoard.pieces[pieceIndex];
	currentBoard = movePiece(currentBoard, piece, selected_move.from, selected_move.to, 1);
	placement_change(selected_move.to, 1);
	showBoardState();

	var winner = getWinner(currentBoard);
	if (winner != 0 ) {
		currentBoard.gameOver = true;
	} else {
		// Set turn back to human
		currentBoard.turn = player;
		currentBoard.delay = 0;
	}
}

function jump_available(available_moves) {
	var jump = false;
	for (var i = 0; i < available_moves.length; i++) {
		var move = available_moves[i];
		if (move.move_type == "jump") {
			jump = true;
			break;
		}
	}

	return jump;
}

function min_value(calc_board, human_moves, limit) {
	if (limit <= 0 && !jump_available(human_moves)) {
		return utility(calc_board);
	}
	var min = INFINITY;

	//for each move, get min
	if (human_moves.length > 0) {
		for (var i = 0; i < human_moves.length; i++) {
			new_board = copy_board(calc_board);

			//move human piece
			var human_move = human_moves[i];
			var pieceIndex = getPieceIndex(new_board.pieces, human_move.from.row, human_move.from.col);
			var piece = new_board.pieces[pieceIndex];
			new_board = movePiece(new_board, piece, human_move.from, human_move.to);

			//get available moves for computer
			var computer_moves = get_available_moves(computer, new_board);

			//get max value for this move
			var max_score = max_value(new_board, computer_moves, limit - 1);
			human_moves[i].score = max_score;
			//compare to min and update, if necessary
			if (max_score < min) {
				min = max_score;
			}
		}
	} else {
		//log("NO MORE MOVES FOR MIN: l=" + limit);
	}

	return min;
}

function max_value(calc_board, computer_moves, limit) {
	if (limit <= 0 && !jump_available(computer_moves)) {
		return utility(calc_board);
	}
	var max = NEG_INFINITY;

	//for each move, get max
	if (computer_moves.length > 0) {
		for (var i = 0; i < computer_moves.length; i++) {
			new_board = copy_board(calc_board);

			//move computer piece
			var computer_move = computer_moves[i];
			var pieceIndex = getPieceIndex(new_board.pieces, computer_move.from.row, computer_move.from.col);
			var piece = new_board.pieces[pieceIndex];
			new_board = movePiece(new_board, piece, computer_move.from, computer_move.to);

			//get available moves for human
			var human_moves = get_available_moves(player, new_board);

			//get min value for this move
			var min_score = min_value(new_board, human_moves, limit - 1);
			computer_moves[i].score = min_score;

			//compare to min and update, if necessary
			if (min_score > max) {
				max = min_score;
			}
		
		}
	} else {
		//log("NO MORE MOVES FOR MAX: l=" + limit);
	}

	return max;

}

function evaluate_position(x, y) {
	if (x == 0 || x == 7 || y == 0 || y == 7) {
		return 5;
	} else {
		return 3;
	}
}

function utility(target_board) {
	var sum = 0;
	var computer_pieces = 0;
	var computer_kings = 0; 
	var human_pieces = 0;
	var human_kings = 0;
	var computer_pos_sum = 0;
	var human_pos_sum = 0;

	for (var i = 0; i < target_board.pieces.length; i++) {
		var piece = target_board.pieces[i];
		if (piece.row > -1) { // only count pieces still on the board
			if (piece.state > 0) { // human
				human_pieces += 1;
				if (piece.state === 1.1) {
					human_kings += 1;
				}
				var human_pos = evaluate_position(piece.col, piece.row);
				human_pos_sum += human_pos;
			} else { // computer
				computer_pieces += 1;
				if (piece.state === -1.1) {
					computer_kings += 1;
				}
				var computer_pos = evaluate_position(piece.col, piece.row);
				computer_pos_sum += computer_pos;
			}
		}
	}

	var piece_difference = computer_pieces - human_pieces;
	var king_difference = computer_kings - human_kings;
	if (human_pieces === 0) {
		human_pieces = 0.00001;
	}
	var avg_human_pos = human_pos_sum / human_pieces;
	if (computer_pieces === 0) {
		computer_pieces = 0.00001;
	}
	var avg_computer_pos = computer_pos_sum / computer_pieces;
	var avg_pos_diff = avg_computer_pos - avg_human_pos;

	var features = [piece_difference, king_difference, avg_pos_diff];
	var weights = [20, 5, 1];

	var final_heuristics = 0;

	for (var f = 0; f < features.length; f++) {
		var fw = features[f] * weights[f];
		final_heuristics += fw;
	}


	return final_heuristics;
}
function RandomMove() {

	// Copy board into simulated board
	var new_board = copy_board(currentBoard);

	// Run algorithm to select next move
	var selected_move = select_random(get_available_moves(computer,new_board));
	console.log("random move from :  " + selected_move.from.col + ":" + selected_move.from.row + " to " + selected_move.to.col + ":" + selected_move.to.row);

	// Make computer's move
	var pieceIndex = getPieceIndex(currentBoard.pieces, selected_move.from.row, selected_move.from.col);
	var piece = currentBoard.pieces[pieceIndex];
	currentBoard = movePiece(currentBoard, piece, selected_move.from, selected_move.to, 1);
	placement_change(selected_move.to, 1);
	showBoardState();

	var winner = getWinner(currentBoard);
	if (winner != 0) {
		currentBoard.gameOver = true;
	} else {
		// Set turn back to human
		currentBoard.turn = player;
		currentBoard.delay = 0;
	}
}


/*
NAME:
DEVANSH GOEL
SOM PANDE
DEVYANSH SEHGAL*/



// 10-15 GAME KHEL K DEKHLENA 
// DO CHEEZO SE SAVDHAN 
