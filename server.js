require.paths.unshift('./node_modules');


/* Http Variables */
var port = (3000);
var host = ('localhost');
var http = require('http');


var express = require('express');

var app = express.createServer();
var io = require('socket.io').listen(app);

/*
if(process.env.VMC_APP_PORT) {
    io.enable('browser client minification');  // send minified client
    //io.enable('browser client etag');          // apply etag caching logic based on version number
    io.set('log level', 1);                    // reduce logging
    io.set('transports', [                     // enable all transports (optional if you want flashsocket)
//        'websocket'
       'htmlfile'
      , 'xhr-polling'
      , 'jsonp-polling'
    ]);
}
*/

app.configure(function () {
    app.use(express.static(__dirname+'/static'));
  //  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.listen(port);


roomList = [];
rooms = {};
sockets = {};

io.sockets.on('connection', function (socket) {
  socket.on('login', function (data) {
    //pull from database--fake it now
    //this should go into database recall function
    var username = data.username;
    socket.set('names', {username: username, nickname: data.nickname || username}, function (){}); //allow database nickname as middle option
    var ret = {'username':username, 'nickname':data.nickname || username, 'options':{'chatHistory':"show5"}};
    socket.emit('loadUser', ret);
    sockets[username] = socket;
  });
  
  socket.on('newRoom', function (data) {
    //create a database entry for new room, new objectId
    //faking
    var roomId =  Math.round(Math.random()*1000);
    socket.emit('roomId', roomId);
    //add to room list, broadcast to relevant users.
    socket.join(roomId);
    socket.get('names', function (err, names) {
      socket.broadcast.emit('newRoomOpen', {nickname:names.nickname, roomId:roomId});
      var users = {};
      users[names.username] =names.nickname;
      rooms[roomId] = {owner: names.username, users: users, actions: []};
      roomList.push([roomId, names.nickname]);
    });
  });
  
  socket.on("getRoomList", function () {
    //need to filter accordingly in the future
    socket.emit('roomList', roomList);
  })

  socket.on('joinRoom', function (roomId) {
      socket.join(roomId);
      socket.get('names', function (err, names){
        var room = rooms[roomId];
        //a little messy and redundant dealing with nicknames vs. usernames????
        socket.broadcast.to(roomId).emit("receiveCast", [roomId, names.nickname, 'u', 'added']);
        sockets[room.owner].emit('receiveCast', [roomId, names.username, 'u', 'userName']);
        room.actions.push([names.nickname, 'u', 'added']);
        room.users[names.username] = names.nickname;

        var nicks = [];
        for (var uname in room.users) {
                  console.log(room.users[uname]);
          nicks.push(room.users[uname]);
        }
        socket.emit('roomData', {roomId: roomId, owner: room.owner, users:nicks, actions:room.actions} );
      });
  }); 


  socket.on('sendGraph', function (data) {
    var roomId = data[0];
    var room = rooms[roomId];
    socket.get("names", function (err, names) {
      var act = [roomId, names.nickname, 'g', data[1] ];
      room.actions.push(act.slice(1));
      socket.broadcast.to(roomId).emit('receiveCast', act);
    });
  });
  
  socket.on('sendChat', function (data) {
    var roomId = data[0];
    var room = rooms[roomId];
    console.log(data);
    socket.get("names", function (err, names) {
      var act = [roomId, names.nickname, 'c', data[1] ];
      room.actions.push(act.slice(1));
      socket.broadcast.to(roomId).emit('receiveCast', act);
    });
  })
  
  
});

