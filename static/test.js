

$(function () {
  test = true; 
  if (test) {
    gcd.emitDebug();
    $('#username').val('fred');
    $('#nickname').val('freddy');
    $('#submitLogin').click(); 
    //get new room and explore
    $('#newRoom').click();
  
    //join room
    $('#joinRoom').click(); 
    
}
});