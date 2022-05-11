// AppState data for reactive access to non persistent application state
import { reactive, readonly, watch } from "vue";
import {matDashboard} from "@quasar/extras/material-icons";



// localstorage load/save key
const  storageKey:string = "appState"


// The global reactive application state
export class AppStateData extends Object {
  // editMode for the dashboard
  editMode: boolean = false;
}

// The non-persistent runtime application state is kept here
export class AppState {
  protected _state: AppStateData;

  constructor() {
    this._state = reactive(new AppStateData())
    watch(this._state, () => {
      this.save()
    })
  }

  // load state from local storage
  load() {
    console.log("AppState.Loading state")
    let serializedState = localStorage.getItem(storageKey)
    if (serializedState != null) {
      let _state = JSON.parse(serializedState)
      this._state.editMode = _state.editMode
    }
  }

  // Return the reactive state
  // note, this should be readonly but that doesn't work on Array for some reason
  public get state(): AppStateData {
    return readonly<AppStateData>(this._state);
  }

  // Change the edit mode on (true) or off (false)
  setEditMode(on: boolean) {
    this._state.editMode = on;
  }

  // save to local storage
  save() {
    console.log("AppState.Saving state")
    let serializedStore = JSON.stringify(this._state)
    localStorage.setItem(storageKey, serializedStore)
  }
}

export const appState = new AppState();

