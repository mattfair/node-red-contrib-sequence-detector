var should = require("should");
var helper = require("node-red-node-test-helper");
var decoderNode = require("../sequence-detector.js");

helper.init(require.resolve('node-red'));

describe('sequence-detector Node', function () {

  beforeEach(function (done) {
      helper.startServer(done);
  });

  afterEach(function (done) {
      helper.unload();
      helper.stopServer(done);
  });

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "sequence-detector", name: "sequence-detector"}];
    helper.load(decoderNode, flow, function () {
      var n1 = helper.getNode("n1");

      try{
        n1.should.have.have.property('name', 'sequence-detector');
        done();
      }catch(err){
        return done(err);
      }
    });
  });

  it('should have default config options', function (done) {
    var flow = [{ id: "n1", type: "sequence-detector", name: "sequence-detector"}];
    helper.load(decoderNode, flow, function () {
      var n1 = helper.getNode("n1");
      
      try{
        n1.should.have.have.property('name', 'sequence-detector');
        n1.should.have.have.property('sequence', []);
        n1.should.have.have.property('watch', 'payload');
        n1.should.have.have.property('timeout', 2000);
        n1.should.have.have.property('matchMessage', {payload:'match'});
        n1.should.have.have.property('resetMessage', {payload:'reset'});
        n1.should.have.have.property('timeoutMessage', {payload:'timeout'});
        done();
      }catch(err){
        return done(err);
      }
    });
  });

  it('should use config options', function (done) {
    var flow = [{ id: "n1", type: "sequence-detector", name: "sequence-detector",
      sequence:"one\ntwo",
      watch: "topic",
      timeout: 1000,
      matchMessage: {payload: "match message"},
      resetMessage: {payload: "reset message"},
      timeoutMessage: {payload: "timeout message"}
    }];
    helper.load(decoderNode, flow, function () {
      var n1 = helper.getNode("n1");
      
      try{
        n1.should.have.have.property('name', 'sequence-detector');
        n1.should.have.have.property('sequence', ['one', 'two']);
        n1.should.have.have.property('watch', 'topic');
        n1.should.have.have.property('timeout', 1000);
        n1.should.have.have.property('matchMessage', {payload: 'match message'});
        n1.should.have.have.property('resetMessage', {payload: 'reset message'});
        n1.should.have.have.property('timeoutMessage', {payload: 'timeout message'});
        done();
      }catch(err){
        return done(err);
      }
    });
  });

  it('should send match on match', function (done) {
    var flow = [
      { id: "n1", type: "sequence-detector", name: "sequence-detector", sequence: "0",wires:[["n2"]] },
      { id: "n2", type: "helper" }
    ];
    helper.load(decoderNode, flow, function () {
      var receiver = helper.getNode("n2");
      var decoder = helper.getNode("n1");
      receiver.on("input", function (msg) {
        try{
          msg.should.have.property('payload', 'match');
          done();
        }catch(err){
          return done(err);
        }
      });
      decoder.receive({ payload: "0" });
    });
  });

  it('should match long sequence', function (done) {
    var flow = [
      { id: "n1", type: "sequence-detector", name: "sequence-detector", sequence: "3\n4\n5",wires:[["n2"]] },
      { id: "n2", type: "helper" }
    ];
    helper.load(decoderNode, flow, function () {
      var receiver = helper.getNode("n2");
      var decoder = helper.getNode("n1");
      receiver.on("input", function (msg) {
        try{
          msg.should.have.property('payload', 'match');
          done();
        }catch(err){
          return done(err);
        }
      });
      decoder.receive({ payload: "0" });
      decoder.receive({ payload: "1" });
      decoder.receive({ payload: "2" });
      decoder.receive({ payload: "3" });
      decoder.receive({ payload: "4" });
      decoder.receive({ payload: "5" });
    });
  });

  it('should not match because of negative sequence', function (done) {
    var flow = [
      { id: "n1", type: "sequence-detector", name: "sequence-detector", negativeSequence: "0\n1\n2", sequence: "3\n4\n5",wires:[[],["reset"]] },
      { id: "reset", type: "helper" }
    ];
    helper.load(decoderNode, flow, function () {
      var receiver = helper.getNode("reset");
      var decoder = helper.getNode("n1");
      receiver.on("input", function (msg) {
        try{
          msg.should.have.property('payload', 'reset');
          done();
        }catch(err){
          return done(err);
        }
      });
      decoder.receive({ payload: "0" });
      decoder.receive({ payload: "1" });
      decoder.receive({ payload: "2" });
      decoder.receive({ payload: "3" });
      decoder.receive({ payload: "4" });
      decoder.receive({ payload: "5" });
    });
  });

  it('should not match because of negative sequence and remember history', function (done) {
    var flow = [
      { id: "n1", type: "sequence-detector", name: "sequence-detector", negativeSequence: "0", sequence: "1\n0",wires:[[],["reset"]] },
      { id: "reset", type: "helper" }
    ];
    helper.load(decoderNode, flow, function () {
      var receiver = helper.getNode("reset");
      var decoder = helper.getNode("n1");
      decoder.receive({ payload: "0" });
      decoder.receive({ payload: "1" });
      decoder.receive({ payload: "0" });
      decoder.receive({ payload: "1" });
      receiver.on("input", function (msg) {
        try{
          msg.should.have.property('payload', 'reset');
          done();
        }catch(err){
          return done(err);
        }
      });
      decoder.receive({ payload: "0" });
    });
  });

  it('should match when negative sequence history is cleared', function (done) {
    this.timeout(10000);
    var flow = [
      { id: "n1", type: "sequence-detector", name: "sequence-detector", timeout:2000, negativeSequence: "0", sequence: "1\n0",wires:[[],["reset"]] },
      { id: "reset", type: "helper" }
    ];
    helper.load(decoderNode, flow, function () {
      const RESET = 0;
      const TIMEOUT = 1;
      const MATCH = 2;

      var receiver = helper.getNode("reset");
      var decoder = helper.getNode("n1");
      receiver.state = RESET;
      receiver.on("input", function (msg) {
        try{
          if(receiver.state == RESET)
          {
            console.log('should have reset');
            console.log(msg);
            msg.should.have.property('payload', 'reset');
            receiver.state = TIMEOUT;
          }
          else if(receiver.state == TIMEOUT)
          {
            console.log('should have timeout');
            console.log(msg);
            msg.should.have.property('payload', 'timeout');
            receiver.state = MATCH;
          }
        }catch(err){
          return done(err);
        }
      });
      decoder.receive({ payload: "0" });
      decoder.receive({ payload: "1" });
      decoder.receive({ payload: "0" });
      decoder.receive({ payload: "1" });

      setTimeout((decoder, receiver)=>{
         console.log('sending something to match after timeout...');
        //send something to match after timeout
        receiver.on("input", function (msg) {
          try{
              console.log('should have match');
              console.log(msg);
              msg.should.have.property('payload', 'match');
              console.log('done');
              done();
          }catch(err){
            return done(err);
          }
        });
        decoder.receive({ payload: "1" });
        decoder.receive({ payload: "0" });
      }, 4000, decoder, receiver);
    });
  });

  it('should not send reset on initial sequence mismatch', function (done) {
    var configSequence = "0";
    var sentSequence = "1";
    var flow = [
      { id: "n1", type: "sequence-detector", name: "sequence-detector", sequence: configSequence,wires:[[],["reset"]] },
      { id: "reset", type: "helper" }
    ];
    helper.load(decoderNode, flow, function () {
      var receiver = helper.getNode("reset");
      var decoder = helper.getNode("n1");
      receiver.on("input", function (msg) {
        try{
          should.fail("Reset message should not be sent.");
          done();
        }catch(err){
          return done(err);
        }
      });
      decoder.receive({ payload: sentSequence[0] });
      done();
    });
  });

  it('should send custom match message on match', function (done) {
    var customMatchMessage = {payload:"matched"};
    var flow = [
      { id: "n1", type: "sequence-detector", name: "sequence-detector",matchMessage:customMatchMessage, sequence: "0",wires:[["n2"]] },
      { id: "n2", type: "helper" }
    ];
    helper.load(decoderNode, flow, function () {
      var receiver = helper.getNode("n2");
      var decoder = helper.getNode("n1");
      receiver.on("input", function (msg) {
        try{
          msg.should.have.property('payload', customMatchMessage.payload);
          done();
        }catch(err){
          return done(err);
        }
      });
      decoder.receive({ payload: "0" });
    });
  });

  it('should send custom reset message on mismatch', function (done) {
    var customResetMessage = { payload: "startover" };
    var configSequence = "0\n1";
    var sentSequence = ["0","0"];
    var flow = [
      { id: "n1", type: "sequence-detector", name: "sequence-detector", resetMessage:customResetMessage, sequence: configSequence,wires:[[],["reset"]] },
      { id: "reset", type: "helper" }
    ];
    helper.load(decoderNode, flow, function () {
      var receiver = helper.getNode("reset");
      var decoder = helper.getNode("n1");
      
      decoder.receive({ payload: sentSequence[0] });
      receiver.on("input", function (msg) {
        try{
          msg.should.have.property('payload', customResetMessage.payload);
          done();
        }catch(err){
          return done(err);
        }
      });
      decoder.receive({ payload: sentSequence[1] });
    });
  });

  it('should match two element sequence', function (done) {
    var configSequence = '0\n1';
    var sentSequence = ['0','1'];
    var flow = [
      { id: "n1", type: "sequence-detector", name: "sequence-detector", sequence: configSequence,wires:[["n2"]] },
      { id: "n2", type: "helper" }
    ];
    helper.load(decoderNode, flow, function () {
      var receiver = helper.getNode("n2");
      var decoder = helper.getNode("n1");
      decoder.receive({ payload: sentSequence[0] });
      receiver.on("input", function (msg) {
        try{
          msg.should.have.property('payload', 'match');
          done();
        }catch(err){
          return done(err);
        }
      });
      decoder.receive({ payload: sentSequence[1] });
    });
  });

  it('should reset on mismatch after a match', function (done) {
    var configSequence = '0\n1';
    var sentSequence = ['0','0'];
    var flow = [
      { id: "n1", type: "sequence-detector", name: "sequence-detector", timeout:10000, sequence: configSequence,wires:[[],["reset"]] },
      { id: "reset", type: "helper" }
    ];
    helper.load(decoderNode, flow, function () {
      var receiver = helper.getNode("reset");
      var decoder = helper.getNode("n1");
      decoder.receive({ payload: sentSequence[0] });
      receiver.on("input", function (msg) {
        try{
          msg.should.have.property('payload', 'reset');
          done();
        }catch(err){
          return done(err);
        }
      });
      decoder.receive({ payload: sentSequence[1] });
    });
  });

  it('should match on topic', function (done) {
    var sequence = "1";
    var payload = "0";
    var topic = "1";
    var flow = [
      { id: "n1", type: "sequence-detector", name: "sequence-detector", sequence: sequence, watch: "topic",wires:[["n2"]] },
      { id: "n2", type: "helper" }
    ];
    helper.load(decoderNode, flow, function () {
      var receiver = helper.getNode("n2");
      var decoder = helper.getNode("n1");
      receiver.on("input", function (msg) {
        try{
          msg.should.have.property('payload', 'match');
          done();
        }catch(err){
          return done(err);
        }
      });
      decoder.receive({topic:topic, payload: payload });
    });
  });

  it('should timeout', function(done){
    var flow = [
      { id: "n1", type: "sequence-detector", name: "sequence-detector", timeout:200, sequence: "0\n1",wires:[[],["n2"]] },
      { id: "n2", type: "helper" }
    ];
    helper.load(decoderNode, flow, function () {
      var receiver = helper.getNode("n2");
      var decoder = helper.getNode("n1");
      receiver.on("input", function (msg) {
        try{
          msg.should.have.property('payload', 'timeout');
          done();
        }catch(err){
          return done(err);
        }
      });
      decoder.receive({ payload: "0" });
    });
  });
});
