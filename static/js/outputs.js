/*globals 
	$, Parse, JXG, roomPieces, gcd, window, modifyGraph, MathJax, console
*/


$(function () {
	var creole = new Parse.Simple.Creole();
	
	
	
  JXG.Options.zoom.factor = 1.05;
  
  var rooms$ = $('#rooms');
  window.roomPieces = {};
  var username, nickname;

  gcd.on('loadUser', function(data) {
    $('#loginProcessing').addClass('hide'); 
    $('#menu').removeClass('hide');
    username = data.username;
    nickname = data.nickname;
    //console.log(username, nickname);
  });
  
  gcd.on('roomId', function (id) {
    gcd.emit('makeRoom', id, username);
  });
  
  gcd.on('makeRoom', function (id, owner) {
    roomPieces[id] = {
      roomWrap$ : $('<li class="roomWrap"></li>'),
      title$ : $('<h5 class="roomTitle">'+owner+'</h5>'),
      graph$ : $('<div id="graph'+id+'"" class="jxgbox" style="width: 65ex; height: 65ex;'+
      ' -moz-user-select: none; overflow: hidden; position: relative;"></div >'),  
      chatWin$ : $('<ol class="chatWin"/></ol>'),
      chatInp$ :  $('<textarea class="chatIn" rows=5></textarea>'),
      chatSend$ : $('<button class="send">Send Chat</button>'),
      chatWrap$ : $('<div class="chatWrapper"></div>'),
      exitRoom$ : $('<button class="exit">Exit Room</button>')
    };
    roomPieces[id].roomWrap$.      
      append(roomPieces[id].title$).
      append(roomPieces[id].graph$).
      append("<form>").
      append("<br/>Chat<br/>").
      append(roomPieces[id].chatWrap$).
      append(roomPieces[id].exitRoom$).
      append("</form>");
    roomPieces[id].chatWrap$.
    	append(roomPieces[id].chatInp$).
      append(roomPieces[id].chatSend$).
      append(roomPieces[id].chatWin$);
    $('#rooms').append(roomPieces[id].roomWrap$);
    roomPieces[id].brd = JXG.JSXGraph.initBoard('graph'+id,
    {   axis: true,
        grid: false,
        showNavigation:false,
        originX: 250,
        originY: 250,
        unitX: 50,
        unitY: 50,
        showCopyright:false
    });
    roomPieces[id].points = {};
    roomPieces[id].objects = {};
		roomPieces[id].modGraph = function (ind, el) {
	    modifyGraph(roomPieces[id].brd, $(el).text(), roomPieces[id].points, roomPieces[id].objects);
		};
    gcd.emit('loadedRoom', roomPieces[id].chatInp$, roomPieces[id].chatSend$, roomPieces[id].exitRoom$, id);
  });
  
	var safe = function (reg, sub, spanClass, repReg) {
		var count = 0;
		var pieces = [];
		var ret = {};
		ret.takeOut = function (text) {
			var str; 
			str = text.replace(reg, function (snippet) {
				count = pieces.length;
				pieces.push(snippet);
				return sub+count; 
			});
			return str;
		};
				
		ret.putIn = function (text) {
			var str = text.replace(repReg, function (ignore, digits) {
				return "<span class='"+spanClass+"'>"+digits+"</span>";
			});
			return str; 
		};
		
		ret.subIn = function (ind, el) {
			el = $(el); 
			el.text(pieces[el.text()]);
		}; 
		
		return ret;
	};
	
	//probably need to add other delimiters?
	var mathSafe = safe( /\\\(.*\\\)/g, "MATH", "math", /MATH(\d+)/g);
	var graphSafe = safe(/^(\!.*)$/gm, "GRAPH", "graph", /GRAPH(\d+)/g);


  gcd.on('addLine', function (id, username, code, text) {
    var userText$, names, j, m, constr;
    //could process text in some way, maybe creole wiki javascript parser
     userText$ = $('<span class="chatLine"></span>');
		//take out math before creole
		text = mathSafe.takeOut(text);
		text = graphSafe.takeOut(text);
		creole.parse(userText$[0], text);
		//replace math; better way possible, but why bother if this works?
		text = userText$.html();
		userText$.html(graphSafe.putIn(mathSafe.putIn(text)));
		userText$.find(".math").each(mathSafe.subIn);
		userText$.find(".graph").
			each(graphSafe.subIn).
			each(roomPieces[id].modGraph);					
    roomPieces[id].chatWin$.append($('<li><span class="username">'+username+': </span></li>').append(userText$));
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, userText$[0]]);
  });
  
  gcd.on('roomData', function (data) {
    var i;
    var id = data.roomId;
    gcd.emit('makeRoom', id, data.owner);
    var list = data.actions;
    var n = list.length;
    for (i = 0; i<n; i += 1) {
      gcd.emit('addLine', id, list[i][0], list[i][1], list[i][2]);
    }
  });

  gcd.on('receiveCast', function (data) {
      gcd.emit('addLine', data[0], data[1], data[2], data[3]);
    });

    
  gcd.on('sendChat', function (data) {
    gcd.emit('addLine', data[0], nickname, 'c', data[1] );
    console.log(username);
  });
  
  gcd.on('sendGraph', function (data) {
    gcd.emit('addLine', data[0], nickname, 'g', data[1] );
  });
  
  gcd.on('roomList', function (list) {
	  var i; 
    var n = list.length;
    var rl = $('#roomList');
    for ( i =0; i<n; i+= 1) {
      rl.append('<li id="join'+list[i][0]+'">'+list[i][1]+'</li>');  
    }
    //click behavior
  });
  
});


/*

document.getElementById('chat-area').scrollTop = document.getElementById('chat-area').scrollHeight;


'newLines', function(data) {
        console.log(data);
         var newText = $('<li>'+data.lines+'</li>');
         MathJax.Hub.Queue(["Typeset", MathJax.Hub,newText[0]]); 
         $('#stuff').append(newText);

  ['loadUser',{username:"jostylr", options:{chatHistory:"show10"}}], //receive login confirmed
  ['roomId', 'a23q4rqfas'], //receive graph room
  ['roomList', [['aq234', 'bUsername'], ['atged32', 'cUsername', 'dUsername']]], //get list of available rooms
  ['roomData', {
    roomId: 'aq234', 
    owner: 'aUsername',
    actions : [  //c for chat, g for graph
          //['aUsername', 'g', 'setup {axis:true}'],
          ['aUsername', 'c', 'Hello, everyone!'],
          ['aUsername', 'g', 'A(1,1);B(2,2);l=]AB[;'], 
          ['aUsername', 'c', "This is pretty cool, isn't it?"],
          ['bUsername', 'c', "Let's do this thing. I got fried chicken waiting."]
          ['bUsername', 'g', 'l=]AB[;C=1/2(A,B) nolabel;']

    ]
    }], //get data for a room
  ['receiveCast', ['a23q4rqfas', 'aUsername', 'c', 'Thanks for listening.'], ['aq234', 'aUsername', 'g', 'C(1,0);alpha=<(A,B,C);'] ]

*/

//add brand new graph

//add other's graph

//add chat text

//login confirmed
