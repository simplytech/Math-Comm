/*
  ['newRoom', ''], //send request for a new room, maybe a tab interface
  ['sendChat', 'some chat here. And a bit of math \(\int_3^5 \sin \left(\frac{x}{3}\right) dx\) '], //send chat lines
  ['sendGraph', 'A(1,1);B(2,2);l=]AB[;C=1/2(A,B) nolabel;' ], //send graph data
  ['sendLeave', ''] //send leave room
*/

/*
    <li id="newRoom">Start a new room</li>
    <li id="getHistory">Get history</li>
    <li id="joinRoom">Join a room:
      <ol id="roomList">
      </ol>
    </li>
*/


//gcd.emitDebug(); 

$(function () {
  //login: {username:'aUsername'}
  
  $("form").live('submit', function () {
    return false; 
  });
  
  $("#username, #nickname").keyup(function () {
    if (event.keyCode == 13) {
      event.preventDefault();
      $("#submitLogin").click();
      return false; 
    }
  })
  
  

  //gcd.emit("loadedRoom", $("#chat"), $('#graph'));
  
  $("#submitLogin").click(function () {
       gcd.emit("login", {username: $("#username").val(), nickname: ($("#nickname").val() || '') });
       $('#login').addClass("hide");
       $('#loginProcessing').removeClass("hide");
  });

  $("#newRoom").click(function () {
    gcd.emit('newRoom', '');
  });
  
  $("#getHistory").click(function () {
    gcd.emit('getHistory', '');
  })
   
  $("#joinRoom").one('click', function () {
    gcd.emit('getRoomList', '');
    $("#roomList").click(function (e) {
      var target = $(e.originalTarget || e.srcElement);
      if (target.is("li")) {
        gcd.emit('joinRoom', target.attr('id').slice(4) )
      }
     })
   })
      
    
   
     //know if shift is being held down.
  var shift = false;
  
  $(document).keydown(function (event) {
    if (event.keyCode == 16) {
      shift = true;
    } 
  }).keyup(function (event) {
    if (event.keyCode == 16) {
      shift = false;
    }
  });

  
  //this attaches the appropriate event handlers on new chatbox and graphbox
  gcd.on("loadedRoom", function (chatbox$, chatsend$, exitRoom$, roomId) {
		sendChat = function () {
			gcd.emit('sendChat', [roomId, chatbox$.val()]);			
			chatbox$.val('');
		};
    chatbox$.keyup(function (event) {
      if (event.keyCode == 13 ) {
        if (shift) {
					sendChat();
        }
      }
    });
    exitRoom$.click(function () {
      gcd.emit('leaveRoom', roomId);
    });
		chatsend$.click(function () {
			sendChat(); 
		});
  });
  
   
});


