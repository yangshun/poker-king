var path = require('path');
var una = require('una');
var express = una.express;
var app = una.app;
var http = require('http');
var _ = require('lodash');

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

//app.get('/controller', routes.controller);

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
    connectedPlayers: [],
    playerNames : {}
});

function playerHasCards(state, playerId, cards) {
    var found = true;
    cards.forEach(function(card) {
        if (state.hands[playerId].indexOf(card) === -1) {
            found = false;
        }
    });
    return found;
}


function moveCards(state, cards, fromPlayer, toPlayer) {
    if (!playerHasCards(state, fromPlayer, cards)) {
        return false;
    }

    state.hands[toPlayer] = _.extend(state.hands[toPlayer], cards);

    state.hands[fromPlayer] = state.hands[fromPlayer].filter(
            function (e) {
                return cards.indexOf(e) === -1; // Note: ! on this
            });
    return true;
}


una.server_mode.registerOnControllerConnection(function (UnaServer, socket) {
    console.log("Someone connected", socket);
    var state = UnaServer.getState();
    if (socket.user_data.type == 'player') {
        console.log('player');
        state.hands[socket.id] = [];
        state.connectedPlayers.push(socket.id);
        state.playerNames[socket.id] = socket.user_data.name;
    } else if (socket.user_data.type == 'discard') {
        UnaServer.sendToControllers('discard', {
          cards: [],
          discardPile: state.hands.__discardPile,
          playerId: "",
          playerName: ""
        });
    }
});

una.server_mode.registerOnControllerDisconnection(function (UnaServer, socket) {
    console.log("Someone disconnected", socket);
    var state = UnaServer.getState();
    if (state.hands[socket.id]) {
        moveCards(state, state.hands[socket.id], socket.id, "__discardPile");
    }
    delete state.hands[socket.id];
    state.connectedPlayers.splice(state.connectedPlayers.indexOf(socket.id), 1);
});

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
            return { success: true }
        });


// Puts a card from the __drawPile into the receiving player's hand
// Payload : { numDraw: 1 }
// Success : { success: true, hand: [1,2,4,6...] }
// Failure : { success: false, hand: [1,2,4,6...] }
una.server_mode.registerOnControllerInput('draw',
        function(UnaServer, una_header, payload) {
            var state = UnaServer.getState();
            if (state.connectedPlayers.indexOf(una_header.id) === -1) {
                return { success: false,
                    error: "Player "+una_header.id+" is no longer connected" }

            }

            if (state.hands.__drawPile.length >= payload.numDraw) {
                cards = state.hands.__drawPile.slice(0, payload.numDraw);
                state.hands.__drawPile = state.hands.__drawPile.slice(payload.numDraw);
                state.hands[una_header.id] = state.hands[una_header.id].concat(cards);
            } else {
                return { success: false, hand: state.hands[una_header.id],
                    error: "DrawPile is has not enough cards" };
            }

            UnaServer.sendToControllers('update', state);
            return { success: true, hand: state.hands[una_header.id] };
        });


// Takes the cards in the __drawPile and distributes to every player evenly
// #numDraw cards. Else the first t players will have 1 more card than the rest
// Payload : { numDraw : 3 }
// Success : { success: true }
// Failure : { success: false }
una.server_mode.registerOnControllerInput('distribute',
        function(UnaServer, una_header, payload) {
            var state = UnaServer.getState();
            if (state.hands.__drawPile.length
                  < payload.numDraw * state.connectedPlayers.length) {
              return { success: false,
                       error: "NumDraw is too big to distribute" };
            }

            for (var i=0;i<state.connectedPlayers.length;i++) {
                var player = state.connectedPlayers[i];
                state.hands[player] = state.hands.__drawPile.slice(0, payload.numDraw);
                state.hands.__drawPile = state.hands.__drawPile.slice(payload.numDraw);
            }
            UnaServer.sendToControllers('update', state);
            return { success: true };
        });


// Takes the cards selected by a player and puts them into the __discardPile
// Payload : { cards: [4,5,3] }
// Success : { success: true, hand: [1,2,6...] }
//           -> 'update' broadcast
//           -> 'discard' broadcast
// Failure : { success: false }
una.server_mode.registerOnControllerInput('discard',
        function(UnaServer, una_header, payload) {
            var state = UnaServer.getState();
            if (state.connectedPlayers.indexOf(una_header.id) === -1) {
                return { success: false,
                    error: "Player "+una_header.id+" is no longer connected" }
            }

            payload.cards = payload.cards.map(function (e) { return parseInt(e, 10); });

            var result = moveCards(state, payload.cards, una_header.id, "__discardPile");
            if (!result) {
                return { success: false,
                    error: "Unable to move cards " + payload.cards }
            }

            UnaServer.sendToControllers('update', state);
            UnaServer.sendToControllers('discard', {
              cards: payload.cards,
              discardPile: state.hands.__discardPile,
              playerId: una_header.id,
              playerName: una_header.user_data.name
            });
            return { success: true, hand: state.hands[una_header.id] }
        });


// Retrieves the cards in the player's hand
// Payload : { }
// Success : { success: true, hand: [1,2,6...] }
// Failure : { success: false }
una.server_mode.registerOnControllerInput('getMyHand',
        function(UnaServer, una_header, payload) {
            var state = UnaServer.getState();
            // TODO: Might need to parseInt on player ID
            if (state.connectedPlayers.indexOf(una_header.id) === -1) {
                return { success: false }
            } else {
                return { success: true, hand: state.hands[una_header.id] };
            }
        });


// Puts the cards from the sending player's hand to the receiver's hand
// Payload : { senderId: 1, receiverId: 2, cards: [1,2] }
// Success : { success: true, hand: [6...] } Hand refers to sender hand
// Failure : { success: false }
// TODO : DOES NOT WORK!
una.server_mode.registerOnControllerInput('sendCardsToPlayer',
        function(UnaServer, una_header, payload) {
            var state = UnaServer.getState();
            if (state.connectedPlayers.indexOf(payload.senderId) === -1
                || state.connectedPlayes.indexOf(payload.receiverId) === -1) {
                    // UnaServer.sendToControllers('update', state);
                    return { success: false };
                }

            var result = moveCards(state, payload.cards, payload.senderId, payload.receiverId);
            if (!result) {
                //UnaServer.sendToControllers('update', state);
                return { success: false,
                    error: "Unable to move cards " + payload.cards }
            } else {
                UnaServer.sendToControllers('update', state);
                return { success: true, hand: state.hands[payload.senderId] };
            }
        });


var server = http.createServer(app).listen(app.get('port'), function(){
    console.log('Una server listening on port ' + app.get('port'));
});

una.listen(server);
