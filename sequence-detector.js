module.exports = function(RED) {
    function SequenceDetector(config) {
        RED.nodes.createNode(this,config);
        if(config.sequence){
            this.sequence = config.sequence.split("\n");
        }else{
            config.sequence = [];
        }
        this.watch = config.watch != undefined ? config.watch : "payload" ;
        this.indexCheck = 0;
        var node = this;
        setStatus(node,"grey");
        node.on('input', function(msg, send, done) {
            try{
                send = send || function() { node.send.apply(node,arguments) } //For backwards compatibility with node-red 0.x
                var messageMatchesCurrentIndex = messageMatches(this.watch, msg, this.sequence[this.indexCheck]);
                var isLastIndex = this.indexCheck == this.sequence.length - 1;
                if(messageMatchesCurrentIndex){
                    if(isLastIndex){
                        this.indexCheck = 0;
                        node.lastMatch = new Date();
                        msg.payload = "match";
                        setStatus(this,"green");
                        send([msg, null]);
                    }else{
                        this.indexCheck = this.indexCheck+1;
                        setStatus(this,"blue");
                        //swallows message
                    }
                }else{
                    this.indexCheck = 0;
                    msg.payload = "reset";
                    setStatus(this,"yellow");
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