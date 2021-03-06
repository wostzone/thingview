// A consumed thing hold Thing value and definition
import { cloneDeep as _cloneDeep, extend as _extend } from 'lodash-es'
import { TDActionAffordance, ThingTD } from "../thing/ThingTD";
import { InteractionOutput } from "./InteractionOutput";
import { DateTime } from "luxon";


class Subscription {
  type: "property" | "event" | "null"
  // event or property name
  name: string
  // subscription handler 
  listener: (name: string, io: InteractionOutput) => void
  // form associated with the subscription 
  // TBD
  // The ConsumedThing associated with the subscription
  thing: ConsumedThing

  // Create a subscription instance for a property or event notification
  constructor(type: "property" | "event",
    name: string,
    thing: & ConsumedThing,
    listener: (name: string, io: InteractionOutput) => void) {

    this.type = type
    this.name = name
    this.listener = listener
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

  // flag whether the thing has been loaded with property values
  private _hasProperties: boolean

  // internal slot for subscriptions by property name
  private activeObservations: Map<string, Subscription>

  // propertyMap holds received property values
  private propertyMap: Map<string, InteractionOutput>

  // eventMap holds received event values
  private eventMap: Map<string, InteractionOutput>

  // prevent multiple read properties
  private _readInProgress = false

  /** Hook to invoke action via the protocol binding.
   * This can be set to a protocol binding by the protocol factory
   * By default this throws an error
   *
   * @param cThing: the thing whose action to invoke
   * @param name: name of the action to invoke
   * @param params: the data of the action as defined in the action affordance schema
   * @returns a promise that resolves when the request for action has been sent
   */
  invokeActionHook = async (cThing: ConsumedThing, name: string, params: any): Promise<void> => { throw Error("Actions are not supported on this thing") }// = undefined

  /** Hook to write properties via the protocol binding
   * This can be set to a protocol binding by the protocol factory.
   * By default this throws an error.
   *
   * @param cThing: the thing to write to
   * @param props: holds the name-value pair where value is the text representation to write.
   * @returns a promise that resolves when the request to write properties has been sent
   */
  writePropertyHook = async (cThing: ConsumedThing, propName: string, propValue: any): Promise<void> => { throw Error("Writing properties is not supported on this thing") }// = undefined

  /** Hook to refresh the cashed property values via the protocol binding.
   * This can be set to a protocol binding by the protocol factory
   * By default this throws an error
   * 
   * @param cThing: the thing whose properties to refresh
   * @returns a promise that resolves when the request to read properties has been sent
   */
  readPropertiesHook = async (cThing: ConsumedThing): Promise<Object | undefined> => { throw Error("Reading properties is not supported on this thing") }// = undefined

  // Create an instance of a ConsumedThing and attach to the protocol binding
  // if not protocol binding is provided the consumed thing can still be used
  // to simply hold values updated elsewehere.
  constructor(td: ThingTD) {
    this.id = td.id
    this.td = td
    this._hasProperties = false
    this.eventMap = new Map<string, InteractionOutput>()
    this.eventSubscriptions = new Map<string, Subscription>()
    this.propertyMap = new Map<string, InteractionOutput>()
    this.activeObservations = new Map<string, Subscription>()

    // ensure all events have an interaction output
    for (const eventName in td.events) {
      let eventAffordance = td.events[eventName]
      let io = new InteractionOutput(
        "n/a", DateTime.invalid("value not set"), eventAffordance.data)
      this.eventMap.set(eventName, io)
    }

    // ensure all properties have an interaction output
    for (const propName in td.properties) {
      let propertyAffordance = td.properties[propName]
      let io = new InteractionOutput(
        "n/a", DateTime.invalid("value not set"), propertyAffordance)
      this.propertyMap.set(propName, io)
    }
  }

  /** Get cached events of the Thing 
   */
  get events(): Map<string, InteractionOutput> {
    return this.eventMap
  }

  /** Status of cThing. 
   * True if readproperties has been called successfuly 
   */
  get hasProperties(): boolean {
    return this._hasProperties
  }

  /** Returns the internal slot of the ConsumedThing object that represents the
   * Thing Description of the ConsumedThing. Applications may consult the Thing
   * metadata stored in [[td]] in order to introspect its capabilities before 
   * interacting with it. 
   */
  getThingDescription(): ThingTD {
    return this.td
  }

  /** Return the value of a property as text including unit or "n/a" if property not found.
   * This is a convenience function
   */
  // getPropertyValueText(propName: string): [value: string, found: boolean] {
  //   let propIO = this.propertyMap.get(propName)
  //   if (!propIO) {
  //     return ["n/a", false]
  //   }
  //   // FIXME: use the string representation of value
  //   let valueStr = propIO.value + (propIO.schema?.unit ? " " + propIO.schema.unit : "")
  //   return [valueStr, true]
  // }

  /** handleEvent handles an event received by the protocol binding
   * This updates the cached event value and notifies the event subscriber, if any.
   *  
   * @param eventName name of the event 
   * @param eventValue the JSON decoded value provided with the event
   * @param updated the timestamp of the event or undefined for 'now'
   */
  handleEvent(eventName: string, eventValue: any, updated?: DateTime): void {
    // TODO: schema validation
    let io = this.eventMap.get(eventName)
    if (!io) {
      // not a known event
      return
    }
    io.updateValue(eventValue, updated)

    // last, notify subscriber
    let subscription = this.eventSubscriptions.get(eventName)
    if (subscription) {
      subscription.listener(eventName, io)
    }
  }


  /** handlePropertyChange handles a change to property value as received by
   * the protocol binding. 
   * This updates the cached property value and notifies the property observer, if any.
   * 
   * @param propName name of the property 
   * @param propValue the JSON decoded new value of the property
   * @param updated the timestamp of the value update or undefined for 'now'
   */
  handlePropertyChange(propName: string, propValue: any, updated?: DateTime): void {
    // TODO: schema validation
    let io = this.propertyMap.get(propName)
    if (!io) {
      // not a known property or event
      return
    }
    io.updateValue(propValue, updated)

    // last, notify observer
    let subscription = this.activeObservations.get(propName)
    if (subscription) {
      subscription.listener(propName, io)
    }
  }

  /** invokeAction makes a request for invoking an Action and returns once the
   * request is submitted.
   * This fails if the TD does not define this action
   *
   * This will be handed to the hook set by the property binding 
   *
   * Takes as arguments actionName, optionally action data as defined in the TD.
   * Returns a promise that completes when the action request has been sent.
   */
  async invokeAction(actionName: string, params: any) {
    console.log("ConsumedThing.invokeAction: name=%s, params=%s", actionName, params)
    let actionAffordance = this.td.actions[actionName]
    if (!actionAffordance) {
      let err = new Error("can't invoke action '" + actionName +
        "'. Action is not defined in TD '" + this.id + "'")
      console.error(err)
      throw err
    }
    return this.invokeActionHook(this, actionName, params)
  }

  // ObserveProperty makes a request for Property value change notifications.
  // Takes as arguments propertyName and a handler.
  //
  // returns an error if an active observation already exists
  observeProperty(propName: string, listener: (propName: string, data: InteractionOutput) => void) {
    // Only a single subscriber is allowed
    let subscription = this.activeObservations.get(propName)
    if (subscription) {
      console.error("A property subscription for '%s' already exists", propName)
      return new Error("NotAllowed")
    }
    if (!listener) {
      console.error("Null listener")
      return new TypeError("listener is null")
    }

    subscription = new Subscription("property", propName, this, listener)
    this.activeObservations.set(propName, subscription)
  }

  /** Get cached property values of the Thing
   */
  get properties(): Map<string, InteractionOutput> {
    return this.propertyMap
  }


  /** Reads all properties of the Thing with one request
   * It returns a Promise that resolves with a PropertyReadMap object that
   * maps keys from Property names to values returned by this algorithm.
   * If a read is already in-progress then do nothing.
   */
  async readAllProperties() {
    if (this._readInProgress) {
      return
    }
    console.warn("Consumed thing '%s' has no properties, reading again", this.id)
    this._readInProgress = true
    return this.readPropertiesHook(this)
      .then((propMap: Object | undefined) => {
        this._hasProperties = true
        if (propMap) {
          Object.entries(propMap).forEach(([propName, val]) => {
            let updated = DateTime.fromISO(val.updated)
            this.handlePropertyChange(propName, val.value, updated)
            // some properties can also have an event associated with them
            if (this.eventMap.has(propName)) {
              this.handleEvent(propName, val.value, updated)
            }
          })
        }
      })
      .catch((err: Error) => {
        console.warn("readAllProperties. Failed: %s", err.message)
        // throw (err)
      })
      .finally(() => {
        this._readInProgress = false
      })
  }

  /** stop delivering notifications to subscribers */
  async stop() {
  }


  /** writeProperty submits a request to change a property value.
   * Takes as arguments propertyName and value, and sends a property update to the exposedThing that in turn
   * updates the actual device.
   *
   * This does not update the property immediately. It is up to the exposedThing to perform necessary validation
   * and notify subscribers with an event after the change has been applied.
   *
   * There is no error feedback in case the request cannot be handled. The requester will only receive a
   * property change event when the request has completed successfully. Failure to complete the request can be caused
   * by an invalid value or if the IoT device is not in a state to accept changes.
   * 
   * This returns a promise that completes once the request is submitted, or throws an 
   * error if fails.
   */
  async writeProperty(propName: string, value: any) {
    let props = {}
    props[propName] = value
    return this.writePropertyHook(this, propName, value)
  }

  /** WriteMultipleProperties writes multiple property values.
   * Takes as arguments properties - an object containing property name-value pairs.
   * where values can be native values.
   * 
   * This does not update the property immediately. It is up to the exposedThing to perform necessary validation
   * and notify subscribers with an event after the change has been applied.
   * 
   * There is no error feedback in case the request cannot be handled. The requester will only receive a
   * property change event when the request has completed successfully. Failure to complete the request can be caused
   * by an invalid value or if the IoT device is not in a state to accept changes.
   * 
   * This returns a promise that completes once the request is submitted, or throws an 
   * error if fails.
   */
  async writeMultipleProperties(properties: Object) {
    for (let propName in Object.entries(properties)) {
      let propValue = properties[propName]
      return this.writePropertyHook(this, propName, propValue)
    }
  }
}

