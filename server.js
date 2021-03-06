import "./server/helpers/init";
//Run init before anything else. Make sure all our files are in place before they are needed by other things
import express from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import { graphqlExpress, graphiqlExpress } from "graphql-server-express";
import multer from "multer";
import cors from "cors";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { printSchema } from "graphql/utilities/schemaPrinter";
import graphqlExpressUpload from "graphql-server-express-upload";
import { schema, subscriptionManager } from "./server/data";
import vanity from "./server/helpers/vanity";
import "./server/helpers/broadcast";
import ipaddress from "./server/helpers/ipaddress";
import "./server/helpers/client-server.js";

import "./server/events";
import "./server/processes";

const CLIENT_PORT = 3000;
const GRAPHQL_PORT = 3001;
const WS_PORT = 3002;

const GraphQLOptions = request => ({
  schema,
  context: { clientId: request.headers.clientid }
});

let appDir = "./";
//if (electron.app) {
//  appDir = electron.app.getPath('appData') + '/thorium/';
//}

const upload = multer({
  dest: appDir + "temp"
});

const options = {
  endpointURL: "/graphql" // URL for the GraphQL endpoint this instance of GraphiQL serves
};

export const websocketServer = createServer((req, response) => {
  response.writeHead(404);
  response.end();
});

// eslint-disable-next-line
new SubscriptionServer(
  {
    subscriptionManager
  },
  {
    server: websocketServer
  }
);

export const graphQLServer = express();
graphQLServer.use(require("express-status-monitor")());
graphQLServer.use("*", cors());

graphQLServer.use("/schema", (req, res) => {
  res.set("Content-Type", "text/plain");
  res.send(printSchema(schema));
});

graphQLServer.use(
  "/graphql",
  upload.array("files"),
  graphqlExpressUpload({ endpointURL: "/graphql" }),
  bodyParser.json({ limit: "4mb" }),
  graphqlExpress(GraphQLOptions)
);

graphQLServer.use("/graphiql", graphiqlExpress(options));
vanity();
export const graphQLserverInstance = graphQLServer.listen(GRAPHQL_PORT, () =>
  console.log(
    `
Client Server is now running on http://${ipaddress}:${CLIENT_PORT}/client
Access the Flight Director on http://${ipaddress}:${CLIENT_PORT}
GraphQL Server is now running on http://${ipaddress}:${GRAPHQL_PORT}/graphql`
  )
);

export const websocketServerInstance = websocketServer.listen(WS_PORT);
