const express = require('express');
const socketio = require('socket.io');
const http = require("http");
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const chess = new Chess();

let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {

    console.log("connected");

    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "white");
    }

    else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "black");
    }

    else {
        uniquesocket.emit("roomFull");
    }
    uniquesocket.on("disconnect", function () {

        if (players.white === uniquesocket.id) {
            delete players.white;
        }

        else if (players.black === uniquesocket.id) {
            delete players.black;
        }

        console.log("disconnected");
    });


    uniquesocket.on("move", function (move) {
        try {

            if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
            if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

            const result = chess.move(move);

            if (result) {

                io.emit("move", move);
                io.emit("boardState", chess.fen());

            } else {

                console.log("Invalid move:", move);
                uniquesocket.emit("invalidMove", move);

            }

        } catch (error) {
            console.log("Invalid move attempted:", move);
            uniquesocket.emit("invalidMove", move);
        }

    });

});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});