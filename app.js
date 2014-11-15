var path = require('path');
var una = require('una');
var routes = require('./routes');
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

app.get('/controller', routes.controller);


// Enable screenless
una.enableServerMode();

// Init state of each room here
una.server_mode.registerInitState({
  numDecks: 1,
  hands: {
    __drawPile: [],
    __discardPile: [],
    __communityPile: []
    // #playerid : [1,2,3,4]
  },
  connectedPlayers: []
});


function playerHasCards(state, playerId, cards) {
  for (var card in cards) {
    if (!state.hands[playerId].contains(card)) {
      return false;
    }
  }
  return true;
}


function moveCards(state, cards, fromPlayer, toPlayer) {
  if (!playerHasCards(state, fromPlayer, cards)) {
    return false;
  }

  state.hands[toPlayer] = state.hands[fromPlayer].filter(
    function (e) {
      return cards.contains(e); // Note: no ! on this
    });

  state.hands[fromPlayer] = state.hands[fromPlayer].filter(
    function (e) {
      return cards.contains(e); // Note: ! on this
    });
  return true;
}

// Resets the drawPile with numDecks deck of cards. Zeros all other hands
// Payload : {}
// Success : { success: true }
// Failure : { success: false }
una.server_mode.registerOnControllerInput('resetDeck',
  function(UnaServer, una_header, payload) {
    var state = UnaServer.getState();
    // Zero all hands
    for (var pile in state.hands) {
      state.hands[pile] = [];
    }

    // Reconstruct __drawPile
    for (var i=0; i<52; i++){
      for (j=0; j<state.numDecks; j++) {
        state.hands.__drawPile.push(i);
      }
    }

    function shuffle(o){
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i),
          x = o[--i], o[i] = o[j], o[j] = x);
      return o;};
    state.hands.__drawPile = shuffle(state.hands.__drawPile);

    UnaServer.sendToControllers('update', state);
    // return { success: true } TODO
  });


// Puts a card from the __drawPile into the receiving player's hand
// Payload : { numDraw: 1, playerId: 2 }
// Success : { success: true, hand: [1,2,4,6...] }
// Failure : { success: false, hand: [1,2,4,6...] }
una.server_mode.registerOnControllerInput('draw',
  function(UnaServer, una_header, payload) {
    if (!state.connectedPlayers.contains(payload.playerId)) {
      return { success: false,
               error: "Player "+payload.playerId+" is no longer connected" }

    }

    var state = UnaServer.getState();
    if (state.hands.__drawPile.length >= payload.numDraw) {
      cards = state.hands.__drawPile.slice(0, payload.numDraw);
      state.hands.__drawPile = state.hands.__drawPile.slice(payload.numDraw);
      state.hands[payload.playerId] = state.hands[payload.playerId].concat(cards);
    } else {
      UnaServer.sendToControllers('update', state);
      /* TODO
      return { success: false, hand: state.hands[payload.receiver],
               error: "DrawPile is empty" };
               */
    }

    UnaServer.sendToControllers('update', state);
    // return { success: true, hand: state.hands[payload.receiver] }; TODO
  });


// Takes the cards in the __drawPile and distributes to every player evenly
// if possible. Else the first t players will have 1 more card than the rest
// Payload : {}
// Success : { success: true }
// Failure : { success: false }
una.server_mode.registerOnControllerInput('distribute',
  function(UnaServer, una_header, payload) {
    var state = UnaServer.getState();
    var avg = state.hands.__drawPile.length;
    if (avg != Math.floor(avg)) {
      var high = Math.ceil(avg);
      var low = Math.floor(avg);
      var t = state.hands.__drawPile.length % state.connectedPlayers.length;

      for (var player in state.connectedPlayers) {
        if (t > 0) {
          state.hands[player] = state.hands.__drawPile.slice(0, high);
          state.hands.__drawPile = state.hands.__drawPile.slice(high);
        } else {
          // Sad players will less cards
          state.hands[player] = state.hands.__drawPile.slice(0, low);
          state.hands.__drawPile = state.hands.__drawPile.slice(low);
        }
        t--;
      }
    } else {
      for (var player in state.connectedPlayers) {
        state.hands[player] = state.hands.__drawPile.slice(0, avg);
        state.hands.__drawPile = state.hands.__drawPile.slice(avg);
      }
    }
    UnaServer.sendToControllers('update', state);
    // return { success: true }; TODO
  });


// Takes the cards selected by a player and puts them into the __discardPile
// Payload : { playerId: 1, cards: [4,5,3] }
// Success : { success: true, hand: [1,2,6...] }
// Failure : { success: false }
una.server_mode.registerOnControllerInput('discard',
  function(UnaServer, una_header, payload) {
    if (!state.connectedPlayers.contains(payload.playerId)) {
      UnaServer.sendToControllers('update', state);
      /* TODO
      return { success: false,
               error: "Player "+payload.playerId+" is no longer connected" }
               */
    }

    var state = UnaServer.getState();
    payload.cards = payload.cards.map(function (e) { return parseInt(e); });

    var result = moveCards(state, payload.cards, payload.playerId, "__discardPile");
    if (!result) {
      UnaServer.sendToControllers('update', state);
      /* TODO
      return { success: false,
               error: "Unable to move cards " + payload.cards }
               */
    }

    UnaServer.sendToControllers('update', state);
    // return { success: true, hand: state.hands[payload.playerId] } TODO
  });


// Retrieves the cards in the player's hand
// Payload : { playerId: 1 }
// Success : { success: true, hand: [1,2,6...] }
// Failure : { success: false }
una.server_mode.registerOnControllerInput('getMyHand',
  function(UnaServer, una_header, payload) {
    // TODO: Might need to parseInt on player ID
    if (!state.connectedPlayers.contains(payload.playerId)) {
      UnaServer.sendToControllers('update', state);
      // return { success: false } TODO
    } else {
      UnaServer.sendToControllers('update', state);
      // return { success: true, hand: state.hands[payload.playerId] }; TODO
    }
  });


// Puts the cards from the sending player's hand to the receiver's hand
// Payload : { senderId: 1, receiverId: 2, cards: [1,2] }
// Success : { success: true, hand: [6...] } Hand refers to sender hand
// Failure : { success: false }
una.server_mode.registerOnControllerInput('sendCardsToPlayer',
  function(UnaServer, una_header, payload) {
    if (!state.connectedPlayers.contains(payload.senderId)
        || !state.connectedPlayes.contains(payload.receiverId)) {
      UnaServer.sendToControllers('update', state);
      // return { success: false }; TODO
    }

    var result = moveCards(state, payload.cards, payload.senderId, payload.receiverId);
    if (!result) {
      UnaServer.sendToControllers('update', state);
      /* TODO
      return { success: false,
               error: "Unable to move cards " + payload.cards }
               */
    } else {
      UnaServer.sendToControllers('update', state);
      // return { success: true, hand: state.hands[payload.senderId] }; TODO
    }
  });


var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Una server listening on port ' + app.get('port'));
});

una.listen(server);
