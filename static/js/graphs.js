$(function () {

  var construct = function (brd, text, points, objects) {
    var nametype = text.match(/^\s*([A-Za-z]\w*)(\(|\=|\[|\:)/); 
    if (nametype === null) {
      gcd.emit("error", "no name", text);
      return;
    }
    name = nametype[1];
    if (name === 'k') {
      gcd.emit("error", 'k is an invalid name', text);
      return;
    } 
    if (objects[name]) {
      gcd.emit("error", name+" already defined", text);
      return;
    }
    var constr = brd.construct(text);
    objects[name] = constr[name];
    if (nametype[2] === '(') {
      var point = constr[name];
      points[name] = {
        point:point, oldX:point.X(), oldY:point.Y()
      };
    }
  };
  
  var  command = function (brd, text, points, objects) {
    var pieces = text.match(/\!\s*(\w+)\s*\((.*)\)/ );
    console.log(pieces);
    var com = pieces[1];
    var args = pieces[2].split(/\s*,\s*/);
    console.log(args);
    var point;
    switch (com) {
      case "update" :  //!update(A,2,3)
        try {
          point = points[args[0]];
          point.point.setPosition(JXG.COORDS_BY_USER, args[1]*1, args[2]*1);
          point.oldX = args[1]*1;
          point.oldY = args[2]*1; 
        } catch(e) {
          gcd.emit("error", args.name+' does not exist', text);
        }
      break;
      default :
        $.noop(); 
    }
  };

  modifyGraph = function (brd, text, points, objects) {
    try {
      var lines = text.split(/(;|\n)+/);
      if (lines) {
        var n = lines.length;
        for (var i = 0; i<n; i+= 1) {
          if (lines[i][0] === '!') {
            command(brd, text, points, objects)
          } else {
            construct (brd, text, points, objects);
          }
        }
        brd.update();
      } else {
        gcd.emit('error', "empty construction", text);
      }
    } catch (e) {
      gcd.emit("error", "bad construction", text, e)
    }
  }; 

  gcd.on('loadUser', function () {
    var call = function () {
      var point; 

      for (var id in roomPieces) {
        try {
          var points = roomPieces[id].points;
          for (var name in points) {
              point = points[name];
              var x = point.point.X();
              var y = point.point.Y();
              var oldX = point.oldX;
              var oldY = point.oldY;
              if ((x !== oldX) || (y !== oldY)) {
                  point.oldX = x;
                  point.oldY = y;
                  gcd.emit("sendGraph", [id, '!update('+name+','+x+','+y+')']);
              }
          }
        } catch (e) {
          //console.log("error", e);
        }
      }
    }; 
  
    var loopContinue = true;
    var loopTime = 250;
    var loop = function loop(){
      setTimeout(function(){
         call();
         // recurse
         if (loopContinue) {
           loop();
         }
       }, loopTime);
     
     };
     
     loop();
    
  });

});



//given a construction, implement it

//check for changes: points, graph parameters (shifting, zoom by mouse)

//reset graph

