import { ConsumedThing } from "../thing/ConsumedThing";
import { TDActionAffordance, ThingTD } from "../thing/ThingTD";
import { MqttClient } from "./MqttClient";
import { splitTopic, TOPIC_SUBJECT_PROPERTIES, TOPIC_TYPE_EVENT } from "./topics";

/** MQTT protocol binding for consumed things
 *
 * Limitations: 
 * - Only top level form operations are considered.
 * - All operations use the MQTT protocol binding
 * - ReadProperties is not supported
 *
 * Usage:
 *  1. Instantiate with the list of known accounts
 *  2. Bind on consume of a Thing. This:
 *     1. determines operations for subscribe to events and props
 *     2. if ops is mqv then lookup existing mqtt connection
 *     3. if no connection exists, add a new connection
 *     4. set operation hooks to consumed things  
 *     5. subscribe to things/{thingID}/td|event messages
 */
export class MqttBinding {
  private mqttClient: MqttClient
  private cThing: ConsumedThing

  constructor(mqttClient: MqttClient, consumedThing: ConsumedThing) {
    this.mqttClient = mqttClient
    this.cThing = consumedThing
    consumedThing.invokeActionHook = this.invokeAction.bind(this)
    consumedThing.writePropertyHook = this.writeProperty.bind(this)
  }

  /** handle incoming event or property update message */
  handleEvent(eventName: string, message: any) {
    console.log("MqttBinding.handleEvent. event=", eventName)
    let params = JSON.parse(message)

    if (eventName == TOPIC_SUBJECT_PROPERTIES) {
      for (let [propName, value] of Object.entries(params)) {
        this.cThing.handlePropertyChange(propName, value)
      }
    } else {
      this.cThing.handleEvent(eventName, params)
    }
  }

  /** Consumed Thing invokes action using this protocol binding
   */
  async invokeAction(cThing: ConsumedThing, name: string, params: {}) {
    console.log("MqttBinding.invokeAction '%s' on Thing %s", name, this.cThing.id)
    let topic = "things/" + this.cThing.id + "/action/" + name
    let jsonPayload = JSON.stringify(params)
    return this.mqttClient.publishAsync(topic, jsonPayload)
  }

  /** writeProperty sends an action to the ExposedThing to update a property value.
   * This require the ExposedThing to be online.
   * 
   * @param cThing: The consumed thing whose property to write
   * @param propName: name of the property to write
   * @param propValue: value of the property to write
   */
  async writeProperty(cThing: ConsumedThing, propName: string, propValue: any) {
    console.log("MqttBinding.writeProperty '%s' to Thing %s", propName, this.cThing.id)
    let topic = "things/" + this.cThing.id + "/action/" + propName
    let jsonPayload = JSON.stringify(propValue)
    return this.mqttClient.publish(topic, jsonPayload)
  }

  // /**
  //  * Read properties
  //  * This protocol binding does not implement this method
  //  */
  // async readProperties(cThing: ConsumedThing) {
  //   throw ("The MqttBinding does not implement readProperties")
  // }

  /** Subscribe to MQTT messages directed at the consumedThing
   */
  subscribe() {
    // receive events
    console.log("MqttBinding.subscribe to events from Thing %s", this.cThing.id)
    let topic = "things/" + this.cThing.id + "/event/#"
    this.mqttClient.subscribe(topic, 1, this.handleEvent)
  }

  /** Unsubscribe from all MQTT messages
   */
  unsubscribe() {
    console.log("MqttBinding.unsubscribe from events from Thing %s", this.cThing.id)
    throw ("unsubscribe not implemented")
  }


}