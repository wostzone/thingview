// The Thing store holds the discovered Thing TD's 
// This is updated by the directory client (see DirectoryClient) and by MQTT messages
import { reactive, readonly } from "vue";
import { cloneDeep as _cloneDeep, extend as _extend } from 'lodash-es'
import { ThingTD } from "./ThingTD";


// ThingStore for storing TD's and consumed things
export class ThingStore {
  // Index of ThingTD documents by thing ID
  private tdMap: Map<string, ThingTD>

  // Create the ThingStore for managing TD's and consumed things 
  // Use SetProtocolBinding to set a handler for binding consumed things
  // to an appropriate protocol binding.
  constructor() {
    this.tdMap = reactive(new Map<string, ThingTD>())
    // this.ctMap = reactive(new Map<string, ConsumedThing>())
  }


  // Add or replace a new discovered thing to the collection
  addTD(td: ThingTD): void {
    this.update(td)
  }

  // Return all TD's that have been discovered 
  get all(): ThingTD[] {
    let allTDs = new Array()
    for (let td of this.tdMap.values()) {
      allTDs.push(readonly(td))
    }
    return allTDs
  }

  // Return a sorted list of all Thing IDs 
  // Intended for querying more Thing info using limit and offset
  get allIDs(): string[] {
    let idList = new Array()
    for (let key of this.tdMap.keys()) {
      idList.push(key)
    }
    idList.sort()
    return idList
  }

  // Load the thing store cached data (if any)
  load() {

  }

  // Get the ThingTD with the given id
  getThingTDById(id: string): ThingTD | undefined {
    let td = this.tdMap.get(id)
    if (!td) {
      return undefined
    }
    return readonly(td) as ThingTD
  }


  // Update/replace a new discovered ThingTD in the collection
  // This will do some cleanup on the TD to ensure the ID's are in place
  update(td: ThingTD): void {
    let existing = this.tdMap.get(td.id)

    if (!existing) {
      // This is a new TD
      let newTD = _cloneDeep(td)
      this.tdMap.set(newTD.id, newTD)
    } else {
      // update existing TD
      _extend(existing, td)
    }
    // augment the properties, events with IDs
    if (td.properties) {
      for (let [key, val] of Object.entries(td.properties)) {
        val.id = key
      }
    }
    if (td.actions) {
      for (let [key, val] of Object.entries(td.actions)) {
        val.id = key
      }
    }
    if (td.events) {
      for (let [key, val] of Object.entries(td.events)) {
        val.id = key
      }
    }
  }
}
// Singleton instance. Call SetProtocolBinding on first use.
const thingStore = new ThingStore()

export { thingStore }
