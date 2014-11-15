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
    handleSubmit: function(event) {
        event.preventDefault();
        // Do something with the input here
        var commands = this.refs.commands.getDOMNode().value.trim();

        this.props.onCommandSubmit({commands: commands});
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
        return {data: ['123', '234']};
    },

    handleCommandSubmit: function(commands) {
        var data = this.state.data;
        data.push(commands);
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

