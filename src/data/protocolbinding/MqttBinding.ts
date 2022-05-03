import { ConsumedThing } from "../thing/ConsumedThing";
import { TDActionAffordance, ThingTD } from "../thing/ThingTD";
import { MqttClient } from "./MqttClient";
import { splitTopic } from "./topics";

// MQTT protocol binding for consumed things
//
// Limitations: 
//   - Only top level form operations are considered.
//   - All operations use the MQTT protocol binding
// 
// Usage:
//  1. Instantiate with the list of known accounts
//  2. Bind on consume of a Thing. This:
//       1. determines operations for subscribe to events and props
//       2. if ops is mqv then lookup existing mqtt connection
//       3. if no connection exists, add a new connection
//       4. set operation hooks to consumed things  
//       5. subscribe to things/{thingID}/td|event messages
export class MqttBinding {
  private mqttClient: MqttClient
  private consumedThing: ConsumedThing

  constructor(mqttClient: MqttClient, consumedThing: ConsumedThing) {
    this.mqttClient = mqttClient
    this.consumedThing = consumedThing
    consumedThing.invokeActionHook = this.invokeAction
  }

  /** handle incoming event or property update message */
  handleEvent(topic: string, message: any) {
    let [thingID, topicType, subject] = splitTopic(topic)
    console.log("MqttBinding.handleEvent. topic=", topic)
    if (subject === "properties") {
      // handle properties
    } else {
      // handle event
    }
  }

  /** Consumed Thing invokes action using this protocol binding
   */
  invokeAction(name: string, params: any, actionAffordance: TDActionAffordance): void {
    let topic = "things/" + this.consumedThing.id + "/action/" + name
    let jsonPayload = JSON.stringify(params)
    this.mqttClient.publish(topic, jsonPayload)
  }

  /** writeProperties sends a requests to the ExposedThing to update property values.
   * This require the ExposedThing to be online.
   */
  writeProperties(props: Map<string, any>, td: ThingTD) {
    let topic = "things/" + this.consumedThing.id + "/write/properties"
    let jsonPayload = JSON.stringify(props)
    this.mqttClient.publish(topic, jsonPayload)
  }

  /** Subscribe to MQTT messages directed at the consumedThing
   */
  subscribe() {
    // receive events
    console.log("MqttBinding.subscribe to events from Thing %s", this.consumedThing.id)
    let topic = "things/" + this.consumedThing.id + "/event/#"
    this.mqttClient.subscribe(topic, 1, this.handleEvent)
  }

  /** Unsubscribe from all MQTT messages
   */
  unsubscribe() {
    console.log("MqttBinding.unsubscribe from events from Thing %s", this.consumedThing.id)
    throw ("unsubscribe not implemented")
  }


}