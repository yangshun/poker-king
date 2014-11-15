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
    UnaController.sendToServer("getMyHand", {}, callback);
  } else if (command[0] == "discard") {
    UnaController.sendToServer("discard", {cards: command.slice(1)}, callback);
  } else if (command[0] == "distribute") {
    UnaController.sendToServer("distribute", {}, callback);
  }
}

var TextPokerForm = React.createClass({
  handleSubmit: function(event) {
    event.preventDefault();
        // Do something with the input here
        var command = this.refs.commands.getDOMNode().value.trim();
        processCommand(command);

        this.refs.commands.getDOMNode().value = '';
      },
      render: function() {
        return (
          <form onSubmit={this.handleSubmit}>
          <input type="text" className="form-control" ref="commands"/>
          </form>
          )
      }
    });

var TextPoker = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  handleCommandSubmit: function(state) {
    var data = this.state.data;
    data.push(state);
    this.setState({data: data});
  },
  render: function() {
    return (
      <div>
      <TextPokerForm onCommandSubmit={this.handleCommandSubmit}/>
      </div>
      )
  }
});

var StartGameButton = React.createClass({
  startGame: function () {
    UnaController.register('room1', {name: ''}, function(res) {
      console.log(res.state);
      UnaController.onServerInput("update", function (res) {
        console.log('update', res);
      });
    });
  },
  render: function () {
    return (
      <button className='btn btn-success' onClick={this.startGame}>Start Game</button>
      )
  }
});

var ResetDeckButton = React.createClass({
  resetDeck: function () {
    UnaController.sendToServer("resetDeck", {}, function (res) {
      if (res.success) {
        cardsBox.refreshCards([]);
      }
    });
  },
  render: function () {
    return (
      <button className='btn btn-warning' onClick={this.resetDeck}>Reset Deck</button>
    );
  }
});

var DrawCardsButton = React.createClass({
  drawAmount: function () {
    UnaController.sendToServer('draw', {numDraw: this.props.amount}, function (res) {
      cardsBox.refreshCards(res.hand);
    });
  },
  render: function () {
    return (
      <button type="button" className="btn btn-default" onClick={this.drawAmount}>{this.props.amount}</button>
    );
  }
});

var DrawCardsContainer = React.createClass({
  render: function () {
    var buttons = _.map(_.range(this.props.number), function (value) {
      return (
        <DrawCardsButton amount={value}></DrawCardsButton>
      );
    });
    return (
      <div className="btn-group" role="group">
        Draw cards: {buttons}
      </div>
    );
  }
})

React.render(
  React.createElement(TextPoker, null),
  document.getElementById('text_poker')
  );

React.render(
  React.createElement(StartGameButton, null),
  document.getElementById('button-start-game-container')
  );

React.render(
  React.createElement(ResetDeckButton, null),
  document.getElementById('button-reset-deck-container')
  );

React.render(
  <DrawCardsContainer number={5}/>,
  document.getElementById('button-draw-cards-container')
  );

