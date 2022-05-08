// Factory of consumed things that binds them to protocol bindings
import { MqttClient } from "./MqttClient";
import { AccountRecord } from "../accounts/AccountStore";
import { ConsumedThing } from "../thing/ConsumedThing";
import { ThingTD } from "../thing/ThingTD";
// FIXME: use reactivity feature from vue - is rxjs an alternative?
import { reactive } from "vue";
import { MqttBinding } from "./MqttBinding";
import { splitTopic, SUB_EVENTS_TOPIC, SUB_PROPS_TOPIC, TOPIC_SUBJECT_PROPERTIES, TOPIC_TYPE_EVENT, TOPIC_TYPE_TD } from "./topics";
import { ThingStore } from "../thing/ThingStore";
import { DirectoryClient } from "./DirectoryClient";
import { AuthClient } from "./AuthClient";
import { IConnectionStatus } from "../accounts/IConnectionStatus";
import { UnauthorizedError } from "./errors";


// Manage consumed Things and its message bus protocol bindings.
// The MQTT protocol bindings is the only one used. See the readme for rational.
//
// This:
//   1. creates consumed things from a TD
//   2. updates consumed things properties when property update messages are received
//   3. updates consumed things with received events
//   4. passes action requests by consumed things to exposed things
//   5. passes write properties requests by consumed things to exposed things
//   6. updates things TD store when updates to TD documents are received
//
// This currently only handles a single Hub connection. 
//
export class ConsumedThingFactory {

  /** account to use to connect to the MQTT broker. See start() */
  private account: AccountRecord

  /** authentication client to obtain access tokens before connect */
  private authClient?: AuthClient

  /** connection status including access token */
  private _connectionStatus: IConnectionStatus

  /** directory client for loading TD's and values */
  private dirClient?: DirectoryClient

  /** optional callback to notify of authentication failure and require a new password login */
  private onAuthFailed?: (account: AccountRecord, err: Error) => void

  /** callback for connection change notifications */
  private onConnectCB?: (account: AccountRecord, isConnected: boolean) => void;

  /** the mqtt client to use in bindings. See start() */
  private mqttClient: MqttClient

  /** consumed things that are in use. See consume() */
  private ctMap: Map<string, ConsumedThing>

  /** bindings that are in use. See consume() */
  private bindings: Map<string, MqttBinding>

  /** ThingStore to update with newly received TDs */
  private _thingStore?: ThingStore

  /** The ConsumedThingFactory creates consumed things and binds them to the
   * protocol used by the Thing as per TD. In WoST consumers only need to use the MQTT 
   * protocol binding.
   * Use start to start using it with a given account.
   */
  constructor() {
    this.ctMap = reactive(new Map<string, ConsumedThing>())
    // this.authClient = new AuthClient()
    this.bindings = new Map<string, MqttBinding>()
    // just a dummy account
    this.account = new AccountRecord()
    // this.dirClient = new DirectoryClient()
    this.mqttClient = new MqttClient(
      this.handleMqttConnected.bind(this),
      this.handleMqttDisconnected.bind(this),
      this.handleMqttMessage.bind(this),
      this.handleMqttGetAccessToken.bind(this)
    )
    this._connectionStatus = reactive({
      account: undefined,
      accessToken: "",
      authenticated: false,
      authStatusMessage: "",
      connected: false,
      directory: false,
      statusMessage: "not connected"
    })
  }

  /**
   * Authenticate or refresh the access token used by the protocols.
   * If a password is provided then authenticate and obtain a new token pair
   * If no password is provided attempt to refresh the authentication tokens.
   * If refresh fails then the optional onAuthFailed callback is invoked. Callers
   * should call 'connect' again this time with a password.
   * If the promise succeeds then call connect to start.
   * 
   * @param account to authenticate with
   * @param password optional password to authenticate with
   */
  async authenticate(account: AccountRecord, password?: string) {
    // FIXME: prevent concurrent authentication
    console.log("ConsumedThingFactory.authenticate")
    this._connectionStatus.authStatusMessage = "Authenticating..."
    if (!this.authClient) {
      this.authClient = new AuthClient(account.id, account.address, account.authPort)
    }
    if (password) {
      return this.authClient.AuthenticateWithLoginID(account.loginName, password, account.rememberMe)
        .then((accessToken: string) => {
          this._connectionStatus.authenticated = true
          this._connectionStatus.accessToken = accessToken
          this._connectionStatus.authStatusMessage = "Authenticated"
        })
        .catch((err: Error) => {
          this._connectionStatus.authenticated = false
          this._connectionStatus.authStatusMessage = "Login failed: " + err.message
          console.warn("ConnectionManager.authenticate: ", this._connectionStatus.authStatusMessage)
          throw (err)
        })
    } else {
      return this.authClient.Refresh()
        .then((accessToken: any) => {
          this._connectionStatus.authenticated = true
          this._connectionStatus.accessToken = accessToken
          this._connectionStatus.authStatusMessage = "Authenticated"
        })
        .catch((err: Error) => {
          this._connectionStatus.authenticated = false
          this._connectionStatus.authStatusMessage = "Auth refresh failed: " + err.message

          console.warn("ConnectionManager.authenticate: ", err.message)
          // notify the caller so a password login can be attempted
          if (this.onAuthFailed) {
            this.onAuthFailed(account, err)
          }
          throw (err)
        })
    }
  }



  // Connect the factory with the given Thing store and establish a connection to the message bus.
  // authenticate must have been successfully called before connect can succeed.
  //
  // To use a new account, simply call start again with a new account. This will
  // stop the existing connection before attempting to connect using the new account.
  // This returns a promise that resolves when connection succeeds.
  //
  // 1. authenticate
  // 2. get TDs from directory
  // 3. connect to message bus
  //
  // @param account to use with protocols, eg mqtt, http, directory clients
  // @param accessToken to use to connect
  // @param thingStore to update with TDs
  // @param onConnectCB optional callback to receive change notification to the message bus connection
  async connect(account: AccountRecord,
    thingStore: ThingStore,
    onConnectCB?: (account: AccountRecord, isConnected: boolean) => void,
  ) {

    // Shutdown existing connections
    this.disconnect()

    console.log("ConsumedThingFactory.connect/1: Connecting to account '%s' on address: %s", account.id, account.address)
    this.account = account
    this._thingStore = thingStore
    this.onConnectCB = onConnectCB

    // Refresh tokens. If this fails a login with password is needed.
    this._connectionStatus.statusMessage = ""
    await this.authenticate(account)

    console.log("ConsumedThingFactory.connect/2: Loading the Thing Directory")
    this.dirClient = new DirectoryClient(account.address, account.directoryPort)
    await this.dirClient.loadDirectory(this._connectionStatus.accessToken)
      .then(() => {
        this._connectionStatus.directory = true
        this._connectionStatus.statusMessage = "loaded directory"
      })
      .catch((err: any) => {
        this._connectionStatus.directory = false
        this._connectionStatus.statusMessage = "unable to load directory: " + err

      })

    console.log("ConsumedThingFactory.connect/3: Connecting the to mqtt broker")
    return this.mqttClient.connect(
      account.id,
      account.address,
      account.mqttPort,
      account.loginName,
      this.connectionStatus.accessToken)
      .then((value: any) => {
        this._connectionStatus.connected = true
        this._connectionStatus.statusMessage += " and connected to the message bus."
      })
      .catch((err: any) => {
        this._connectionStatus.connected = false
        this._connectionStatus.statusMessage += " Failed connecting to the message bus: " + err
        console.error("connect: " + this._connectionStatus.statusMessage)
        throw (err)
      })

  }


  // Disconnect the factory from the account
  disconnect(): void {
    if (this.mqttClient) {
      this.mqttClient.disconnect()
    }
    this.connectionStatus.connected = false
  }

  /** Get the current connection status of the consumedThing factory */
  get connectionStatus(): IConnectionStatus {
    return this._connectionStatus
  }

  /** Obtain a 'Consumed Thing' for interacting with a remote (exposed) thing.
   * 
   * This looks-up the TD from the factory store. If it doesn't exist this returns undefined.
   * 
   * This creates an instance of a consumed thing and attaches it to interaction protocol bindings:
   * - mqtt binding to subscribe and request updates
   * - directory binding to read properties and history
   * 
   *  If a consumed thing already exists then simply return it. 
   * 
   * @param thingID is the ID of the TD
   */
  consumeWithID(thingID: string): ConsumedThing | undefined {
    let td = this._thingStore?.getThingTDById(thingID)
    if (!td) {
      return undefined
    }
    // doesn't exist so one needs to be created from the TD
    return this.consume(td)
  }


  /** Obtain a 'Consumed Thing' for interacting with a remote (exposed) thing.
   *
   * This attaches it to interaction protocol bindings:
   * - directory binding to read properties and history
   * - mqtt binding to subscribe and request updates
   * 
   * If a consumed thing already exists then simply return it. 
   * If properties were not read, then attempt to read them again.
   * 
   * @param td is the Thing TD whose interaction instance to create
   */
  consume(td: ThingTD): ConsumedThing {
    let ct = this.ctMap.get(td.id)
    if (ct) {
      // if a read failed last time then retry
      if (!ct.hasProperties) {
        ct.readAllProperties()
      }
      return ct
    } 
      // create a new instance of the CT and make it reactive
    let ct2 = new ConsumedThing(td)
    this.ctMap.set(td.id, ct2)

    // retrieve the reactive instance
    // Satisfy the compiler. It doesn't know that ctMap was just set 
    ct = this.ctMap.get(td.id)
    if (ct) {
      ct2 = ct
    }
    // do we need a directory binding?
    ct2.readPropertiesHook = this.readProperties.bind(this)

    // use the account that provided the TD
    if (this.mqttClient) {
      let mqttBinding = new MqttBinding(this.mqttClient, ct2)
      this.bindings.set(td.id, mqttBinding)
      mqttBinding.subscribe()
    }

    // load property values
    // if authentication failed then reauthenticate and retry
    ct2.readAllProperties()
      .then()
      .catch((err: Error) => {
        this.authenticate(this.account)
          .then(() => {
            ct2.readAllProperties()
              // .then(() => {
              //   console.log("consume readAllProperties. retry succeeded")
              // })
              .catch(() => {
                // console.error("consume readAllProperties. Retry failed")
              })
          })
          // ignore errors
          .catch(() => { })
      })

    return ct2
  }

  /** Load the directory of Things Description documents from the server */
  // async loadDirectory(account: AccountRecord, accessToken: string, thingStore: ThingStore) {
  //   let dirClient = new DirectoryClient(account.address, account.directoryPort)
  //   await dirClient.Connect(accessToken)
  //   return dirClient.LoadDirectory()
  // }


  // Return the connection status of the consumed things
  get isConnected(): boolean {
    return this.mqttClient.isConnected
  }

  // Notify of changes to connection status
  handleMqttConnected(accountID: string) {
    this._connectionStatus.connected = true
    this._connectionStatus.statusMessage = "Reconnected to message bus"
    if (this.onConnectCB) {
      this.onConnectCB(this.account, true)
    }
  }
  /** Handle MQTT connection failure
   * If an error occurred then re-authenticate
   */
  handleMqttDisconnected(accountID: string, client: MqttClient, err?: Error) {
    this._connectionStatus.connected = false
    this._connectionStatus.statusMessage = "Lost connection to message bus"
    if (this.onConnectCB) {
      this.onConnectCB(this.account, false)
    }
    // TODO: check of authentication error. for now assume this is the reason
    if (err) {
      this._connectionStatus.authenticated = false
      this._connectionStatus.authStatusMessage = err.message
      // this will refresh the access token, which will be picked up by
      // the handleMqttGetAccessToken callback.
      this.authenticate(this.account).then()
    }
  }

  /** 
   * Handle request for access token for reconnecting to the MQTT broker
   * This is called by the MQTT client to get the latest valid token in order
   * to reconnect.
   * 
   * This is (most likely) caused by an expired token, so refresh the token.
   */
  handleMqttGetAccessToken(accountID: string): string {
    // refresh JWT token - how to know it is expired without adding 
    // knowledge of the token?
    // this.authenticate(this.account)
    console.log("ConsumedThingFactory.handleMqttGetAccessToken for account '%s'", accountID)
    return this.connectionStatus.accessToken
  }

  /**
   * Handle an incoming MQTT message
   * This dispatches the message to the consumed thing.
   */
  handleMqttMessage(_accountID: string, topic: string, payload: Buffer, _retain: boolean): void {
    console.log("handleMqttMessage. topic:", topic, "Message size:", payload.length)
    // pass the message to the mqtt protocol handler of the 'thing'
    let [thingID, topicType, subject] = splitTopic(topic)
    let cThing = this.ctMap.get(thingID)
    if (!cThing) {
      console.error("handleMqttMessage. No consumed thing for thingID: ", thingID)
      return
    }
    if (topicType == TOPIC_TYPE_EVENT) {
      let params = JSON.parse(payload.toString())
      if (subject == TOPIC_SUBJECT_PROPERTIES) {
        for (let [propName, value] of Object.entries(params)) {
          cThing.handlePropertyChange(propName, value)
        }
      } else {
        let eventName = subject
        cThing.handleEvent(eventName, params)
      }
    } else if (topicType == TOPIC_TYPE_TD) {
      let td = JSON.parse(payload.toString())
      if (this._thingStore) {
        this._thingStore.addTD(td)
      }
    } else {
      // unexpected
      console.error("handleMqttMessage. Unexpected topicType: ", topicType)
      return
    }
  }

  /** Read the property values of a thing from the directory store
   * If this fails then reauthenticate and retry.
   * Note: this should go to a separate DirectoryBinding object
   */
  async readProperties(cThing: ConsumedThing): Promise<Object | undefined> {

    if (this.dirClient) {
      return this.dirClient.readProperties(cThing, this._connectionStatus.accessToken)
        .then((props: Object) => {
          console.log("consume: Read property values for Thing: %s", cThing.id)
          return props
        })
      // .catch((err: Error) => {
      // console.warn("consume: Failed reading property values for Thing: %s: %s", cThing.id, err.message)
      // If there is an auth error then refresh access token and retry again
      // if (err instanceof UnauthorizedError) {
      // this.authenticate(this.account)
      //   .then(() => {
      //     this.dirClient?.readProperties(cThing, this._connectionStatus.accessToken)
      //       .then((props2: Object) => {
      //         return props2
      //       })
      //   })
      // .catch((err: Error) => {
      //   console.warn("consume: re-authentication failed. Providing an empty instance.")
      //   throw (err)
      // })
      // } else {
      // throw (err)
      // }
      // })
    } else {
      return
    }
  }

  // Return the Thing TD store associated with this factory
  get thingStore(): ThingStore | undefined {
    return this._thingStore
  }

  /** Set the handler to invoke when authentication failed and a password login is required */
  setAuthFailedHandler(handler: (account: AccountRecord, err: Error) => void) {
    this.onAuthFailed = handler
  }

}
// this factory is a singleton
const consumedThingFactory = new ConsumedThingFactory()

export { consumedThingFactory }
