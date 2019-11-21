## Overview
The sequence detector can be used to scan input messages for a specific sequence and generate a match message when the input stream of messages matches the sequence. 
This can be used for input code sequences, triggering based on a complex set of sequential events, or to simplify more complex node structures that produce the same behaviour. 

The sequence detector can be configured to scan <code>msg.payload</code> or <code>msg.topic</code> or both.

Messages will be inspected and if a series of messages matches the configured sequence in the exact order, a <code>match</code> message will be sent.
    
If any message breaks the sequence, the detector will reset and start to look for the configured sequence from the first element of the sequence again. A <code>reset</code> message will be sent.
    

Inspects all incoming messages in order and matches against the configured sequence.
    
### Inputs
    
    Either the payload, topic, or both can be inspected for sequence detection using the <code>watch</code> config option.
#### payload
 
    the payload of the message to inspect.
 
 #### topic
    the topic to inspect.
    

 ### Outputs

#### Match
          
    the message payload sent when the full sequence is detected in exact order. The output is <code>match</code>.
         
#### Reset 
           
    the message payload sent when the sequence detector resets and starts looking for the first element of the sequence again. The output is <code>reset</code>.
             

