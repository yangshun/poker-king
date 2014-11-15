var path = require('path');
var una = require('una');
var express = una.express;
var app = una.app;
var http = require('http');

// App setup
app.set('port', process.env.PORT || 3216);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


// Enable screenless
una.enableServerMode();

// Init state of each room here
una.server_mode.registerInitState();

/*
una.server_mode.registerOnControllerInput('game', function(UnaServer, una_header, payload) {
    una_header.user_data.count++;
    var state = UnaServer.getState();
    state[payload]++;
    UnaServer.sendToScreens('game', payload);
});

una.server_mode.registerOnScreenInput('reset', function(UnaServer, una_header, payload) {
  if (payload == 'yoloyolo') {
    UnaServer.setState({apple: 0, android: 0});
    UnaServer.sendToScreens('reset');
  }
});
*/

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Una server listening on port ' + app.get('port'));
});
una.listen(server);
