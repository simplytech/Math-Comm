
$(function () {
	var creole = new Parse.Simple.Creole();
	
	
	
  JXG.Options.zoom.factor = 1.05;
  
  var rooms$ = $('#rooms');
  roomPieces = {};
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
  })
  
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
      append(roomPieces[id].chatWin$).
      append(roomPieces[id].chatInp$).
      append(roomPieces[id].chatSend$);
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
    gcd.emit('loadedRoom', roomPieces[id].chatInp$, roomPieces[id].chatSend$, roomPieces[id].exitRoom$, id);
  })
  
	mathSafe = function () {
		var count = 0;
		var mathPieces = [];
		//probably need to add other delimiters?
		var mathReg = /\\\(.*\\\)/g;
		var ret = {}
		ret.takeMathOut = function (text) {
			var str; 
			str = text.replace(mathReg, function (math) {
				count = mathPieces.length;
				mathPieces.push(math);
				return "MATH"+count; 
			});
			return str;
		};
		
		ret.putMathIn = function (text) {
			var str = text.replace(/MATH(\d+)/, function (ignore, digits) {
				return "<span class='math'>"+digits+"</span>";
			});
			return str; 
		};
		
		ret.subMathIn = function (ind, el) {
			el = $(el); 
			el.text(mathPieces[el.text()*1.0]);
		} 
		
		return ret;
	}(); 

  gcd.on('addLine', function (id, username, code, text) {
    var userText, names, j, m, constr;
    switch (code) {
        case 'c':
          //could process text in some way, maybe creole wiki javascript parser
          userText$ = $('<span class="chatLine"></span>');
					//take out math before creole
					text = mathSafe.takeMathOut(text); 
					creole.parse(userText$[0], text);
					//replace math; better way possible, but why bother if this works?
					text = userText$.html();
					console.log(text);
					userText$.html(mathSafe.putMathIn(text));
					console.log(text);
					console.log(userText$, userText$.find(".math"));
					userText$.find(".math").each(mathSafe.subMathIn);
          MathJax.Hub.Queue(["Typeset", MathJax.Hub, userText$[0]]);
          roomPieces[id].chatWin$.append($('<li><span class="username">'+username+': </span></li>').append(userText$));
        break;
        case 'g':
          modifyGraph(roomPieces[id].brd, text, roomPieces[id].points, roomPieces[id].objects);
        break;
        case 'u' :
          switch (text) {
            case "added" :
            break;
            case "removed" :
            break;
            case "owner" :
            break;
          }
        break;
        default:
          console.log('Error: ' + text);
        break;        
      }
  });
  
  gcd.on('roomData', function (data) {
    var id = data.roomId;
    gcd.emit('makeRoom', id, data.owner);
    var list = data.actions;
    var n = list.length;
    for (var i = 0; i<n; i += 1) {
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
    var n = list.length;
    var rl = $('#roomList');
    for (var i =0; i<n; i+= 1) {
      rl.append('<li id="join'+list[i][0]+'">'+list[i][1]+'</li>');  
    }
    //click behavior
  })
  
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
