const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const rederBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {

            const squareElement = document.createElement("div");

            squareElement.classList.add(
                "square",
                (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if (square) {

                const pieceElement = document.createElement("div");

                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );

                pieceElement.style.backgroundImage = `url(${getPieceSVG(square)})`;

                pieceElement.draggable = playerRole === (square.color === "w" ? "white" : "black");

                pieceElement.addEventListener("dragstart", (e) => {
                    draggedPiece = pieceElement;
                    sourceSquare = {
                        row: rowindex,
                        col: squareindex
                    };
                    e.dataTransfer.setData("text/plain", "");
                    setTimeout(() => pieceElement.classList.add("dragging"), 0);
                });

                pieceElement.addEventListener("dragend", () => {
                    pieceElement.classList.remove("dragging");
                    draggedPiece = null;
                    sourceSquare = null;
                    rederBoard();
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", function (e) {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", function (e) {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handelMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });
};

const handelMove = (source, target) => {
    const move = {
        from: String.fromCharCode(97 + source.col) + (8 - source.row),
        to: String.fromCharCode(97 + target.col) + (8 - target.row),
        promotion: "q"
    };
    socket.emit("move", move);
};

const getPieceSVG = (piece) => {
    const svgUrls = {
        wp: "4/45/Chess_plt45.svg",
        wr: "7/72/Chess_rlt45.svg",
        wn: "7/70/Chess_nlt45.svg",
        wb: "b/b1/Chess_blt45.svg",
        wq: "1/15/Chess_qlt45.svg",
        wk: "4/42/Chess_klt45.svg",
        bp: "c/c7/Chess_pdt45.svg",
        br: "f/ff/Chess_rdt45.svg",
        bn: "e/ef/Chess_ndt45.svg",
        bb: "9/98/Chess_bdt45.svg",
        bq: "4/47/Chess_qdt45.svg",
        bk: "f/f0/Chess_kdt45.svg"
    };
    return `https://upload.wikimedia.org/wikipedia/commons/${svgUrls[piece.color + piece.type]}`;
};

socket.on("playerRole", (role) => {
    playerRole = role;
    const roleEl = document.getElementById('player-role');
    if (roleEl) {
        if (role === 'white') {
            roleEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-100 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span> Playing as White';
            roleEl.className = 'text-sm font-semibold px-4 py-1 rounded-full bg-slate-700 border border-slate-600 shadow-inner flex items-center gap-2 text-slate-100 transition-colors duration-300';
            boardElement.classList.remove('flipped');
        } else if (role === 'black') {
            roleEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-900 shadow-[0_0_8px_rgba(0,0,0,0.8)]"></span> Playing as Black';
            roleEl.className = 'text-sm font-semibold px-4 py-1 rounded-full bg-slate-700 border border-slate-600 shadow-inner flex items-center gap-2 text-slate-100 transition-colors duration-300';
            boardElement.classList.add('flipped');
        }
    }
    rederBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    const roleEl = document.getElementById('player-role');
    if (roleEl) {
        roleEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse"></span> Spectating';
        roleEl.className = 'text-sm font-semibold px-4 py-1 rounded-full bg-purple-900/30 border border-purple-500/50 shadow-inner flex items-center gap-2 text-purple-200 transition-colors duration-300';
    }
    rederBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    rederBoard();   
});

socket.on("move", (move) => {
    chess.move(move);
    rederBoard();   
});

socket.on("invalidMove", (move) => {
    rederBoard();
});

rederBoard();