import React, {Component} from 'react';
import Async from 'react-promise';
import gql from 'graphql-tag';
import { graphql, withApollo } from 'react-apollo';
import React3 from 'react-three-renderer';
import * as THREE from 'three';
import {parse as parsePath} from 'extract-svg-path';
import svgMesh3d from 'svg-mesh-3d';
import MouseInput from '../../../helpers/threeMouseInput';

const createGeom = require('three-simplicial-complex')(THREE)
const dragPlane = new THREE.Plane();
const backVector = new THREE.Vector3(0, 0, -1);

function degtorad(deg){
  return deg *(Math.PI/180);
}

//TODO: Cache the sensor icon geometry so it can be reused without flickering the sensor contacts on re-render
const SENSORCONTACT_SUB = gql`
subscription SensorContactsChanged($sensorId: ID) {
  sensorContactUpdate(sensorId: $sensorId){
    id
    name
    size
    iconUrl
    pictureUrl
    speed 
    velocity {
      x
      y
      z
    }
    location {
      x
      y
      z
    }
    destination {
      x
      y
      z
    }
    infrared
    cloaked
    destroyed
  }
}`;

class SensorGrid extends Component{
	constructor(props){
		super(props);
    this.cameraPosition = new THREE.Vector3(0, 0, 2.45);
    this.state = {
      weaponsRangeOpacity: 0,
      weaponsRangePulse: 1,
      mouseInput: null,
      camera: null,
      hovering: false,
      dragging: false,
      contacts: {},
      draggingContact:{}
    }
    this.contacts = [];
    this._cursor = {
      hovering: false,
      dragging: false,
    };
    this.sensorContactsSubscription = null;
    this._onAnimate = () => {
      // we will get this callback every frame
      const {
        mouseInput,
        camera,
      } = this.refs;
      if (!mouseInput.isReady()) {
        const {
          scene,
          container,
        } = this.refs;
        mouseInput.ready(scene, container, camera);
        mouseInput.restrictIntersections(this.contacts);
        mouseInput.setActive(false);
      }

      if (this.state.mouseInput !== mouseInput) {
        this.setState({
          mouseInput,
        });
      }

      if (this.state.camera !== camera) {
        this.setState({
          camera,
        });
      }
      let {weaponsRangePulse, weaponsRangeOpacity} = this.state;
      if (weaponsRangePulse !== 0){
        weaponsRangeOpacity += weaponsRangePulse * 0.05;
        if (weaponsRangeOpacity >= 1){
          weaponsRangePulse = -1;
        }
        if (weaponsRangeOpacity < 0){
          weaponsRangePulse = 0;
        }
        if (weaponsRangeOpacity <= 0) {
          weaponsRangeOpacity = 0;
        }
        if (weaponsRangeOpacity >= 1) {
          weaponsRangeOpacity = 1;
        }
        this.setState({
          weaponsRangePulse,
          weaponsRangeOpacity
        })
      }
    };
    this._onDocumentMouseMove = (event) => {
      event.preventDefault();

      const {
        mouseInput,
      } = this.state;

      const ray:THREE.Ray = mouseInput.getCameraRay(new THREE
        .Vector2(event.clientX, event.clientY));

      const intersection = dragPlane.intersectLine(new THREE.Line3(
        ray.origin,
        ray.origin.clone()
        .add(ray.direction.clone().multiplyScalar(10000))
        ));

      if (intersection) {
        const obj = {};
        const contact = this.state.draggingContact;
        contact.destination = JSON.parse(JSON.stringify(intersection.sub(this._offset)));
        obj[contact.id] = contact;
        this.setState({
          contacts: Object.assign(this.state.contacts, obj)
        })
      }
    };

    this._onDocumentMouseUp = (event) => {
      event.preventDefault();

      document.removeEventListener('mouseup', this._onDocumentMouseUp);
      document.removeEventListener('mousemove', this._onDocumentMouseMove);
      const contact = this.state.draggingContact;
      const speed = 1; //TODO: Replace with selected speed
      this.props.client.mutate({
        mutation: gql`
        mutation MoveSensorContact($id: ID!, $contact: SensorContactInput!){
          moveSensorContact(id:$id, contact: $contact)
        }`,
        variables: {
          id: this.props.sensor,
          // Gotta construct it manually because 
          // GraphQL rejects if it has the wrong fields
          contact: {
            id: contact.id,
            speed: speed,
            location: {
              x:contact.location.x,
              y:contact.location.y,
              z:contact.location.z,
            },
            destination: {
              x:contact.destination.x,
              y:contact.destination.y,
              z:contact.destination.z,
            },
          }
        }
      })
      this.setState({
        dragging: false,
        draggingContact: {}
      });
    };
  }
  componentDidMount() {
    this.setState({
      weaponsRangePulse: 0
    })
  }
  componentDidUpdate(prevProps, prevState) {
    if (!this.props.data.loading){
      window.scene = this.refs.scene
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.weaponsRangePulse !== this.state.weaponsRangePulse){
      this.setState({
        weaponsRangePulse: 1
      })
    }
    const simpleUpdateContacts = [];
    //Load the geometries async
    //Loop through the contacts to make sure it isn't in the array already
    Promise.all(nextProps.data.sensorContacts.filter((contact) => {
      if (!this.state.contacts[contact.id]){
        //There's a new one that needs to be added.
        return true;
      }
      //Make sure the contact doesn't need to be updated
      if (contact.icon !== this.state.contacts[contact.id].iconUrl){
        return true;
      }
      //It means the contact either has little or no changes
      simpleUpdateContacts.push(contact);
      return false;
    }).map((contact) => {
      return fetch(contact.iconUrl).then((res) => res.text())
      .then((val) => {
        // Process the response
        var div = document.createElement('div');
        div.innerHTML = val;
        const svg = div.querySelector('svg');
        const svgPath = parsePath(svg);
        const complex = svgMesh3d(svgPath, {
          delaunay: true,
          scale: 4,
          simplify: 1,
          randomization: 10,
        });
        //const mesh = reindex(unindex(complex.positions, complex.cells));
        contact.geometry = new createGeom(complex);
        return contact;
      })
    })
    ).then((contacts) => {
      //Turn it from an array into an object
      return contacts.reduce((prev, next) => {
        prev[next.id] = next;
        return prev;
      },{})
    }).then((contacts) => {
      this.setState({
        contacts: Object.assign(this.state.contacts, contacts)
      })
    });
    //Now handle the simple update contacts
    const newContacts = this.state.contacts;
    simpleUpdateContacts.forEach((contact) => {
      const geometry = newContacts[contact.id].geometry;
      newContacts[contact.id] = contact;
      newContacts[contact.id].geometry = geometry;
    })
    this.setState({
      contacts: Object.assign(this.state.contacts, newContacts)
    })
    //Subscribe
    if (!this.sensorsSubscription && !nextProps.data.loading) {
      this.sensorsSubscription = nextProps.data.subscribeToMore({
        document: SENSORCONTACT_SUB,
        variables: {sensorId: this.props.sensor},
        updateQuery: (previousResult, {subscriptionData}) => {
          previousResult.sensorContacts = subscriptionData.data.sensorContactUpdate
          return previousResult;
        },
      });
    }
  }
  _onHoverStart(e, threeObj) {
    this.setState({
      hovering: true,
    });
    this.props.hoverContact(this.state.contacts[threeObj.object.name])
  };

  _onHoverEnd() {
    this.setState({
      hovering: false,
    });
    this.props.hoverContact()
  };

  _onDragStart(e, intersection) {
    const contactId = intersection.object.name;
    const contact = this.state.contacts[contactId];
    const position = new THREE.Vector3(contact.location.x, contact.location.y, contact.location.z);
    this.setState({
      dragging: true,
      draggingContact: contact,
    });

    event.preventDefault();
    event.stopPropagation();

    const {
      camera,
    } = this.state;

    dragPlane.setFromNormalAndCoplanarPoint(backVector.clone()
      .applyQuaternion(camera.quaternion), intersection.point);

    this._offset = intersection.point.clone().sub(position);

    document.addEventListener('mouseup', this._onDocumentMouseUp);
    document.addEventListener('mousemove', this._onDocumentMouseMove);
  };

  _ref(mesh) {
    if (mesh){
      this.contacts.push(mesh);
      const {
        mouseInput,
      } = this.refs;
      mouseInput.restrictIntersections(this.contacts);
    }
  }
  render(){
    const {
      mouseInput,
      camera,

      hovering,
      dragging,
    } = this.state;
    const style = {};

    if (dragging) {
      style.cursor = 'move';
    } else if (hovering) {
      style.cursor = 'pointer';
    }
    this._cursor.hovering = hovering;
    this._cursor.dragging = dragging;

    const { width, height } = this.props.dimensions;
    //Make the circle geometry
    const geometry = new THREE.CircleGeometry( 1, 64 );
    // Remove center vertice
    geometry.vertices.shift();
    return (
      <div id="sensorGrid" ref="container" style={style}>

      {!this.props.data.loading &&
        <React3
        alpha
        antialias
        ref="renderer"
        mainCamera="camera"
        width={width}
        height={height}
        onAnimate={this._onAnimate}
        >
        <module
        ref="mouseInput"
        descriptor={MouseInput}
        />
        <scene ref="scene">
        <perspectiveCamera
        name="camera"
        fov={45}
        aspect={width/height}
        near={0.1}
        far={1000}
        ref="camera"
        lookAt={new THREE.Vector3(0,0,0)}
        position={this.cameraPosition}
        />
        <line name={`outer-circle`}>
        <geometry vertices={geometry.vertices} />
        <lineBasicMaterial color={0xffffff} transparent opacity={0.5} linewidth={1} />
        </line>
        <line name={`middle-circle`} scale={new THREE.Vector3(0.66,0.66,0.66)}>
        <geometry vertices={geometry.vertices} />
        <lineBasicMaterial color={0xffffff} transparent opacity={0.5} linewidth={1} />
        </line>
        <line name={`inner-circle`} scale={new THREE.Vector3(0.33,0.33,0.33)}>
        <geometry vertices={geometry.vertices} />
        <lineBasicMaterial color={0xffffff} transparent opacity={0.5} linewidth={1} />
        </line>
        <line name={`weapons-circle`} scale={new THREE.Vector3(0.33,0.33,0.33)}>
        <geometry vertices={geometry.vertices} />
        <lineBasicMaterial color={0xff0000} transparent opacity={this.state.weaponsRangeOpacity} linewidth={3} />
        </line>

        {
          Array(12).fill(1).map((a, i) => {
            const vertices = [];
            vertices.push(new THREE.Vector3(0, 0, 0));
            vertices.push(new THREE.Vector3(Math.cos(degtorad(i * 30 + 15)), Math.sin(degtorad(i * 30 + 15)), 0));
            return (<line name={`line-${i}`} key={`line-${i}`}>
              <geometry vertices={vertices} />
              <lineBasicMaterial color={0xffffff} transparent opacity={0.5} linewidth={1} />
              </line>
              )
          })
        }
        {
          !this.props.data.loading && Object.keys(this.state.contacts).map((id) => {
            const contact = this.state.contacts[id];
            // Sensor Contacts
            return (
              <object3D key={contact.id}>
              <mesh key={`${contact.id}-real`} name={contact.id} ref={this._ref.bind(this)}
              position={new THREE.Vector3(contact.destination.x, contact.destination.y, contact.destination.z)}
              scale={new THREE.Vector3(contact.size/20, contact.size/20, contact.size/20)}
              onMouseEnter={this._onHoverStart.bind(this)}
              onMouseLeave={this._onHoverEnd.bind(this)}
              onMouseDown={this._onDragStart.bind(this)}
              >
              <geometry vertices={contact.geometry.vertices} faces={contact.geometry.faces} />
              <meshBasicMaterial 
              color={0xffff00}
              side={THREE.DoubleSide}
              />
              </mesh>
              <mesh key={`${contact.id}-ghost`} name={contact.id} ref={this._ref.bind(this)}
              position={new THREE.Vector3(contact.location.x, contact.location.y, contact.location.z)}
              scale={new THREE.Vector3(contact.size/20, contact.size/20, contact.size/20)}
              onMouseEnter={this._onHoverStart.bind(this)}
              onMouseLeave={this._onHoverEnd.bind(this)}
              onMouseDown={this._onDragStart.bind(this)}
              >
              <geometry vertices={contact.geometry.vertices} faces={contact.geometry.faces} />
              <meshBasicMaterial 
              color={0xffff00}
              transparent={true}
              opacity={0.5}
              side={THREE.DoubleSide}
              />
              </mesh>
              </object3D>)
          })
        }
        </scene>
        </React3>
      }

      </div>)
  }
}

SensorGrid.defaultProps = {
  weaponsRangePulse: 0
};

const CONTACTS_QUERY = gql`
query Contacts($sensorsId: ID) {
  sensorContacts(sensorsId: $sensorsId) {
    id
    name
    size
    iconUrl
    pictureUrl
    speed 
    velocity {
      x
      y
      z
    }
    location {
      x
      y
      z
    }
    destination {
      x
      y
      z
    }
    infrared
    cloaked
    destroyed
  }
}`;
export default graphql(CONTACTS_QUERY, {
  options: ({sensor}) => ({variables:{sensorsId: sensor}})
})(withApollo(SensorGrid));
