import { DateTime } from "luxon"
import { TDDataSchema } from "./TDDataSchema"


export default class InteractionOutput extends Object {

  /** Data schema output, eg the TD property affordance */
  schema: & TDDataSchema | undefined = undefined

  // The JSON encoded value of the output
  // jsonEncoded: string = ""

  /** The decoded value of the output */
  value: any = undefined

  /** The last updated timestamp of the value */
  updated: DateTime = DateTime.now()

  /** Create a new interaction output with value and timestamp 
   */
  constructor(value: any, updated?: DateTime, schema?: TDDataSchema) {
    super()
    this.schema = schema
    this.value = value
    if (updated) {
      this.updated = updated
    }
  }

  /** Update the value of the interaction output 
   */
  updateValue(value: any, updated?: DateTime) {
    this.value = value
    if (updated) {
      this.updated = updated
    } else {
      this.updated = DateTime.now()
    }
  }
}