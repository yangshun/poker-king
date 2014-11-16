function HandCtrl ($scope, $attrs) {
  $scope.loaded = true;
  $scope.mode = 'player';

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

  $scope.startDiscard = function() {
    UnaController.register('room1', {name: 'deck', type: 'discard'}, function(res) {
      $scope.cards = createCards(res.cards);
      $scope.$apply();
      UnaController.onServerInput('discard', function(res) {
        $scope.mode = 'discard';
        console.log(res.payload.discardPile);
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
