// Definition of the Thing's TD, Thing Description document
// This consists of the TD itself with properties

import { TDDataSchema } from "./TDDataSchema"
import { WoTDataType, WoTProperties, WoTRequired } from "./Vocabulary"

// ThingIDParts describes the parts of how a Thing ID is constructed
// This is specific to WoST as WoT doesn't standardize it.
class ThingIDParts {
  /** The zone a thing belongs to. Typically set by the publisher's configuration
   * The default is 'local' 
   */
  public zone: string = ""
  /** The deviceID of the publishing device, usually a gateway or service that manages multiple Things */
  public publisherID: string = ""
  /** The deviceID which is unique to a publisher, or globally unique if no publisher is specified */
  public deviceID: string = ""
  /** The type of device. Highly recommended for easy filtering */
  public deviceType: string = ""
}


// Form describing supported protocol binding operations
export class TDForm extends Object {
  public href: string = ""
  public op: string = ""
  public contentType: string = "application/json"
}

export class TDInteractionAffordance extends Object {
  // id uniquely identifies the affordance, be it event name, action name, etc
  // intended for display affordance instances in a table 
  id: string = ""

  // Used to indicate input, output, attribute. See vocab.WoSTAtType
  public atType: string = ""

  // Provides additional (human-readable) information based on a default language
  public description: string = ""
  // Provides additional nulti-language information
  public descriptions: string[] | undefined = undefined

  // Form hypermedia controls to describe how an operation can be performed
  // Forms are serializations of Protocol Bindings.
  public forms: TDForm[] = []

  // Human readable title in the default language
  public title: string = ""
  // Human readable titles in additional languages
  public titles: string[] | undefined = undefined

}

// Thing Description Action Affordance
export class TDActionAffordance extends TDInteractionAffordance {

  // action input parameters
  public inputs = new Map<string, {
    WoTDataType?: string,
    WoTProperties?: Map<string, string>,
    WoTRequired?: boolean,
  }>()
}

// Thing Description Event Affordance
export class TDEventAffordance extends TDInteractionAffordance {
  // Data schema of the event instance message, eg the event payload
  public data: TDDataSchema | undefined = undefined
}

// Thing Description property affordance
export class TDPropertyAffordance extends TDDataSchema {
  // property name is used for id to be able to pass properties as an array for presentation
  id: string = ""

  // Form hypermedia controls to describe how an operation can be performed
  // Forms are serializations of Protocol Bindings.
  public forms: TDForm[] = []

  // Optional nested properties. Map with PropertyAffordance
  public properties: Map<string, TDPropertyAffordance> | undefined = undefined
}


// Thing description document
export class ThingTD extends Object {
  /** Unique thing ID */
  public id: string = "";

  /** Computed from thing ID 
   * 
   */
  /** Device Publisher name from thing ID */
  public publisher: string = "";
  /** Device ID from thing ID */
  public deviceID: string = "";
  /** Device type from thing ID */
  public deviceType: string = "";
  /** Thing zone from thing ID */
  public zone: string = "";


  /** Document creation date in ISO8601 */
  public created: string = "";

  /** Document modification date in ISO8601 */
  public modified: string = "";

  /** Human description for a thing */
  public description: string = "";

  /** Human readable title for ui representation */
  public title: string = "";

  /** Type of thing defined in the vocabulary */
  public "@type": string = "";

  /**
   * Collection of properties of a thing 
   * @param key see WoST vocabulary PropNameXxx
   */
  public readonly properties: { [key: string]: TDPropertyAffordance } = {};

  /** Collection of actions of a thing */
  public readonly actions: { [key: string]: TDActionAffordance } = {};

  /** Collection of events (outputs) of a thing */
  public readonly events: { [key: string]: TDEventAffordance } = {};


  // Convert the actions map into an array for display
  public static GetThingActions = (td: ThingTD): Array<TDActionAffordance> => {
    let res = new Array<TDActionAffordance>()
    if (!!td && !!td.actions) {
      for (let [key, val] of Object.entries(td.actions)) {
        res.push(val)
      }
    }
    let isArray = res instanceof (Array)
    console.log("isArray:", isArray)
    return res
  }


  // Convert readonly properties into an array for display
  // Returns table of {key, tdproperty}
  // public static GetThingAttributes = (td: ThingTD): TDPropertyAffordance[] => {
  //   let res = Array<TDPropertyAffordance>()
  //   if (!!td && !!td.properties) {
  //     for (let [key, val] of Object.entries(td.properties)) {
  //       if (val.readOnly) {
  //         res.push(val)
  //       }
  //     }
  //   }
  //   return res
  // }
  // Convert readonly properties into an array for display
  // Returns table of {key, tdproperty}
  public static GetAttributeNames = (td: ThingTD): string[] => {
    let res = Array<string>()
    if (!!td && !!td.properties) {
      for (let [key, val] of Object.entries(td.properties)) {
        if (val.readOnly) {
          res.push(key)
        }
      }
    }
    return res
  }
  // // Convert the writable properties into an array for display
  // // Returns table of {key, tdproperty}
  // public static GetThingConfiguration = (td: ThingTD): TDPropertyAffordance[] => {
  //   let res = Array<TDPropertyAffordance>()
  //   if (!!td && !!td.properties) {
  //     for (let [key, val] of Object.entries(td.properties)) {
  //       if (!val.readOnly) {
  //         res.push(val)
  //       }
  //     }
  //   }
  //   return res
  // }

  // Returns names of configuration properties
  public static GetConfigurationNames = (td: ThingTD): string[] => {
    let res = Array<string>()
    if (!!td && !!td.properties) {
      for (let [key, val] of Object.entries(td.properties)) {
        if (!val.readOnly) {
          res.push(key)
        }
      }
    }
    return res
  }

  public static GetThingEvents = (td: ThingTD): Array<TDEventAffordance> => {
    let res = Array<TDEventAffordance>()
    if (!!td && !!td.events) {
      for (let [key, val] of Object.entries(td.events)) {
        res.push(val)
      }
    }
    return res
  }

  // Split the ID into its parts to determine zone, publisher, device ID and type
  public static GetThingIDParts(thingID: string): ThingIDParts {
    let parts = thingID.split(":")
    let tidp = new ThingIDParts()

    if ((parts.length < 2) || (parts[0].toLowerCase() != "urn")) {
      // not a conventional thing ID
      return tidp
    } else if (parts.length == 5) {
      // this is a full thingID  zone:publisher:deviceID:deviceType
      tidp.zone = parts[1]
      tidp.publisherID = parts[2]
      tidp.deviceID = parts[3]
      tidp.deviceType = parts[4]
    } else if (parts.length == 4) {
      // this is a partial thingID  zone:deviceID:deviceType
      tidp.zone = parts[1]
      tidp.deviceID = parts[2]
      tidp.deviceType = parts[3]
    } else if (parts.length == 3) {
      // this is a partial thingID  deviceID:deviceType
      tidp.deviceID = parts[1]
      tidp.deviceType = parts[2]
    } else if (parts.length == 2) {
      // the thingID is the deviceID
      tidp.deviceID = parts[1]
    }
    return tidp
  }


  // Return the TD property with the given ID
  public static GetThingProperty = (td: ThingTD, propID: string): TDPropertyAffordance | undefined => {
    let tdProp: TDPropertyAffordance | undefined = undefined
    if (!!td && !!td.properties) {
      tdProp = td.properties[propID]
    }
    return tdProp
  }

}
