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

  /** Get updated timestamp in short locale text format: day. month hh:mm
   */
  getUpdatedShortText(): string {
    // https://stackoverflow.com/questions/2388115/get-locale-short-date-format-using-javascript
    let shortText = this.updated.toLocaleString({
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "numeric"
    })
    return shortText
  }
}