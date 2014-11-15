var cards = [
  { type: 1 },
  { type: 2 },
  { type: 3 }
];

var CardsBox = React.createClass({
  getInitialState: function() {
    return {data: cards};
  },
  loadCommentsFromServer: function () {
    // $.ajax({
    //   url: this.props.url,
    //   dataType: 'json',
    //   success: function(data) {
    //     this.setState({data: data});
    //   }.bind(this),
    //   error: function(xhr, status, err) {
    //     console.error(this.props.url, status, err.toString());
    //   }.bind(this)
    // });
  },
  handleCommentSubmit: function(comment) {
    // $.ajax({
    //   url: this.props.url,
    //   dataType: 'json',
    //   type: 'POST',
    //   data: comment,
    //   success: function(data) {
    //     this.setState({data: data});
    //   }.bind(this),
    //   error: function(xhr, status, err) {
    //     console.error(this.props.url, status, err.toString());
    //   }.bind(this)
    // });
  },
  componentDidMount: function() {
    // this.loadCommentsFromServer();
    // setInterval(this.loadCommentsFromServer, this.props.pollInterval);
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
        <Card class={"card-"+card.type}>
          {card.type}
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

var Card = React.createClass({
  render: function() {
    return (
      <div className={this.props.class}>
      </div>
    );
  }
});

React.render(
  <CardsBox data={cards}/>,
  document.getElementById('cards-container')
);
