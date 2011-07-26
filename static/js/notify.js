/**
* Small EventEmitter implementation borowed from MicroEvent.js
*
* MicroEvent.js: https://github.com/jeromeetienne/microevent.js
*/

var Emitter = function(){};
Emitter.prototype = {
    on: function(event, fct){
        this._events = this._events || {};
        this._events[event] = this._events[event] || [];
        this._events[event].push(fct);
    },
    removeListener: function(event, fct){
        this._events = this._events || {};
        if( event in this._events === false ) return;
        this._events[event].splice(this._events[event].indexOf(fct), 1);
    },
    emit: function(event /* , args... */){
        this._events = this._events || {};
        if( event in this._events === false ) return;
        for(var i = 0; i < this._events[event].length; i++){
            this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
        }
    },
    emitDebug: function emitDebug (msg) {
      var emit = this.emit;    
      emitDebug.emit = emitDebug.emit || emit;
      emitDebug.count = emitDebug.count+1 || 1; 
      this.emit = function () {
        try {
          console.log(JSON.stringify(Array.prototype.slice.call(arguments)));
        } catch (e) {
          console.log(arguments[0]);
        }

        emitDebug.emit.apply(this, arguments);
      };
      if (msg) {console.log("added debug. current debugs "+emitDebug.count)}
    },
    removeEmitDebug: function (msg) {
      try {
        if (this.emitDebug.count >1) {
          this.emitDebug.count -= 1;
        } else {
          this.emit = this.emitDebug.emit || emit;
          this.emitDebug.count =0;
        }
        if (msg) {console.log("removed debug. remaing debugs: "+this.emitDebug.count);}
      } catch (e) {
        console.log("emit debug removal failed", e);
      }
    } 
};

/**
* Enable will delegate all Emitter function in the destination object
*
* Emitter.enable(Foobar) will make Foobar able to act as an EventEmitter
* Use that on the constructor Foobar using new Foobar() to create object
*/
Emitter.enable = function(destObject){
    var props = ['on', 'removeListener', 'emit'];
    for(var i = 0; i < props.length; i ++){
        destObject.prototype[props[i]] = Emitter.prototype[props[i]];
    }
};

//grand central dispatch to communicate globally
gcd = new Emitter();

//testCode
gcdTest = false; 
if (gcdTest) {
  (function () {
    gcd.on("here", function () {
      console.log("here is sent", JSON.stringify(arguments));
    })
    gcd.emitDebug(true);
    gcd.emit("here", "foo", {hi:"bye"});
    gcd.emitDebug(true);
    gcd.emit("stackingEmits");
    gcd.removeEmitDebug(true);
    gcd.emit("here", "bar", {bye:"hi"});
    gcd.removeEmitDebug(true); 
    gcd.emit("here", "second");    
  })();
}
//endTestCode
