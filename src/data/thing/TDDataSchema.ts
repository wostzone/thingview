
export class TDDataSchema extends Object {
  // Used to indicate input, output, attribute. See vocab.WoSTAtType
  // public atType string = "" `json:"@type"` 

  // Provides a default value of any type as per data schema
  public default: string = ""

  // Provides additional (human-readable) information based on a default language
  public description: string = ""
  // Provides additional nulti-language information
  public descriptions: string[] | undefined = undefined

  // Restricted set of values provided as an array.
  //  for example: ["option1", "option2"]
  public enum: string[] = []

  // Boolean value to indicate whether a property interaction / value is read-only (=true) or not (=false)
  // the value true implies read-only.
  public readOnly: boolean = true

  // Human readable title in the default language
  public title: string = ""
  // Human readable titles in additional languages
  public titles: string[] | undefined = undefined

  // Type provides JSON based data type,  one of WoTDataTypeNumber, ...object, array, string, integer, boolean or null
  public type: string = ""

  // See vocab UnitNameXyz for units in the WoST vocabulary
  public unit: string | undefined = undefined

}