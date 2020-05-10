![github build](https://github.com/kareem613/node-red-contrib-sequence-detector/workflows/Node.js%20Package/badge.svg)

## Overview
The sequence detector can be used to scan input messages for a specific sequence and generate a match message when the input stream of messages matches the sequence. 
This can be used for input code sequences, triggering based on a complex set of sequential events, or to simplify more complex node structures that produce the same behaviour. 

The sequence detector can be configured to scan `msg.payload` or any other part of the message.

Messages will be inspected and if a series of messages matches the configured sequence in the exact order, a `match` message will be sent.
    
If any message breaks the sequence, the detector will reset and start to look for the configured sequence from the first element of the sequence again. A `reset` message will be sent.

A negative sequence can be defined to ensure that the sequence is not preceeded by a certain sequence, for example the negative sequence 0,1,2 with the sequence 3,4,5.  If the sequence 0,1,2,3,4,5 is received, even though 3,4,5 is received it would still send a `reset` because it is preceeded by 0,1,2.  If it preceeded by anything else it would have been a successful match.

Inspects all incoming messages in order and matches against the configured sequence.
    
### Inputs
Either the payload, topic, or both can be inspected for sequence detection using the `watch` config option.

#### payload
the payload of the message to inspect.
 
#### topic
the topic to inspect.

### Outputs

#### Match
the message payload sent when the full sequence is detected in exact order. The output is `match`.

#### Reset 
the message payload sent when the sequence detector resets and starts looking for the first element of the sequence again. The output is `reset`.

