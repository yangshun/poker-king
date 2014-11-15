var TextPokerState = React.createClass({
    render: function() {
        return (
            <td>
                {this.props.children}
            </td>
        )
    }
});

var TextPokerStateList = React.createClass({
    render: function() {
        var list = this.props.data.map(function(state) {
            return (
            <tr>
            <TextPokerState>
                {state}
            </TextPokerState>
            </tr>
            );
        });
        return (
            <table>
            {list}
            </table>
        )
    }
});

var TextPokerForm = React.createClass({
    processCommand: function(command) {
        if (command == "start") {
            var that = this;
            UnaController.register('room1', {name: ''}, function(res) {
                //that.props.onCommandSubmit(JSON.stringify(res.state));
                console.log(res.state);
                UnaController.onServerInput("update", function(res) {
                    console.log(res.payload);
                    console.log(res);
                    //that.props.onCommandSubmit(JSON.stringify(res.payload));
                });
            });
        } else if (command == "resetDeck") {
            UnaController.sendToServer("resetDeck", {}, function(res) {
              console.log("ResetDeck res" , res);
            });
        }


    },

    handleSubmit: function(event) {
        event.preventDefault();
        // Do something with the input here
        var command = this.refs.commands.getDOMNode().value.trim();
        this.processCommand(command);

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
                <TextPokerStateList data={this.state.data} />
                <TextPokerForm onCommandSubmit={this.handleCommandSubmit}/>
            </div>
        )
    }
});

React.render(
    React.createElement(TextPoker, null),
    document.getElementById('text_poker')
);

