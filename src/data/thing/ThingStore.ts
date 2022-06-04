/** The Thing store holds the discovered Thing TD's 
 * Instances are managed by the ThingFactory
 */
import { reactive, readonly } from "vue";
import { cloneDeep as _cloneDeep, extend as _extend } from 'lodash-es'
import { ThingTD } from "./ThingTD";

// ThingStore for storing TD's and consumed things
export class ThingStore {
  // Index of ThingTD documents by thing ID
  private _tdMap: Map<string, ThingTD>

  // Account whose TDs are held here
  private _accountID: string = ""

  // Create the ThingStore for managing TD's and consumed things 
  // Use SetProtocolBinding to set a handler for binding consumed things
  // to an appropriate protocol binding.
  constructor() {
    this._tdMap = reactive(new Map<string, ThingTD>())
  }


  // Add or replace a new discovered thing to the collection
  addTD(td: ThingTD): ThingTD {
    this.update(td)
    return td
  }

  // Return all TD's that have been discovered 
  get all(): ThingTD[] {
    let allTDs = new Array()
    for (let td of this._tdMap.values()) {
      allTDs.push(readonly(td))
    }
    return allTDs
  }

  // Return a sorted list of all Thing IDs 
  // Intended for querying more Thing info using limit and offset
  get allIDs(): string[] {
    let idList = new Array()
    for (let key of this._tdMap.keys()) {
      idList.push(key)
    }
    idList.sort()
    return idList
  }

  /** Load the thing store cached data (if any)
   * TODO: not implemented
   * @param accountID: ID whose Things to restore
   */
  load(accountID: string) {
    this._accountID = accountID
    // todo
  }

  // Get the ThingTD with the given id
  getThingTDById(id: string): ThingTD | undefined {
    let td = this._tdMap.get(id)
    if (!td) {
      return undefined
    }
    return readonly(td) as ThingTD
  }

  /** save the thing store cached data (if any)
   * TODO: not implemented
   */
  save() {
    // todo
  }


  // Update/replace a new discovered ThingTD in the collection
  // This will do some cleanup on the TD to ensure that properties, actions, and events
  // include their own name.
  update(td: ThingTD): void {
    let existing = this._tdMap.get(td.id)

    if (existing) {
      // update existing TD
      _extend(existing, td)
    } else {
      // This is a new TD
      let newTD = _cloneDeep(td)
      this._tdMap.set(newTD.id, newTD)
    }
    // Retrieve the reactive instance which is a copy of the original.
    // Satisfy the compiler. It doesn't know that tdMap was just set 
    let td2 = this._tdMap.get(td.id)
    if (!td2) {
      return
    }

    // Augment the properties, events with their names for ease of use
    if (td2.properties) {
      for (let [key, val] of Object.entries(td2.properties)) {
        val.name = key
      }
    }
    if (td2.actions) {
      for (let [key, val] of Object.entries(td2.actions)) {
        val.name = key
      }
    }
    if (td2.events) {
      for (let [key, val] of Object.entries(td2.events)) {
        val.name = key
      }
    }
  }
}
