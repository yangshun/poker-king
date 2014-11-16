function HandCtrl ($scope, $attrs) {
  $scope.loaded = true;
  $scope.mode = false;

  function createCards (cards) {
    return _.map(cards, function (card) {
      return {
        selected: false,
        number: card
      };
    });
  }

  function processCommand (command, callback) {
    command = command.split(" ");
    if (!callback) {
      callback = function (res) {
        console.log(res);
      };
    }

    if (command[0] == "draw") {
      var numDraw = parseInt(command[1],10);
      UnaController.sendToServer("draw", {numDraw: numDraw}, callback);
    } else if (command[0] == "getMyHand") {
      
    } else if (command[0] == "distribute") {
      
    }
  }

  UnaController.sendToServer('distribute', {}, function (res) {

  });

  $scope.getCardFromIndex = function (index) {
    index = parseInt(index);
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

  $scope.startDiscard = function() {
    UnaController.register('room1', {name: 'deck', type: 'discard'}, function(res) {
      $scope.cards = createCards(res.cards);
      $scope.$apply();
      UnaController.onServerInput('discard', function(res) {
        $scope.mode = 'discard';
        console.log(res.payload.discardPile);
        $scope.cards = createCards(res.payload.discardPile);
        $scope.$apply();
      });
    });
  };

  $scope.startGame = function () {
    UnaController.register('room1', {name: 'Iambot', type: 'player'}, function(res) { 
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

  $scope.discardCards = function () {
    var cardsToDiscard = _.pluck(_.filter($scope.cards, function (card) {
      return card.selected;
    }), 'number');

    UnaController.sendToServer('discard', {
      cards: cardsToDiscard
    }, function (res) {

    });
  }

  if ($attrs.model == 'discard') $scope.startDiscard();
}
