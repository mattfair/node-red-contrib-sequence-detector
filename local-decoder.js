module.exports = function(RED) {
    function LocalDecoder(config) {
        RED.nodes.createNode(this,config);
        this.sequence = config.sequence;
        this.indexCheck = 0;
        var node = this;
        node.on('input', function(msg) {
            var messageMatchesCurrentIndex = (msg.payload == this.sequence[this.indexCheck])
            var isLastIndex = this.indexCheck == this.sequence.length - 1;
            if(messageMatchesCurrentIndex){
                if(isLastIndex){
                    this.indexCheck = 0;
                    msg.payload = "match";
                    node.send(msg);
                }else{
                    this.indexCheck = this.indexCheck+1;
                    //swallows message
                }
            }else{
                this.indexCheck = 0;
                msg.payload = "reset";
                node.send(msg);
            }
        });
    }
    RED.nodes.registerType("decoder",LocalDecoder);
}