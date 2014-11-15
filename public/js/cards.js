var cards = [];
for (var i = 0; i < 53; i++) {
  cards.push({
    type: i
  });
} 

var CardsBox = React.createClass({
  getInitialState: function() {
    return {data: cards};
  },
  refreshCards: function (cards) {
    console.log(cards);
    this.state.data = cards;
  },
  render: function() {
    return (
      <div className="cards-box">
        <h1>Your Hand</h1>
        <CardsList data={this.state.data} />
      </div>
    );
  }
});

var CardsList = React.createClass({
  render: function() {
    var cardNodes = this.props.data.map(function (card) {
      return (
        <Card value={card.type}>
        </Card>
      );
    });
    return (
      <div className="cards-list">
        {cardNodes}
      </div>
    );    
  }
});

function getCardFromIndex (index) {
  if (index < 52) {
    var index = parseInt(index);
    var suits = ['C', 'D', 'H', 'S'];
    var ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    var suit = index % 4;
    var rank = Math.floor(index/4);
    return ranks[rank] + suits[suit];
  } else {
    return 'facedown';
  }
}

var Card = React.createClass({
  render: function() {
    return (
      <img className="card" src={"img/" + getCardFromIndex(parseInt(this.props.value)) + ".png"}/>
    );
  }
});

React.render(
  <CardsBox data={cards}/>,
  document.getElementById('cards-container')
);
