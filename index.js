const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");
const cookieParser = require('cookie-parser')

app.set('view engine', 'ejs');
app.use(express.static(path.join(path.resolve(path.dirname('')),'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())

const httpServer = http.createServer(app);

const io = new Server(httpServer);

httpServer.listen(80, () => {
    console.log('listening on *:80');
  });

var games = {}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

function createGame(username){
    var gameID = makeid(4);
    games[gameID] = {"players": [username], "host": username, "gameID": gameID}
    return gameID
}

function checkGame(gameID){
    console.log(games)
    return games[gameID]
}

function joinGame(username, gameID){
    games[gameID].players.push(username)
    console.log(games[gameID].players)
    io.emit('playerUpdate', games[gameID].players)
}

io.on('connection', (socket) => {
    socket.on('leave', (gameID, username) => {
        var arr = games[gameID].players;
        var index = arr.indexOf(username);
        if (index > -1) {
            arr.splice(index, 1);
        }
        games[gameID].players = arr
        games[gameID].players.splice
        io.emit('playerUpdate', games[gameID].players)
    });
    socket.on('start', (gameID, username) => {
        if (username == games[gameID].host){
            io.emit('starting', games[gameID].gameID)
        }
    });
  });

app.get('/', (req,res) => {
	res.render('start');
});

app.get('/lobby', (req,res) => {
    if (req.cookies["gameID"]){
        var gameData = checkGame(req.cookies["gameID"])
        if (gameData){
            if (gameData.host == req.cookies["username"]){
                res.render('lobby', {data: gameData, host: true, username: req.cookies["username"]});
            } else {
                res.render('lobby', {data: gameData, host: false, username: req.cookies["username"]});
            }
        }
    } else {
        res.redirect('/');
    }
	
});

app.post('/host', (req,res) => {
    if(req.body.username){
        var data = createGame(req.body.username);
        res.cookie('gameID', data);
        res.cookie('username', req.body.username);
        res.redirect('lobby');
    }
})

app.post('/join', (req,res) => {
    if(req.body.username && req.body.gameID){
        if (checkGame(req.body.gameID)){
            joinGame(req.body.username, req.body.gameID)
            res.cookie('gameID', req.body.gameID)
            res.cookie('username', req.body.username)
            res.redirect('lobby');
        }
    }
})