module.exports = function(RED) {
    function SequenceDetector(config) {
        RED.nodes.createNode(this,config);
        if(config.sequence){
            this.sequence = config.sequence.split("\n");
        }else{
            this.sequence = [];
        }
        this.watch = config.watch != undefined ? config.watch : "payload" ;
        this.timeout = config.timeout != undefined ? config.timeout : 2000 ;
        this.matchMessage = config.matchMessage != undefined ? config.matchMessage : "match" ;
        this.resetMessage = config.resetMessage != undefined ? config.resetMessage : "reset" ;
        this.timeoutMessage = config.timeoutMessage != undefined ? config.timeoutMessage : "timeout" ;
        this.indexCheck = 0;

        var node = this;
        setStatus(node,"grey");
        node.on('input', function(msg, send, done) {
            try{
                if(node.timeoutHandle){
                    clearTimeout(node.timeoutHandle);
                }
                send = send || function() { node.send.apply(node,arguments) } //For backwards compatibility with node-red 0.x
                var messageMatchesCurrentIndex = messageMatches(node.watch, msg, node.sequence[node.indexCheck]);
                var isLastIndex = node.indexCheck == node.sequence.length - 1;
                if(messageMatchesCurrentIndex){
                    if(isLastIndex){
                        node.indexCheck = 0;
                        node.lastMatch = new Date();
                        msg.payload = "match";
                        setStatus(node,"green");
                        send([msg, null]);
                    }else{
                        node.indexCheck = node.indexCheck+1;
                        setStatus(node,"blue");
                        node.timeoutHandle = setTimeout(function(){
                            node.indexCheck = 0;
                            msg.payload = "timeout";
                            setStatus(node,"yellow");
                            send([null, msg]);
                        }, 1000)
                        //swallows message
                    }
                }else{
                    node.indexCheck = 0;
                    msg.payload = "reset";
                    setStatus(node,"yellow");
                    send([null, msg]);
                }

                

                if (done) {
                    done();
                }
            }catch(err){
                if(done){
                    done(err);
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

    function messageMatches(watch, msg, matchValue){
        var payloadMatchesCurrentIndex = (msg.payload == matchValue)
        var topicMatchesCurrentIndex = (msg.topic == matchValue)
        if(watch == "payload")
            return payloadMatchesCurrentIndex;
        else if(watch == "topic")
            return topicMatchesCurrentIndex;
        else
            return payloadMatchesCurrentIndex || topicMatchesCurrentIndex;
    }
    RED.nodes.registerType("sequence-detector",SequenceDetector);
}