import React, { Component } from "react";
import gql from "graphql-tag";
import { Row, Col, Container } from "reactstrap";
import { graphql, withApollo } from "react-apollo";
import Measure from "react-measure";
import Immutable from "immutable";
import "./style.scss";
/* TODO

Some improvements:
- Make it so you can just click on a box or a yellow line to set the power level
- Make it so the names show up better (add a display name to the system class)
- Change the types of the systems to make it easier to sort the systems by name.
*/

const mutation = gql`
  mutation ChangePower($id: ID!, $level: Int!) {
    changePower(systemId: $id, power: $level)
  }
`;

const SYSTEMS_SUB = gql`
  subscription SystemsUpdate($simulatorId: ID) {
    systemsUpdate(simulatorId: $simulatorId) {
      name
      type
      id
      power {
        power
        powerLevels
      }
      damage {
        damaged
      }
    }
  }
`;

const REACTOR_SUB = gql`
  subscription ReactorUpdate($simulatorId: ID) {
    reactorUpdate(simulatorId: $simulatorId) {
      id
      model
      efficiency
      powerOutput
    }
  }
`;

class PowerDistribution extends Component {
  constructor(props) {
    super(props);
    this.state = {
      systems: [],
      offset: null,
      sysId: null
    };
    this.mouseMove = e => {
      const mouseX = e.pageX;
      const level = Math.max(
        0,
        Math.min(40, Math.round((mouseX - this.state.offset - 10) / 14))
      );
      const { systems, sysId } = this.state;
      const newSystems = systems.map(s => {
        if (s.id === sysId) {
          const newSys = JSON.parse(JSON.stringify(s));
          newSys.power.power = level;
          return newSys;
        }
        return s;
      });
      this.setState({
        systems: newSystems
      });
    };
    this.mouseUp = () => {
      document.removeEventListener("mousemove", this.mouseMove);
      document.removeEventListener("mouseup", this.mouseUp);
      const system = this.state.systems.find(s => s.id === this.state.sysId);
      const variables = {
        id: system.id,
        level: system.power.power
      };
      this.props.client.mutate({
        mutation,
        variables
      });
      this.setState({
        offset: null,
        sysId: null
      });
    };
    this.systemSub = null;
    this.reactorSub = null;
  }
  componentWillReceiveProps(nextProps) {
    if (!nextProps.data.loading) {
      this.setState({
        systems: nextProps.data.systems
      });
    }
    if (!this.systemSub && !nextProps.data.loading) {
      this.systemSub = nextProps.data.subscribeToMore({
        document: SYSTEMS_SUB,
        variables: {
          simulatorId: nextProps.simulator.id
        },
        updateQuery: (previousResult, { subscriptionData }) => {
          const returnResult = Immutable.Map(previousResult);
          return returnResult
            .merge({ systems: subscriptionData.data.systemsUpdate })
            .toJS();
        }
      });
      this.reactorSub = nextProps.data.subscribeToMore({
        document: REACTOR_SUB,
        variables: {
          simulatorId: nextProps.simulator.id
        },
        updateQuery: (previousResult, { subscriptionData }) => {
          const returnResult = Immutable.Map(previousResult);
          return returnResult
            .merge({ reactors: subscriptionData.data.reactorUpdate })
            .toJS();
        }
      });
    }
  }
  mouseDown(sysId, dimensions, e) {
    this.setState({
      sysId,
      offset: dimensions.left
    });
    document.addEventListener("mousemove", this.mouseMove);
    document.addEventListener("mouseup", this.mouseUp);
  }
  render() {
    if (this.props.data.loading) return null;
    // Get the batteries, get just the first one.
    const powerTotal = this.state.systems.reduce((prev, next) => {
      return next.power.power + prev;
    }, 0);
    const { reactors } = this.props.data;
    const reactor = reactors.find(r => r.model === "reactor");
    const reactorOutput = Math.round(reactor.efficiency * reactor.powerOutput);
    return (
      <Container className="powerLevels">
        <Row className="powerlevel-row">
          <Measure>
            {dimensions =>
              <Col lg={{size: 10, offset: 1}} className="powerlevel-containers">
                {this.state.systems
                  .slice(0)
                  .sort((a, b) => {
                    if (a.type > b.type) return 1;
                    if (a.type < b.type) return -1;
                    return 0;
                  })
                  .map(sys =>
                    <SystemPower
                      {...sys}
                      mouseDown={this.mouseDown.bind(this)}
                      count={this.state.systems.length}
                      height={dimensions.height}
                    />
                  )}
                <h4 className="totalPowerText">
                  <span>Total Power Used: {powerTotal}</span> <span style={{paddingLeft: '20px'}}>Total Power Available: {reactorOutput}</span>
                </h4>
              </Col>}
          </Measure>
        </Row>
      </Container>
    );
  }
}

const SystemPower = ({
  id,
  name,
  displayName,
  damage: { damaged },
  power: { power, powerLevels },
  mouseDown,
  count,
  height
}) => {
  return (
    <Row>
      <Col sm="4">
        <h5
          className={damaged ? "text-danger" : ""}
          style={{ padding: 0, margin: 0, marginTop: height / count - 20 }}
        >
          {displayName}: {power}
        </h5>
      </Col>
      <Col sm="8">
        <Measure>
          {dimensions =>
            <div
              className="powerLine"
              style={{ margin: (height / count - 20) / 2 }}
            >
              {powerLevels.map(n => {
                return (
                  <div
                    className="powerLevel"
                    key={`${id}-powerLine-${n}`}
                    style={{ left: `${(n + 1) * 14 - 7}px` }}
                  />
                );
              })}
              <div
                className="powerBox zero"
                onMouseDown={mouseDown.bind(this, id, dimensions)}
                key={`${id}-${-1}`}
              />
              {Array(40).fill(0).map((n, i) => {
                return (
                  <div
                    className={`powerBox ${i >= power ? "hidden" : ""}`}
                    onMouseDown={mouseDown.bind(this, id, dimensions)}
                    key={`${id}-${i}`}
                  />
                );
              })}
            </div>}
        </Measure>
      </Col>
    </Row>
  );
};

const SYSTEMS_QUERY = gql`
  query Systems($simulatorId: ID) {
    systems(simulatorId: $simulatorId, power: true) {
      name
      displayName
      type
      id
      power {
        power
        powerLevels
      }
      damage {
        damaged
      }
    }
    reactors(simulatorId: $simulatorId) {
      id
      model
      efficiency
      powerOutput
    }
  }
`;

export default graphql(SYSTEMS_QUERY, {
  options: ownProps => ({ variables: { simulatorId: ownProps.simulator.id } })
})(withApollo(PowerDistribution));
