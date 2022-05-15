export const TOPIC_TYPE_EVENT = "event"
export const TOPIC_SUBJECT_PROPERTIES = "properties"

// export const TOPIC_ACTION = "local/things/{thingID}/action/{propName}"

export const TOPIC_TYPE_TD = "td"
export const SUB_TDS_TOPIC = "+/things/+/td"

export const SUB_EVENTS_TOPIC = "+/things/+/event"

export const SUB_PROPS_TOPIC = "+/things/+/event/properties"



// SplitTopic breaks a MQTT topic into thingID, topic type (td, event, action, property value)
// and optionally a subject like for example 'properties' in 'things/event/properties'
export function splitTopic(topic: string): [thingID: string, topicType: string, subject: string] {

  let parts = topic.split("/")
  let thingID = ""
  let topicType = ""
  let subject = ""

  if (parts.length < 2) {
    //err = errors.New("Topic too short")
    return ["", "", ""]
  }
  thingID = parts[1]
  if (parts.length > 2) {
    topicType = parts[2]
  }
  if (parts.length > 3) {
    subject = parts[3]
  }
  return [thingID, topicType, subject]
}