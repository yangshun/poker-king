var CardsBox = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  refreshCards: function (cards) {
    console.log(cards);
    this.setState({data: _.sortBy(cards)});
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
        <Card value={card}>
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
}

var Card = React.createClass({
  render: function() {
    return (
      <img className="card" src={"img/" + getCardFromIndex(parseInt(this.props.value)) + ".png"}/>
    );
  }
});

var cardsBox = React.render(<CardsBox/>, document.getElementById('cards-container'));
