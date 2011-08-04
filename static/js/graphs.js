/*globals 
	$, Parse, JXG, roomPieces, gcd, window, modifyGraph, MathJax, console
*/


$(function () {

	//check whether a name exists, return new name if already taken or none present
	var checkName = function (name, objects) {
		if (name=== '') {
			name = "q"; //no names get q_i for name
		}
    if (name === 'k') {
			name = "kq";
    } 
		var count = 1;
		var temp = name;
    while (objects.hasOwnProperty(temp)) {
			temp = name+'_'+count; 
			count += 1; 
    }
		return temp;
	};
	
	var checkNumber = function (text) {
		return text.match(/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/)
	}
	
	//checking for names if strings, making numbers if that, and also dealing with subarrays
	//only one level of subarray is considered
	// parentify("5, A, B, [7,9]", {A:[4,3]})
	// [5, [4,3], "B", [7,9]]
	var parentify = function (parstr, objects) {
		var parents = parstr.split(/\s*,\s*/);
		var i, n=parents.length;
		var endarray = false;
		var current, curarray=[];
		//keeps the level of arrays
		var arrays = [];
		//the return being the parents array
		for (i=0; i<n; i += 1) {
			current = parents[i]; 
			console.log(current);
			if (current[0] === "[") { //start of subarray
				//store current array, make new one.
				arrays.unshift(curarray); 				
				curarray= [];
				//add it to the previous curarray
				arrays[0].push(curarray);
				current = current.slice(1);
			}
		
			if (current.slice(-1) === "]") {
				endarray = true;
				current=current.slice(0,-1);
			}
			if (checkNumber(current)) {
				curarray.push(parseFloat(current));
			} else if (objects.hasOwnProperty(current)) {
				curarray.push(objects[current]);
			} else {
				curarray.push(current);
			}
			if (endarray) {
				curarray = arrays.shift();
				endarray = false; 
			}
		}
		if (arrays.length !== 0) {throw "bad parse";}
		return curarray;
	};
	
	
	//turning into an object for attributes
	//attributify("to:5, hack:true, dude:jack, nums:5e2px, num:-5.3e3, rep:1, rep:.2")
	//gives: {"to":5,"hack":true,"dude":"jack","nums":"5e2px","num":-5300,"rep":0.2}
  var attributify = function (attstr) {
		var attributes = {};
		attstr.replace(/\s*([A-Za-z]\w*)\s*:*\s*([^,]+)\s*,*\s*/g, function (match, key, value) {
			//check value type. 
			//check for num by seeing if it converts to a num. 3.14px would be a problem
			if (checkNumber(value)) {
				value = parseFloat(value);
			}
			if (value ==="true") {value = true;}
			if (value ==="false") {value = false;}
			attributes[key] = value;
		});
		return attributes;
	};
	
	var makePoint = function (point, points, name ) {
    points[name] = {
      point:point, oldX:point.X(), oldY:point.Y()
    }; 
	};
	
  var construct = function (brd, text, points, objects) { 
    var nametype = text.match(/^\s*([A-Za-z]\w*)(\(|\=|\[|\:)/); 
 		var name;
    if (nametype === null) {
			//returns most likely name
      name = checkName('', objects); 
			if (text.match(/^\s*\(|\[|\:]/)) {
				text = text.replace(/^\s*/, name);
			} else {
				text = text.replace(/^\s*/, name+"=");
			}
    } else {
			name = checkName(nametype[1], objects);	
			if (name !== nametype[1]) {
				text = text.replace(/^\s*([A-Za-z]\w*)/, name);
			}
		}
    var constr = brd.construct(text);
    objects[name] = constr[name];
    if (text.match(/^\s*[A-Za-z]\w*\(/)) {
			makePoint(constr[name], points, name);
    }
  };

	var ownCommands = {
		lagrangePolynomial : function (brd, name, parents, attributes, objects, points) {
				var poly= brd.lagrangePolynomial(parents);
				attributes.name=name;
				objects[name] = brd.create('functiongraph', poly, attributes);
				attributes.name = name;
				//objects[name].setProperty(attributes);
		}, 
		lp : function (brd, name, parents, attributes, objects, points) {
			ownCommands.lagrangePolynomial(brd, name, parents, attributes, objects, points);
		}
	}
  
  var  command = function (brd, text, points, objects) {
    var pieces = text.match(/\!\s*(\w+)\s*(\w+)\s*\((.*)\)\s*(.*)\s*/ );
    console.log(pieces);
    var com = pieces[1];
		var name = pieces[2];
		//none of the below handles embedded commas at all
    var point, parents, attributes, arguments;
    switch (com) {
      case "u" :  // !u A(2,3)
        try {
          point = points[name];
					parents = parentify(pieces[3], objects);
					var one = parents[0];
					var two = parents[1];
          point.point.setPosition(JXG.COORDS_BY_USER, one, two);
          point.oldX = one;
          point.oldY = two; 
        } catch(e) {
          gcd.emit("error", args[0]+' does not exist', text);
        }
      break;
			case "r": //remove  !r A() //not undo friendly!
				try { 
					objects[name].remove();
					objects.delete(name);
					if (points.hasOwnProperty(name)) {points.delete(name);}
				} catch (e) {
					gcd.emit("error", 'removal issue', text, e );
				}
			break;
			case "m": //property modify !s A(key:value, key:value) //m for modify
				attributes = attributify(pieces[3]);
				try {
					objects[name].setPropety(attributes);
				} catch (e) {
					gcd.emit("error", "can't modify "+name, text, e);
				}
			break;
			case "a": //method on object  !m A(X) arg1, arg2 //a for action
			  arguments = parentify(pieces[4], objects);
				try {
					objects[name][pieces[3]].apply(objects[name], arguments);
				} catch (e) {
					gcd.emit("error", "can't modify "+name, text, e);
				}			
			break;
			case "b": //modifying board properties
				
			break;
      default : //!line c(A,B) visibility:none
         try {
					name = checkName(name,objects);
					parents = parentify(pieces[3], objects);
					attributes = attributify(pieces[4]);
					if (ownCommands.hasOwnProperty(com)) {
						ownCommands[com](brd, name, parents, attributes, objects, points);
					} else {
						attributes.name = name;
						objects[name] = brd.create(com, parents, attributes);
						if (com === "point") {}
					}
        } catch(e) {
          gcd.emit("error", 'problem with'+ com +'and args', text, e);
        }
    }
  };

  window.modifyGraph = function (brd, text, points, objects) {
    try {
      var lines = text.slice(1).split(/(;|\n)+/);
      if (lines) {
        var n = lines.length;
				var i;
        for ( i = 0; i<n; i+= 1) {
					var line = lines[i];
          if (line[0] === '!') {
            command(brd, line, points, objects);
          } else {
            construct (brd, line, points, objects);
          }
        }
        brd.update();
      } else {
        gcd.emit('error', "empty construction", text);
      }
    } catch (e) {
      gcd.emit("error", "bad construction", text, e);
    }
  }; 

  gcd.on('loadUser', function () {
    var call = function () {
      var point; 
			var id;
      for (id in roomPieces) {
        try {
          var points = roomPieces[id].points;
					var name; 
          for (name in points) {
              point = points[name];
              var x = point.point.X();
              var y = point.point.Y();
              var oldX = point.oldX;
              var oldY = point.oldY;
              if ((x !== oldX) || (y !== oldY)) {
                  point.oldX = x;
                  point.oldY = y;
                  gcd.emit("sendGraph", [id, '!!u '+name+'('+x+','+y+')']);
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
      window.setTimeout(function(){
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

