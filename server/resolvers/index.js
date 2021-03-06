import { EngineQueries, EngineMutations, EngineSubscriptions } from "./engines";
import { ShieldQueries, ShieldMutations, ShieldSubscriptions } from "./shields";
import {
  ClientQueries,
  ClientMutations,
  ClientSubscriptions,
  ClientTypes
} from "./clients";
import {
  FlightStructureQueries,
  FlightStructureMutations,
  FlightStructureSubscriptions,
  FlightStructureTypes
} from "./flightStructure";
import {
  ThrustersQueries,
  ThrustersMutations,
  ThrustersSubscriptions
} from "./thrusters";
import {
  AssetsQueries,
  AssetsMutations,
  AssetsSubscriptions,
  AssetsTypes
} from "./assets";
import {
  TransporterQueries,
  TransporterMutations,
  TransporterSubscriptions
} from "./transporters";
import {
  CoreLayoutQueries,
  CoreLayoutMutations,
  CoreLayoutSubscriptions
} from "./coreLayouts";
import {
  SensorsQueries,
  SensorsMutations,
  SensorsSubscriptions,
  SensorsTypes
} from "./sensors";
import {
  ShipStructureQueries,
  ShipStructureMutations,
  ShipStructureSubscriptions,
  ShipStructureTypes
} from "./shipStructure";
import { LRCommQueries, LRCommMutations, LRCommSubscriptions } from "./lrComm";
import {
  InternalCommQueries,
  InternalCommMutations,
  InternalCommSubscriptions
} from "./internalComm";
import {
  SystemsQueries,
  SystemsMutations,
  SystemsSubscriptions,
  SystemsTypes
} from "./systems";
import {
  NavigationQueries,
  NavigationMutations,
  NavigationSubscriptions
} from "./navigation";
import {
  ShortRangeCommQueries,
  ShortRangeCommMutations,
  ShortRangeCommSubscriptions
} from "./shortRangeComm";
import { ShipQueries, ShipMutations, ShipSubscriptions } from "./ship";
import {
  ReactorQueries,
  ReactorMutations,
  ReactorSubscriptions
} from "./reactor";
import {
  TargetingQueries,
  TargetingMutations,
  TargetingSubscriptions,
  TargetingTypes
} from "./targeting";
import {
  TorpedoQueries,
  TorpedoMutations,
  TorpedoSubscriptions
} from "./torpedo";
import { PhaserQueries, PhaserMutations, PhaserSubscriptions } from "./phasers";
import {
  ProbesQueries,
  ProbesMutations,
  ProbesSubscriptions,
  ProbesTypes
} from "./probes";
import {
  StealthFieldQueries,
  StealthFieldMutations,
  StealthFieldSubscriptions
} from "./stealthField";
import { IssueTrackerMutations } from "./issueTracker";
import {
  ActionsQueries,
  ActionsMutations,
  ActionsSubscriptions
} from "./actions";
import {
  CoolantQueries,
  CoolantMutations,
  CoolantSubscriptions
} from "./coolant";
import {
  TractorBeamQueries,
  TractorBeamMutations,
  TractorBeamSubscriptions
} from "./tractorBeam";

import {
  CrewQueries,
  CrewMutations,
  CrewSubscriptions,
  CrewTypes
} from "./crew";
import {
  TeamsQueries,
  TeamsMutations,
  TeamsSubscriptions,
  TeamsTypes
} from "./teams";
import { SetQueries, SetMutations, SetSubscriptions, SetTypes } from "./set";
import {
  ViewscreenQueries,
  ViewscreenMutations,
  ViewscreenSubscriptions
} from "./viewscreen";

import {
  MessagesQueries,
  MessagesMutations,
  MessagesSubscriptions
} from "./messages";

import {
  IsochipsQueries,
  IsochipsMutations,
  IsochipsSubscriptions,
  IsochipsTypes
} from "./isochips";

import App from "../../app";

function parseJSONLiteral(ast) {
  /* switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT: {
      const value = Object.create(null);
      ast.fields.forEach(field => {
        value[field.name.value] = parseJSONLiteral(field.value);
      });
      return value;
    }
    case Kind.LIST:
      return ast.values.map(parseJSONLiteral);
    default:
      return null;
    }*/
}

const queryMap = Object.assign(
  {},
  FlightStructureQueries,
  ClientQueries,
  ShieldQueries,
  EngineQueries,
  ThrustersQueries,
  AssetsQueries,
  TransporterQueries,
  CoreLayoutQueries,
  SensorsQueries,
  ShipStructureQueries,
  LRCommQueries,
  InternalCommQueries,
  SystemsQueries,
  NavigationQueries,
  ShortRangeCommQueries,
  ShipQueries,
  ReactorQueries,
  TargetingQueries,
  TorpedoQueries,
  PhaserQueries,
  ProbesQueries,
  StealthFieldQueries,
  ActionsQueries,
  CoolantQueries,
  TractorBeamQueries,
  CrewQueries,
  TeamsQueries,
  SetQueries,
  ViewscreenQueries,
  MessagesQueries,
  IsochipsQueries
);

export const mutationMap = Object.assign(
  {
    snapshot() {
      App.snapshot(true);
    }
  },
  FlightStructureMutations,
  ClientMutations,
  ShieldMutations,
  EngineMutations,
  ThrustersMutations,
  AssetsMutations,
  TransporterMutations,
  CoreLayoutMutations,
  SensorsMutations,
  ShipStructureMutations,
  LRCommMutations,
  InternalCommMutations,
  SystemsMutations,
  NavigationMutations,
  ShortRangeCommMutations,
  ShipMutations,
  ReactorMutations,
  TargetingMutations,
  TorpedoMutations,
  PhaserMutations,
  ProbesMutations,
  StealthFieldMutations,
  IssueTrackerMutations,
  ActionsMutations,
  CoolantMutations,
  TractorBeamMutations,
  CrewMutations,
  TeamsMutations,
  SetMutations,
  ViewscreenMutations,
  MessagesMutations,
  IsochipsMutations
);

const subscriptionMap = Object.assign(
  {},
  FlightStructureSubscriptions,
  ClientSubscriptions,
  ShieldSubscriptions,
  EngineSubscriptions,
  ThrustersSubscriptions,
  AssetsSubscriptions,
  TransporterSubscriptions,
  CoreLayoutSubscriptions,
  SensorsSubscriptions,
  ShipStructureSubscriptions,
  LRCommSubscriptions,
  InternalCommSubscriptions,
  SystemsSubscriptions,
  NavigationSubscriptions,
  ShortRangeCommSubscriptions,
  ShipSubscriptions,
  ReactorSubscriptions,
  TargetingSubscriptions,
  TorpedoSubscriptions,
  PhaserSubscriptions,
  ProbesSubscriptions,
  StealthFieldSubscriptions,
  ActionsSubscriptions,
  CoolantSubscriptions,
  TractorBeamSubscriptions,
  CrewSubscriptions,
  TeamsSubscriptions,
  SetSubscriptions,
  ViewscreenSubscriptions,
  MessagesSubscriptions,
  IsochipsSubscriptions
);

export default Object.assign(
  {
    Query: queryMap,
    Mutation: mutationMap,
    Subscription: subscriptionMap,
    UploadedFile: {
      __parseLiteral: parseJSONLiteral,
      __serialize: value => value,
      __parseValue: value => value
    }
  },
  AssetsTypes,
  SensorsTypes,
  FlightStructureTypes,
  ClientTypes,
  ShipStructureTypes,
  SystemsTypes,
  TargetingTypes,
  ProbesTypes,
  CrewTypes,
  TeamsTypes,
  SetTypes,
  IsochipsTypes
);
