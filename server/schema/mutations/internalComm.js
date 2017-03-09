export default `
# Macro: Add an internal communications system
createInternalComm(simulatorId: ID!): String
# Macro: Remove an internal communications system
removeInternalComm(id: ID!): String
internalCommConnectOutgoing(id: ID!):String
internalCommConnectIncoming(id: ID!):String
internalCommCancelIncoming(id: ID!):String
internalCommCancelOutgoing(id: ID!):String
internalCommCallIncoming(id: ID!, incoming: String):String
internalCommCallOutgoing(id: ID!, outgoing: String):String
`;
