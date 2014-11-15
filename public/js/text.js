var TextPokerForm = React.createClass({
    processCommand: function(command) {
        command = command.split(" ");
        var callback = function(res) {
            console.log(res);
        };

        if (command[0] == "start") {
            var that = this;
            UnaController.register('room1', {name: ''}, function(res) {
                console.log(res.state);
                UnaController.onServerInput("update", callback);
            });
        } else if (command[0] == "resetDeck") {
            UnaController.sendToServer("resetDeck", {}, callback);
        } else if (command[0] == "draw") {
            UnaController.sendToServer("draw", parseInt(command[1], 10));
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

