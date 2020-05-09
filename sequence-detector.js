var _ = require('lodash');

module.exports = function(RED) {
    function SequenceDetector(config) {
        RED.nodes.createNode(this,config);
        this.sequence = [];
        this.negativeSequence = [];
        this.history = []

        if(config.sequence)
        {
            this.sequence = config.sequence.split("\n");
        }

        if(config.negativeSequence)
        {
            this.negativeSequence = config.negativeSequence.split("\n");
        }
        this.totalLength = this.sequence.length + this.negativeSequence.length;

        var defaultMatchMessage = { payload: "match" };
        var defaultResetMessage = { payload: "reset" };
        var defaultTimeoutMessage = { payload: "timeout" };

        this.watch = config.watch ? config.watch : "payload" ;
        this.timeout = config.timeout ? config.timeout : 2000 ;
        this.matchMessage = config.matchMessage ? toJson(config.matchMessage, defaultMatchMessage) : defaultMatchMessage;
        this.resetMessage = config.resetMessage ? toJson(config.resetMessage, defaultResetMessage) : defaultResetMessage;
        this.timeoutMessage = config.timeoutMessage ? toJson(config.timeoutMessage, defaultTimeoutMessage) : defaultTimeoutMessage;
        this.indexCheck = 0;

        var node = this;
        setStatus(node,"grey");

        node.reset = (color) => {
            node.indexCheck = 0;
            node.history = [];
            setStatus(node,color);
        };

        node.clearTimeout = () => {
            if(node.timeoutHandle){
                clearTimeout(node.timeoutHandle);
            }
        };

        node.on('input', (msg, send, done) => {
            try{
                send = send || function() { node.send.apply(node,arguments) } //For backwards compatibility with node-red 0.x
                node.clearTimeout();

                // save history for comparing to later
                node.history.push(msg[node.watch]);
                if(node.history.length > node.totalLength){
                    //trim to max negative squence and sequence size
                    node.history = node.history.splice(1);
                }

                var match = msg[node.watch] == node.sequence[node.indexCheck];
                if( match ){
                    //Sequence matched
                    var isLastIndex = node.indexCheck == node.sequence.length - 1;
                    if(isLastIndex){
                        var reset = false;
                        //check if negative sequence was matched
                        if ( node.negativeSequence.length && node.history.length == node.totalLength )
                        {
                            var start = 0;
                            var end = node.negativeSequence.length;
                            var negative = node.history.slice(start, end);
                            reset = _.isEqual(negative, node.negativeSequence);
                        }

                        if ( reset )
                        {
                            node.reset("yellow");
                            send([null, node.resetMessage]);
                        }
                        else
                        {
                            node.lastMatch = new Date();
                            node.reset("green");
                            send([node.matchMessage, null]);
                        }
                    }else{
                        //Next match
                        node.indexCheck = node.indexCheck+1;
                        setStatus(node,"blue");
                        node.timeoutHandle = setTimeout(function(){
                            node.reset("yellow");
                            send([null, node.timeoutMessage]);
                        }, node.timeout)
                        //swallows message
                    }
                }else{
                    // Reset
                    if(node.indexCheck != 0){
                        node.reset("yellow");
                        send([null, node.resetMessage]);
                    }
                    //otherwise swallow message
                }

                if (node.done) {
                    node.done();
                }
            }catch(err){
                if(done){
                    node.done(err);
                }
                else
                    node.error(err, msg)
            }
        });
    }

    function setStatus(node,fill){
        node.status({fill:fill,shape:"dot",text: getStatusString(node)});
    }

    function getStatusString(node){
        if(node.sequence){
            text = "Match:" +node.indexCheck + "/" + node.sequence.length;
            if(node.lastMatch){
                text = text + " Last Match: " + getPrettyDate(node.lastMatch);
            }
            return text;
        }
        else
            return "No sequence set";
    }

    function getPrettyDate(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour12: false,
            hour: 'numeric',
            minute: 'numeric'
        });
    }

    function toJson(json, defaultJson) {
        if(typeof(json) == 'object')
        {
            return json;
        }
        else if(typeof(json) == 'string' && json.length)
        {
            return JSON.parse(json);
        }

        return defaultJson;
    }
    RED.nodes.registerType("sequence-detector",SequenceDetector);
}
