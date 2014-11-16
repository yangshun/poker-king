function HandCtrl ($scope, $attrs) {
  $scope.loaded = true;
  $scope.mode = 'player';

  // http://stackoverflow.com/questions/7666516/fancy-name-generator-in-node-js
  function haiku(){
    var adjs = ["autumn", "hidden", "bitter", "misty", "silent", "empty", "dry",
    "dark", "summer", "icy", "delicate", "quiet", "white", "cool", "spring",
    "winter", "patient", "twilight", "dawn", "crimson", "wispy", "weathered",
    "blue", "billowing", "broken", "cold", "damp", "falling", "frosty", "green",
    "long", "late", "lingering", "bold", "little", "morning", "muddy", "old",
    "red", "rough", "still", "small", "sparkling", "throbbing", "shy",
    "wandering", "withered", "wild", "black", "young", "holy", "solitary",
    "fragrant", "aged", "snowy", "proud", "floral", "restless", "divine",
    "polished", "ancient", "purple", "lively", "nameless"]
  
    , nouns = ["waterfall", "river", "breeze", "moon", "rain", "wind", "sea",
    "morning", "snow", "lake", "sunset", "pine", "shadow", "leaf", "dawn",
    "glitter", "forest", "hill", "cloud", "meadow", "sun", "glade", "bird",
    "brook", "butterfly", "bush", "dew", "dust", "field", "fire", "flower",
    "firefly", "feather", "grass", "haze", "mountain", "night", "pond",
    "darkness", "snowflake", "silence", "sound", "sky", "shape", "surf",
    "thunder", "violet", "water", "wildflower", "wave", "water", "resonance",
    "sun", "wood", "dream", "cherry", "tree", "fog", "frost", "voice", "paper",
    "frog", "smoke", "star"];
  
    return adjs[Math.floor(Math.random()*(adjs.length-1))]+"_"+nouns[Math.floor(Math.random()*(nouns.length-1))];
  }

  function createCards (cards, discard) {
    var i = 0;
    return _.map(cards, function (card) {
      var style = 'left: ' + i * 30 + 'px';
      if (discard) {
        style += '; z-index: ' + (100 - i) + ';';
      }
      console.log(style);
      i++;
      return {
        selected: false,
        number: card,
        style: style
      };
      
    });
  }

  UnaController.sendToServer('distribute', {}, function (res) {

  });

  $scope.countSelected = function () {
    var l = _.filter($scope.cards, function (card) {
      return card.selected;
    }).length;
    return l;
  };

  $scope.getCardFromIndex = function (card) {
    if (card.facedown) {
      return 'facedown';
    }
    index = parseInt(card.number);
    if (index < 52) {
      var suits = ['C', 'D', 'H', 'S'];
      var ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      var suit = index % 4;
      var rank = Math.floor(index/4);
      return ranks[rank] + suits[suit];
    } else {
      return 'facedown';
    }
  };

  $scope.cards = createCards([]);

  $scope.players = [];
  $scope.startDiscard = function() {
    UnaController.register('room1', {name: 'deck', type: 'discard'}, function(res) {
      $scope.cards = createCards(res.cards);
      $scope.$apply();

      UnaController.onServerInput('update', function(res) {
        $scope.players = res.payload.connectedPlayers.map(function(playerId) {
            return {id: playerId, name: res.payload.playerNames[playerId], cards: res.payload.hands[playerId]};
        });
        $scope.$apply();
      });

      UnaController.onServerInput('discard', function(res) {
        $scope.mode = 'discard';
        $scope.cards = createCards(res.payload.discardPile, true);
        var newCards = res.payload.cards;
        _.each($scope.cards, function (card) {
          if ($.inArray(card.number, newCards) > -1) {
            card.facedown = false;
          } else {
            card.facedown = true;
          }
        });
        $scope.$apply();
      });
    });
  };

  $scope.startGame = function () {
    UnaController.register('room1', {name: haiku(), type: 'player'}, function(res) { 
      $scope.mode = 'player';
      $scope.$apply();
      UnaController.onServerInput('update', function (res) {
                UnaController.sendToServer('getMyHand', {}, function (res) {
          if (res.success) {
            $scope.cards = createCards(res.hand);
            $scope.$apply();
          }
        });
      });
    });
  };

  $scope.resetDeck = function () {
    UnaController.sendToServer('resetDeck', {}, function (res) {
    });
  };

  $scope.drawCards = function (amt) {
    UnaController.sendToServer('draw', {numDraw: amt}, function (res) {
    });
  };

  $scope.distributeCards = function (amt) {
    UnaController.sendToServer('distribute', {numDraw: amt}, function (res) {
    });
  }

  $scope.distributeEvenly = function (amt) {
    UnaController.sendToServer('distributeEvenly', {}, function (res) {
    });
  }

  $scope.count = function() {
    UnaController.sendToServer('count', {}, function (res) {
      console.log('count', res);
    });
  }

  $scope.discardCards = function () {
    var cardsToDiscard = _.pluck(_.filter($scope.cards, function (card) {
      return card.selected;
    }), 'number');

    UnaController.sendToServer('discard', {
      cards: cardsToDiscard
    }, function (res) {

    });
  }

  if ($attrs.model == 'discard') {$scope.startDiscard();}
  else {$scope.startGame();}
}
