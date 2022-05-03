// A consumed thing hold Thing value and definition
import { cloneDeep as _cloneDeep, extend as _extend } from 'lodash-es'
import { TDActionAffordance, ThingTD } from "../thing/ThingTD";
import InteractionOutput from "./InteractionOutput";
import { DateTime } from "luxon";


class Subscription {
  type: "property" | "event" | "null"
  // event or property name
  name: string
  // form associated with the subscription 
  // TBD
  // The ConsumedThing associated with the subscription
  thing: ConsumedThing

  constructor(type: "property" | "event", name: string, thing: ConsumedThing) {
    this.type = type
    this.name = name
    this.thing = thing
  }
}

/**
 * ConsumedThing is a remote instance of a Thing device
// Thing consumers can use this API to subscribe to events and actions.
//
// This loosely follows the WoT scripting API for ConsumedThing as described at
// https://www.w3.org/TR/wot-scripting-api/#the-consumedthing-interface
 */
export class ConsumedThing {
  // Thing ID of Consumed Thing. 
  id: string

  // Internal slot with Thing Description document this Thing exposes
  td: ThingTD

  // internal slot for Subscriptions by event name
  private eventSubscriptions: Map<string, Subscription>

  // propertyMap holds received property values
  private propertyMap: Map<string, InteractionOutput>

  // eventMap holds received event values
  private eventMap: Map<string, InteractionOutput>

  // Hook to invoke action via the protocol binding. 
  // This can be set to a protocol binding by the protocol factory
  // By default this throws an error
  invokeActionHook = (name: string, params: any, actionAffordance: TDActionAffordance): void => { throw Error("Actions are not supported on this thing") }// = undefined

  // Hook to write properties by the protocol binding
  // This can be set to a protocol binding by the protocol factory
  // By default this throws an error
  writePropertiesHook = (props: Map<string, any>, td: ThingTD) => { throw Error("Writing properties is not supported on this thing") }// = undefined

  // Create an instance of a ConsumedThing and attach to the protocol binding
  // if not protocol binding is provided the consumed thing can still be used
  // to simply hold values updated elsewehere.
  constructor(td: ThingTD) {
    this.id = td.id
    this.td = td
    this.eventSubscriptions = new Map<string, Subscription>()
    // event store with most recent event values
    this.eventMap = new Map<string, InteractionOutput>()
    // property store with most recent property values
    this.propertyMap = new Map<string, InteractionOutput>()
  }

  // Returns the internal slot of the ConsumedThing object that represents the 
  // Thing Description of the ConsumedThing. Applications may consult the Thing
  // metadata stored in [[td]] in order to introspect its capabilities before 
  // interacting with it. 
  getThingDescription(): ThingTD {
    return this.td
  }

  /** Return the value of a property as text including unit or "n/a" if property not found.
   * This is a convenience function
   */
  getPropertyValueText(propName: string): [value: string, found: boolean] {
    let propIO = this.propertyMap.get(propName)
    if (!propIO) {
      return ["n/a", false]
    }
    // FIXME: use the string representation of value
    let valueStr = propIO.value + (propIO.schema?.unit ? " " + propIO.schema.unit : "")
    return [valueStr, true]
  }

  // handleEvent handles an event received by the protocol binding
  // @param eventName name of the event 
  // @param eventValue the JSON decoded value provided with the event
  // @oaram updated the timestamp of the event or undefined for 'now'
  handleEvent(eventName: string, eventValue: any, updated?: DateTime): void {
    // TODO: schema validation
    let io = this.eventMap.get(eventName)
    if (!io) {
      let eventAffordance = this.td.events[eventName]
      io = new InteractionOutput(eventValue, updated, eventAffordance.data)
      this.eventMap.set(eventName, io)
    }
    io.updateValue(eventValue, updated)

    // last, notify subscriber
    let subscription = this.eventSubscriptions.get(eventName)
    if (subscription) {
      // subscription.listener(eventName, eventValue, this)
    }
  }


  // handlePropertyChange handles a change to property value as received by
  // the protocol binding. 
  // This updates the cached property value and notifies subscribers.
  //
  // @param propName name of the property 
  // @param propValue the JSON decoded new value of the property
  // @oaram updated the timestamp of the value update or undefined for 'now'
  handlePropertyChange(propName: string, propValue: any, updated?: DateTime): void {
    // TODO: schema validation
    let io = this.propertyMap.get(propName)
    if (!io) {
      let propertyAffordance = this.td.properties[propName]
      io = new InteractionOutput(propValue, updated, propertyAffordance)
      this.propertyMap.set(propName, io)
    }
    io.updateValue(propValue, updated)
  }

  // invokeAction makes a request for invoking an Action and returns once the
  // request is submitted.
  // This fails if the TD does not define this action
  //
  // This will be handed to the hook set by the property binding 
  //
  // Takes as arguments actionName, optionally action data as defined in the TD.
  // Returns a promise that completes when the action request has been sent.
  async invokeAction(actionName: string, params: any) {
    let actionAffordance = this.td.actions[actionName]
    if (!actionAffordance) {
      let err = new Error("can't invoke action '" + actionName +
        "'. Action is not defined in TD '" + this.id + "'")
      console.error(err)
      throw err
    }
    return this.invokeActionHook(actionName, params, actionAffordance)
  }

  // Get cached properties of the Thing
  get properties(): Map<string, InteractionOutput> {
    return this.propertyMap
  }


  // Reads all properties of the Thing with one request
  // It returns a Promise that resolves with a PropertyReadMap object that maps keys from Property 
  // names to values returned by this algorithm.
  async readAllProperties() {
    return this.propertyMap
  }

  // stop delivering notifications to subscribers
  async stop() {
  }


  // writeProperty submit a request to change a property value.
  // Takes as arguments propertyName and value, and sends a property update to the exposedThing that in turn
  // updates the actual device.
  //
  // This does not update the property immediately. It is up to the exposedThing to perform necessary validation
  // and notify subscribers with an event after the change has been applied.
  //
  // There is no error feedback in case the request cannot be handled. The requester will only receive a
  // property change event when the request has completed successfully. Failure to complete the request can be caused
  // by an invalid value or if the IoT device is not in a state to accept changes.
  //
  // This returns a promise that completes once the request is submitted, or throws an 
  // error if fails.
  async writeProperty(propName: string, value: any) {
    let propMap = new Map<string, any>()
    propMap.set(propName, value)
    return this.WriteMultipleProperties(propMap)
  }

  // WriteMultipleProperties writes multiple property values.
  // Takes as arguments properties - as a map keys being Property names and values as Property values.
  // where values can be native values.
  //
  // This does not update the property immediately. It is up to the exposedThing to perform necessary validation
  // and notify subscribers with an event after the change has been applied.
  //
  // There is no error feedback in case the request cannot be handled. The requester will only receive a
  // property change event when the request has completed successfully. Failure to complete the request can be caused
  // by an invalid value or if the IoT device is not in a state to accept changes.
  //
  // This returns a promise that completes once the request is submitted, or throws an 
  // error if fails.
  async WriteMultipleProperties(properties: Map<string, any>) {
    return this.writePropertiesHook(properties, this.td)
  }
}

