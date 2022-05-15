# Protocol Bindings 

This document describes how protocol bindings operate in the WoST Hub.

## Introduction

[Protocol Bindings](https://www.w3.org/TR/wot-architecture/#sec-protocol-bindings) map WoT defined interactions to concrete messages of a specific protocol.

The WoT standard describes how protocol bindings are defined and what interactions are supported. Thing devices (exposed things) publish their TD (thing description) document containing Forms that describe supported operations and the protocol to use to execute the interaction.

### Challenges

WoT protocol bindings provide a generic method to describe how to 'consumed things' (the client) communicate with 'exposed things' (the device or its proxy). 

Each Thing has a TD - Thing Description - document that defines how to interact with the Thing using properties, events, and actions. A 'forms' section describes the controls on how to perform operations. Protocol bindings use the 'forms' section to determine what communication method to use for the operation.

Forms can be defined on the TD top level and on each interaction level for properties, actions, and events. Properties can themselves have nested properties with additional Forms. 

Multiple Forms with the same operation but different protocols can be included to allow multiple interaction methods to be used.


Some of the challenges that the approach brings are:

1. For each interaction (property, event, action) consumers must traverse the hierarchy to determine the form to be used that defines the operation.

2. When multiple protocols are defined for the same operation, a decision for which protocol to use must be made.

3. A connection must be established to the endpoint before the operation can take place. Connections must be pooled for acceptable performance. For HTTP this is less of an issue (apart from certificate/trust/auth) but for protocols like mqtt these connections must be managed separately.

4. The credentials to establish a connection must be known before a connection can be established. How to determine which credentials are to be used? How to know which certificates to trust?

5. If credentials are not available, the operation should not be available to consumers. How to know this ahead of time?

6. How to consumers manage access control if each device implements their own method?


### The WoST Hub Approach

WoST uses the Hub-and-spokes approach and acts as an intermediary between devices and consumers. All interactions take place using a single message bus protocol, regardless of the protocols defined by the individual devices.  

The Hub uses plugins to bridge between the WoT compatible message bus and 3rd party protocols. 

This approach offers the following benefits:
* Compatible devices and consumers only need to support a single message bus protocol.
  1. Simplified consumer implementation as only a single message bus connection is needed to interact with all devices. Operations only need the message bus address. 
* Compatible devices do not run servers which in turn:
  1. Greatly improves the security of the device as there are no open ports to hack into.
  2. Simplifies implementation as authentication and authorization are not handled by the device.
  3. Reduces resource needs such as memory and CPU that would otherwise be needed to run a server.
  4. Reduces the need for frequent firmware updates.
* Consumers can interact with all devices via a single message bus connection.
* Authentication and Authorization is uniform for all devices as it is handled by the Hub.

This approach put the burden of implementing multiple protocols on Hub plugins rather than on the consumer. The consumer only need to connects to the Hub services and message bus. As an added benefit, centralized management of credentials and group access control is used rather than manage credentials for each WoT device separately.

### Message Bus Protocol

Unfortunately the WoT has not yet defined the protocol bindings for a message bus protocol. WoST thefore defines this based on some sparse examples from the documentation that refer to MQTT. 

Message bus addresses for the various operations are standardized. To avoid collisions an address MUST include the thingID. Message bus addresses:

| Usage | by | topic |
|-------------------------|----------------|---|
| Publish TD              | Exposed Thing  | PUB local/things/{thingID}/td |
| Read updates to TD      | Consumed Thing | SUB +/things/{thingID}/td |
| Send an event           | Exposed Thing  | PUB local/things/{thingID}/event/{eventName} |
| op:subscribeevent       | Consumed Thing | SUB +/things/{thingID}/event/{eventName} |
| op:subscribeallevents   | Consumed Thing | SUB +/things/{thingID}/event/+ |
| op:invokeaction         | Consumed Thing | PUB local/things/{thingID}/action/{actionName} |
| op:writemultipleproperty | Consumed Thing | PUB local/things/{thingID}/action/{propertyName} |
| observemultipleproperties | Consumed Thing | SUB +/things/{thingID}/event/properties |


Note:
* the '+' prefix to the address ignores the zone prefix. See the section on bridging hubs.
* a reserved eventName 'properties' is used to notify consumers of changes to multiple property values.
* actions, events and properties share the same namespace. For example, an action, event and property named 'switch' refer to operations of the same device. The action controls the switch, the event provides status updates and property show the current status of the switch.


Not all WoT operations are applicable to WoST. Notably:

| operation | comment |
|---|---|
| readproperty (1)         | property values are published through events |
| readallproperties (1)    | property values are published through events |
| readmultipleproperties(1)| property values are published through events |
| writemultipleproperty    | use writeproperty instead |
| writeallproperties       | use writemultipleproperties instead |
| (un)observeproperty      | use observemultipleproperties |
| (un)observeallproperties | use observemultipleproperties |
| queryactions             | action updates are send as an event with the actionName |
| queryallactions          | action updates are send as events |
| cancelaction             | tbd. need use-cases for long lived actions| 

* (1) Reading of properties is done via the Directory Service using the values endpoint. Updates to property values are received as events via the message bus. The motivation is to reduce the load on devices and other consumers that would occur if each consumer asks to read all properties of all devices after it connects. This can lead to a multiplication DOS attack by an a bad actor.



## Bridging Hubs

In order to bridge multiple Hubs to create a mesh network of Hubs with each its own Things, Things from different Hubs must be identifyable and addressable.

The topic therefore includes a zone ID. Local things are always published with the local prefix. A bridge replaces the local zone with zone of the bridge. 

> A local publication of a TD: local/things/thingID1/td

> A publication of a TD from zone 1: zone1/things/thingID2/td


