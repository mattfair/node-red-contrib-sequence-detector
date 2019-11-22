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
        n1.should.have.have.property('matchMessage', 'match');
        n1.should.have.have.property('resetMessage', 'reset');
        n1.should.have.have.property('timeoutMessage', 'timeout');
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
      matchMessage: "match message",
      resetMessage: "reset message",
      timeoutMessage: "timeout message"
    }];
    helper.load(decoderNode, flow, function () {
      var n1 = helper.getNode("n1");
      
      try{
        n1.should.have.have.property('name', 'sequence-detector');
        n1.should.have.have.property('sequence', ['one', 'two']);
        n1.should.have.have.property('watch', 'topic');
        n1.should.have.have.property('timeout', 1000);
        n1.should.have.have.property('matchMessage', 'match message');
        n1.should.have.have.property('resetMessage', 'reset message');
        n1.should.have.have.property('timeoutMessage', 'timeout message');
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

  it('should send reset on mismatch', function (done) {
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
          msg.should.have.property('payload', 'reset');
          done();
        }catch(err){
          return done(err);
        }
      });
      decoder.receive({ payload: sentSequence[0] });
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

  it('should match on topic when watch is both', function (done) {
    var sequence = "1";
    var payload = "0";
    var topic = "1";
    var flow = [
      { id: "n1", type: "sequence-detector", name: "sequence-detector", sequence: sequence, watch: "both",wires:[["n2"]] },
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

  it('should match on payload when watch is both', function (done) {
    var sequence = "1";
    var payload = "1";
    var topic = "0";
    var flow = [
      { id: "n1", type: "sequence-detector", name: "sequence-detector", sequence: sequence, watch: "both",wires:[["n2"]] },
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

  // it('should timeout', function(done){
  //   var flow = [
  //     { id: "n1", type: "sequence-detector", name: "sequence-detector", sequence: "0\n1",wires:[["n2"]] },
  //     { id: "n2", type: "helper" }
  //   ];
  //   helper.load(decoderNode, flow, function () {
  //     var receiver = helper.getNode("n2");
  //     var decoder = helper.getNode("n1");
  //     receiver.on("input", function (msg) {
  //       try{
  //         msg.should.have.property('payload', 'timeout');
  //         done();
  //       }catch(err){
  //         return done(err);
  //       }
  //     });
  //     decoder.receive({ payload: "0" }); 
  //   });
    
  // });

});

