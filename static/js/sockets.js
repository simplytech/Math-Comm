//responsible for communication to the server
//forms design specs for server and client.

$(function () {
  
var socket = io.connect();

//models e.on("", function() {o.emit()})
var emitOnSetup = function (e, o, msgs) {
  var i;
  var genericCallback = function (out) {
        return function (data) {
          o.emit(out, data);
         // console.log("emitting", o, out, arguments);
        };
  };
  var n = msgs.length;
  var msg; 
  var tests = [];
  for (i =0; i<n; i += 1) {
    msg = msgs[i][0];
    e.on(msg, genericCallback(msg));
  }
};

//a null value will terminate the test for the term.

//inputs to client
var toServer = [  
  ['login', {username:'aUsername', nickname:'jack'}],   //send login credentials
  ['newRoom', ''], //send request for a new room, maybe a tab interface
  ['sendChat', ['a23q4rqfas','some chat here. And a bit of math \(\int_3^5 \sin \left(\frac{x}{3}\right) dx\) ']], //send chat lines
  ['sendGraph', ['a23q4rqfas', 'A(1,1);B(2,2);l=]AB[;C=1/2(A,B) nolabel;' ]], //send graph data
  ['sendLeave', ''], //send leave room
  ['getHistory', ''], //get history of user's sessions
  ['joinRoom', 'a23q4rqfas'], //join a room
  ['getRoomList', ''] //get list of available rooms
];

socket.on('login', function (data) {
    socket.emit('loadUser', data);
});

socket.on('newRoom', function () {
  socket.emit('roomId', 'asd');
});

emitOnSetup(gcd, socket, toServer);

var fromServer = [
  ['loadUser',{username:"jostylr", options:{chatHistory:"show10"}}], //receive login confirmed
  ['roomId', 'a23q4rqfas'], //receive graph room
  ['roomList', [['aq234', 'bUsername'], ['atged32', 'cUsername', 'dUsername']]], //get list of available rooms
  ['roomData', {
    roomId: 'aq234', 
    owner: 'aUsername',
    actions : [  //c for chat, g for graph
          //['aUsername', 'g', 'setup {axis:true}'],
          ['aUsername', 'c', 'Hello, everyone!'],
          ['aUsername', 'g', 'A(1,1);Bc(2,2);l=]A Bc[;'], 
          ['aUsername', 'c', "This is pretty cool, isn't it?"],
          ['bUsername', 'c', "Let's do this thing. I got fried chicken waiting."],
          ['bUsername', 'g', 'A(0,1);l=]A Bc[;C=1/2(A,Bc) nolabel;']

    ]
    }], //get data for a room
  ['receiveCast', ['a23q4rqfas', 'aUsername', 'c', 'Thanks for listening.'], ['aq234', 'aUsername', 'g', 'D(0,0);E(0,1);C(1,0);alpha=<(C,D,E)'] ]
   //receive chat (c) line or graph (g) construction
];

//client to outputs, graphs
emitOnSetup(socket, gcd, fromServer);



//test data
var socketTest = false;
if (socketTest) {
  gcd.emitDebug();
  (function (data) {
    var netTest = {emit : function(name, args) {
      console.log("Sending: "+name+' '+JSON.stringify(args));
      socket.emit("test", {send:name, args:args});
    }};
    var runTests = function (feed, whatToEmit) {
      var n = whatToEmit.length;
      var i, m, j; 
      var commandLine
      for (i=0; i<n; i +=1) {
        commandLine = whatToEmit[i];
        m = commandLine.length;
        for (j=1; j<m; j += 1){
          if (commandLine[j] === null) {console.log(commandLine[0]+' ended'); break;}
          feed.emit(commandLine[0], commandLine[j]);
          //console.log(i, j, JSON.stringify(commandLine[j]));
        }
      }
    };
    console.log("testing data sent to the server");
    runTests(gcd, toServer);
    console.log("testing data from server")
    runTests(netTest, fromServer);    
  }());
} 
});
