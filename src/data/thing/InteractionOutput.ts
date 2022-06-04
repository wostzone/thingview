import { DateTime } from "luxon"
import { TDDataSchema } from "./ThingTD"

export class InteractionOutput extends Object {

  /** Data schema output, eg the TD property affordance */
  schema: & TDDataSchema | undefined = undefined

  // The JSON encoded value of the output
  // jsonEncoded: string = ""

  /** The decoded value of the output */
  value: any = undefined

  /** The last updated timestamp of the value */
  updated: DateTime = DateTime.now()

  /** Create a new interaction output with value and update timestamp
   */
  constructor(value: any, updated?: DateTime, schema?: TDDataSchema) {
    super()
    this.schema = schema
    this.value = value
    if (updated) {
      this.updated = updated
    } 
  }

  /** Return the value as text for presentation including the unit 
   * This is a convenience function
   */
  get asText(): string {
    let valueStr = this.value + (this.schema?.unit ? " " + this.schema.unit : "")
    return valueStr
  }

  /** Return the value as boolean for presentation 
  * This is a convenience function
  */
  get asBoolean(): boolean {
    if (this.value == "0" || this.value == "false") {
      return false
    }
    else if (this.value == "1" || this.value == "true") {
      return true
    }
    return !!this.value
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

  /** Get updated timestamp in short locale text format: day. month hh:mm
   */
  getUpdatedShortText(): string {
    // https://stackoverflow.com/questions/2388115/get-locale-short-date-format-using-javascript
    let shortText = this.updated?.toLocaleString({
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "numeric"
    })
    return shortText
  }
}