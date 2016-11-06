import React, {Component} from 'react';
import {
    Row,
    Col,
    Container,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane,
} from 'reactstrap';
import Config from './Config.jsx';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import guid from '../helpers/guid.js';
import './style.scss';

const SUBSCRIPTION_QUERY = gql`
subscription onClientChange{
    clientChanged {
        id
        flight
        simulators
        station
    }
}
`;

class MissionModalView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedMission: {},
            simulatorSelect: {},
            stationSelect: {}
        };
    }
    selectMission(mission) {
        if (this.state.selectedMission.id === mission.id) {
            this.setState({selectedMission: undefined});
        } else {
            this.setState({selectedMission: mission});
        }
    }
    render(){
        return (
            <Modal isOpen={this.props.modal} toggle={this.props.toggle} size="large">
            <ModalHeader toggle={this.props.toggle}>Create A New Flight</ModalHeader>
            <ModalBody>
            <Row>
            <Col sm="6">
            <h4>Choose a mission</h4>
            <table className="table table-striped table-hover table-sm">
            <thead>
            <tr>
            <th>Name</th>
            <th>Simulators</th>
            </tr>
            </thead>
            <tbody>
            {this.props.data.loading ? <tr><td>Loading...</td><td></td></tr>
                : this.props.data.missions.map((mission) => {
                    return (<tr onClick={this.selectMission.bind(this,mission)} className={this.state.selectedMission.id === mission.id ? 'table-success' : ''} key={mission.id}>
                        <td>{mission.name}</td>
                        <td>{mission.simulators.length}</td>
                        </tr>);
                })
            }
            </tbody>
            </table>
            </Col>
            <Col sm="6">
            <h4>Or reload a saved flight</h4>
            <table className="table table-striped table-hover table-sm">
            <thead>
            <tr>
            <th>Date</th>
            <th>Mission</th>
            <th>Simulators</th>
            </tr>
            </thead>
            <tbody></tbody>
            </table>
            </Col>
            </Row>
            <Row>
            {
          /*  this.state.selectedMission.id
            ? this.state.selectedMission.simulators.map((e, index) => {
                return (
                    <div>
                    <Col sm="6">
                    <select key={index} onChange={this._selectMissionSimulator.bind(this, index)} ref={`simulatorSelect-${index}`} className="c-select form-control">
                    <option value={null}>Select a simulator</option>
                    {this.props.data.simulators.map((sim) => {
                        return <option key={sim.id} value={sim.id}>{sim.name}</option>;
                    })}
                    </select>
                    </Col>
                    <Col sm="6">
                    {this.state.simulatorSelect[`simulator-${index}`]
                    ? <select key={`station-${index}`} onChange={this._selectMissionStation.bind(this, index)} className="c-select form-control">
                    <option value={null}>Select a station</option>
                    {this.props.data.stations.filter((stat) => {
                        return stat.simulatorId === this.state.simulatorSelect[`simulator-${index}`];
                    }).map((stat) => {
                        return <option key={stat.id} value={stat.id}>{stat.name}</option>;
                    })}
                    </select>
                    : <div style={{
                        width: '100%',
                        height: '40px'
                    }}/>
                }
                </Col>
                </div>
                );
            })
        : <div/>*/}
        </Row>
        </ModalBody>
        <ModalFooter>
        <Button color="secondary" onClick={this.props.toggle}>Cancel</Button>
        <Button color="primary" onClick={this.props.loadFlight.bind(this)}>Load Flight</Button>
        </ModalFooter>
        </Modal>
        );
    }
}

const MissionsData = gql `
query Missions {
    missions {
        id
        name
        simulators{
            name
        }
    }
}`;

const MissionModal = graphql(MissionsData, {})(MissionModalView);

class Lobby extends Component {
    constructor(props) {
        super(props);
        this.state = {
            modal: false,
            selectedMission: {},
            presences: {},
            simulatorSelect: {},
            stationSelect: {},
            activeTab: '3'
        };
        this.toggleTab = this.toggleTab.bind(this);
        this.toggle = this.toggle.bind(this);
        this.subscription = null;
    }
    toggleTab(tab) {
        if (this.state.activeTab !== tab) {
            this.setState({
                activeTab: tab
            });
        }
    }
    componentWillReceiveProps(nextProps) {
        if (!this.subscription && !nextProps.data.loading) {
            debugger;
            this.subscription = nextProps.data.subscribeToMore({
                document: SUBSCRIPTION_QUERY,
                updateQuery: (previousResult, {subscriptionData}) => {
                    debugger;
                   // previousResult.clients[0].id = Math.random().toString();
                   return previousResult;
               },
           });
        }
    }
    loadFlight() {
        //Use the operation channel to insert the new flight into the database.
        let mission = this.props.data.missions.filter((e) => {
            if (e.id === this.state.selectedMission.id) {
                return true;
            }
            return false;
        })[0];
        mission.mission = {
            id: mission.id,
            name: mission.name
        };
        mission.timestamp = Date.now();
        delete mission.id;
        mission.id = guid();

        Object.keys(this.state.simulatorSelect).map((e) => {
            return this.state.simulatorSelect[e];
        }).forEach((e, index) => {
            mission.simulators[index].id = e;
        });

        Object.keys(this.state.stationSelect).map((e) => {
            return this.state.stationSelect[e];
        }).forEach((e, index) => {
            mission.simulators[index].stationSet = e;
        });

        /*let insertObj = {
            table: "flights",
            data: mission
        };*/ 

        this.setState({modal: false, selectedMission: {}});
    }
    toggle() {
        this.setState({
            modal: !this.state.modal
        });
    }
    _selectMissionSimulator(index, e) {
        let obj = this.state.simulatorSelect;
        obj[
        [`simulator-${index}`]
        ] = e.target.value;
        this.setState({simulatorSelect: obj});
    }
    _selectMissionStation(index, e) {
        let obj = this.state.stationSelect;
        obj[
        [`station-${index}`]
        ] = e.target.value;
        this.setState({stationSelect: obj});
    }
    _selectFlight(p, e) {
        let obj = this.state.presences || {};
        obj[p] = {
            flight: e.target.value,
            simulator: null,
            station: null
        };
        this.setState({presences: obj});
    }
    _selectSimulator(p, e) {
        let obj = this.state.presences || {};
        obj[p] = {
            flight: obj[p].flight,
            simulator: e.target.value,
            station: null
        };
        this.setState({presences: obj});
    }
    _selectStation(p, e) {
        let obj = this.state.presences || {};
        obj[p] = {
            flight: obj[p].flight,
            simulator: obj[p].simulator,
            station: e.target.value
        };
        this.setState({presences: obj});
    }
    render() {
        return (
            <Container className="lobby">
            <Row>
            <h2>Lobby</h2>
            <Nav tabs>
            <NavItem>
            <NavLink className={this.state.activeTab === '1' ? 'active' : ''} onClick={() => { this.toggleTab('1'); }} >
            Flights
            </NavLink>
            </NavItem>
            <NavItem>
            <NavLink className={this.state.activeTab === '2' ? 'active' : ''} onClick={() => { this.toggleTab('2'); }} >
            Clients
            </NavLink>
            </NavItem>
            <NavItem>
            <NavLink className={this.state.activeTab === '3' ? 'active' : ''} onClick={() => { this.toggleTab('3'); }} >
            Config
            </NavLink>
            </NavItem>
            </Nav>
            <TabContent activeTab={this.state.activeTab}>
            <TabPane tabId="1">
            <h4>Flights
            <Button color="success" size="sm" onClick={this.toggle}>Create Flight</Button></h4>
            {this.props.data.loading || !this.props.data.flights ? <h4>Loading...</h4>
                : this.props.data.flights.map((flight, index) => {
                    return <Row key={flight.id}>
                    <Col sm="12">
                    <h4>{flight.name} - {flight.date}</h4>
                    </Col>
                    {flight.simulators.map((simulator) => {
                        return <Col key={simulator.id} sm="12">
                        <h5>{simulator.name}</h5>
                        {/*simulator.stationSet.stations.map((station) => {
                           return <Col key={`${simulator.id}-${station.name}`} sm="6">
                           <label>{station.name}</label>
                           <select>
                           <option value={null}>Select a client</option>
                           {this.props.data.clients.map((session) => {
                            return <option value={session.id}>{session.id}</option>
                        })}
                           </select>
                           </Col>;
                       })*/}
                       </Col>;
                   })}
                    </Row>;
                })
            }
            </TabPane>
            <TabPane tabId="2">
            <h4>Clients</h4>
            <table className="table table-striped table-hover table-sm">
            <thead>
            <tr>
            <th>Client Name</th>
            <th>Station</th>
            <th>Actions</th>
            </tr>
            </thead>
            <tbody>
            {!this.props.data.loading
                ? () => {} /*this.props.data.clients.map((p, index) => (
                    <tr key={`flight-${p.id}-${index}`}>
                    <td>{`${p.id}`}</td>
                    <td>
                    <select onChange={this._selectStation.bind(this, p)} className="form-control-sm c-select">
                    <option>Select a station</option>
                    {(() => {
                        if (this.props.data.stations[0]){
                            return this.props.data.stations[0].stations.map((e, index) => {
                                return <option key={`station-${p}-${e.name}-${index}`} value={e.name}>{e.name}</option>;
                            });
                        }
                        return <option disabled>No Stations</option>
                    })()}
                    </select>
                    </td>
                    <td>
                    <Button color="primary" title="This saves the current simulator and station setting and persists it for future flights." size="sm">Save</Button>
                    <Button color="danger" title="This removes the saved state." size="sm">Reset</Button>
                    </td>
                    </tr>
                    ))*/
                : <tr></tr>
            }
            </tbody>
            </table>
            </TabPane>
            <TabPane tabId="3">
            <Config />
            </TabPane>
            </TabContent>
            </Row>
            {
                this.state.modal ?
                <MissionModal
                modal={this.state.modal}
                toggle={this.toggle.bind(this)}
                loadFlight={this.loadFlight.bind(this)}
                />
                : <span />
            }
            </Container>
            );
}
}

const LobbyData = gql `
query Sessions {
    clients {
        id
        flight
        simulators
        station
    }
    flights {
        id
        name
        simulators {
            id
            name
        }
    }
    stations(name: "default") {
        id
        name
        stations {
          name
      }
  }
}`;

export default graphql(LobbyData, {
    options: (props) => {
        return {};
    },
})(Lobby);
