export default `
  clientConnect: Client
  clientDisconnect: Client
  clientChanged(client: ID): [Client]
  clientPing(client: ID!): String
`;
