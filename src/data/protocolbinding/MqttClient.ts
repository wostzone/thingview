// const mqtt = require('mqtt/dist/mqtt.min')

// must use dist/mqtt.min see https://github.com/mqttjs/MQTT.js/issues/1269
import * as MQTT from 'mqtt/dist/mqtt.min'
import { stringify } from 'querystring'

const DefaultPort = 8885 // websocket protocol port. Use 8883 for mqtt protocol
const SYS_TOPIC = "$SYS/"
// MQTT $SYS topics
// export const SYS_CLIENTS_CONNECTED = "$SYS/broker/clients/connected"
// export const SYS_CLIENTS_DISCONNECTED = "$SYS/broker/clients/disconnected"
// export const SYS_CLIENTS_INACTIVE = "$SYS/broker/clients/inactive"
// export const SYS_CLIENTS_MAX = "$SYS/broker/clients/maximum"
// export const SYS_CLIENTS_TOTAL = "$SYS/broker/clients/total"
// export const SYS_BROKER_VERSION = "$SYS/broker/version"
// export const SYS_BROKER_UPTIME = "$SYS/broker/uptime"
// export const SYS_BROKER_SUBSCRIPTIONS = "$SYS/broker/subscriptions/count"
// export const SYS_MESSAGES_DROPPED = "$SYS/broker/publish/messages/dropped"
// export const SYS_MESSAGES_RECEIVED_TOTAL = "$SYS/broker/messages/received"
// export const SYS_MESSAGES_RECEIVED_PERMIN = "$SYS/broker/messages/received/1min"
// export const SYS_MESSAGES_STORED = "$SYS/broker/messages/stored"
// export const SYS_MESSAGES_RETAINED = "$SYS/broker/retained messages/count"
// export const SYS_BYTES_RECEIVED_PERMIN = "$SYS/broker/load/bytes/received/1min"
// export const SYS_BYTES_SENT_PERMIN = "$SYS/broker/load/bytes/sent/1min"


/**
 * Create MQTT client instance
 * @param accountID for identifying the account in callbacks
 * @param address to connect to
 * @param port optional port to use. Use 0 to use the default port
 * @param onConnected  connection established callback
 * @param onDisconnected connection list callback
 * @param onMessage message received callback
 */
export class MqttClient {
  private accountID: string = ""
  private address: string = ""
  private port: number = DefaultPort
  private loginID: string = ""
  private connectedTimeStamp: number | null
  // private messageCount: number
  private mqttJS: MQTT.Client | null
  private readonly onConnected?: (accountID: string, client: & MqttClient) => void
  private readonly onDisconnected?: (accountID: string, client: & MqttClient) => void
  private readonly onMessage: (accountID: string, topic: string, payload: Buffer, retain: boolean) => void
  private readonly onGetAccessToken: (accountID: string) => string
  private msgCount: number
  private subscriptions: Map<string, (topic: string, message: string) => void>
  private sysValues: Map<string, string> // map of broker $SYS topics and their values

  /**
   * @param onConnected: callback when connection is established
   * @param onDisconnected: callback when a successful connection has broken
   * @param onMessage: callback with incoming message from subscribed topic
   * @param onGetAccessToken: callback for obtaining an access token before connecting
   */
  constructor(
    onConnected: (accountID: string, client: & MqttClient) => void,   // callback invoked when connected
    onDisconnected: (accountID: string, account: & MqttClient) => void,
    onMessage: (accountID: string, topic: string, payload: Buffer, retained: boolean) => void,
    onGetAccessToken: (accountID: string) => string,
  ) {

    this.msgCount = 0
    this.mqttJS = null
    this.onConnected = onConnected
    this.onDisconnected = onDisconnected
    this.onMessage = onMessage
    this.onGetAccessToken = onGetAccessToken

    // this.isConnected = false
    this.connectedTimeStamp = null
    // active subscription topics to resubscribe on connection restore
    this.subscriptions = new Map<string, any>()//function (string, string): void>()
    this.sysValues = new Map<string, string>()
  }

  /**
   * Connect to the MQTT broker.
   * 
   * NOTE 1: If the connection drops, an automatic reconnect will be attempted
   * using the given accessToken. If the token has expired then this will fail and
   * the user must call connect() again using a valid token.
   * 
   * NOTE 2: IF CONNECT FAILS IN FIREFOX on Ubuntu v21.10 (March 1, 2022) it is because Mosquitto needs 
   * to use libwebsockets 4.2.1 and Ubuntu v21.10 comes with libwebsockets-4.0.20 which fails connecting using http/2.
   * Note that Ubuntu 20.04.03 LTS does come with the right libwebsockets18. (4.2.1)
   * See also: https://github.com/eclipse/paho.mqtt.javascript/issues/231
   * and https://github.com/eclipse/mosquitto/issues/1211
   * 
   * @param accountID: unique ID of the account used to connect with
   * @param address: domain.hostname or IP address of the MQTT broker
   * @param port: port to connect to, default is 8885 which is the Websocket port on the WoST broker
   * @param loginID: user ID that matches the access token
   * @param accessToken: the access token that is valid at the time of connection
   */
  async connect(accountID: string, address: string, port: number | undefined,
    loginID: string, accessToken: string) {

    if (this.isConnected) {
      this.disconnect()
    }

    if (!port) {
      port = DefaultPort
    }
    this.accountID = accountID
    this.address = address
    this.port = port
    this.loginID = loginID

    // Create a client instance
    // TODO: use template to populate server and port
    // let now = new Date()
    this.msgCount = 0

    // let clientId = this.accountInfo.clientId ? this.accountInfo.clientId :
    //                "iotrain-dashboard-" + now.toISOString()
    // let port = this.accountInfo.port ? this.accountInfo.port : 1883

    //client = new Paho.MQTT.Client(mqtt_hostname, Number(mqtt_port), mqtt_client_id)
    // WebSockets use a different port. FIXME. let server handle connections
    // this.pahoClient = new Paho.Client(this.accountInfo.host, port, "", clientId)

    let url = 'wss://' + this.address + ":" + this.port.toString() + "/mqtt"
    let now = new Date()
    let clientID = loginID + "-" + now.toISOString()
    // let options: MQTT.IClientOptions = {
    //   reconnectPeriod: 5000,
    //   username: loginID,
    //   password: accessToken,
    //   clientId: clientID,
    // }
    let options: MQTT.IClientOptions = {
      reconnectPeriod: 5000,
      username: loginID,
      password: accessToken,
      clientId: clientID,
      transformWsUrl: (url: string, options: MQTT.IClientOptions, client): string => {
        options.password = this.onGetAccessToken(this.accountID)
        return url
      }
    }


    console.log("Connecting to MQTT broker at '%s' as user %s", url, loginID)
    this.mqttJS = MQTT.connect(url, options);

    if (!this.mqttJS) {
      throw ("Mqtt connectect failed")
    }
    this.mqttJS.on('connect', this.handleConnected.bind(this))
    this.mqttJS.on('reconnect', this.handleReconnect.bind(this))

    this.mqttJS.on('disconnect', this.handleConnectionLost.bind(this))
    this.mqttJS.on('offline', this.handleConnectionLost.bind(this))
    this.mqttJS.on('error', this.handleConnectFailed.bind(this))

    this.mqttJS.on('message', this.handleMessage.bind(this))

    // this.messageCount = 0
    this.connectedTimeStamp = null

    // this.pahoClient.onConnectionLost = this.onConnectionLost.bind(this)
    // this.pahoClient.onMessageArrived = this.onMessage.bind(this)

    // connect the MQTT client
    // this.doConnect()
  }

  get ConnectedTimeStamp() { return this.connectedTimeStamp }

  /**
   * Disconnect if connected
   */
  disconnect() {
    if (this.mqttJS != null && this.mqttJS.connected) {
      console.log("MqttClient.Disconnect from %s:%s", this.address, this.port)
      this.mqttJS.end(false, {}, (err: any) => {
        console.log("MqttClient.Disconnected:", err)
        if (this.onDisconnected) {
          this.mqttJS = null
          // Satisfy compiler check. A disconnect can only happen when accountInfo is set
          this.onDisconnected(this.accountID, this)
        }
      })
    }
  }

  // // Establish connection to the MQTT broker
  // doConnect() {
  //   let connectOptions:ConnectionOptions = {
  //     onSuccess: this.handleConnected.bind(this),
  //     onFailure: this.handleConnectFailed.bind(this),
  //     // reconnect: true,
  //     timeout: 15,
  //     keepAliveInterval: 600,  // server disconnects when no activity for this amount of seconds
  //     cleanSession: true,
  //     invocationContext: this.accountInfo,
  //   }
  //   this.mqttClient.connect(connectOptions)
  // }

  get isConnected() {
    return this.mqttJS != null && this.mqttJS.connected
  }

  // The call to connect failed or timed out.
  // Invoke optional onDisconnectCallback and try again in 30 seconds
  handleConnectFailed(responseObject: Error) {
    console.warn("MqttClient.handleConnectFailed: Connection to MQTT broker failed: " + responseObject, "Retrying in 30 seconds...")

    if (this.onDisconnected) {
      // satisfy typescript
      this.onDisconnected(this.accountID, this)
    }
    // Wait 30 seconds before retrying
    // setTimeout(this.doConnect.bind(this), 30000)
  }

  // Connection was lost after initial connect succeeded.
  // Invoke optional callback. Connection will retry automatically
  handleConnectionLost() {
    console.warn("MqttClient.handleConnectionLost: Connection to MQTT broker lost")
    if (this.onDisconnected) {
      this.onDisconnected(this.accountID, this)
    }
    // paho client auto reconnects
    // setTimeout(this.doConnect.bind(this), 10000)
  }

  // Connection was established. Invoke optional callback and subscribe to messages
  handleConnected() {
    this.connectedTimeStamp = Date.now()
    console.log("MqttClient.handleConnected: Connection to MQTT broker established")
    // subscribe to basic $SYS info
    // if (this.accountInfo && this.accountInfo.subscribeToSys) {
    //     this.Subscribe([SYS_TOPIC+"#"])
    // }
    if (this.onConnected) {
      this.onConnected(this.accountID, this)
    }
  }
  // get sysTopicValues(): Map<string, string> {
  //     return this.sysValues
  // }

  // Message is received. Invoke optional subscription
  handleMessage(topic: string, message: Buffer, packet: any) {//Packet) {
    let t0 = performance.now();
    // this.messageCount++
    let retained: boolean = packet.retain // TODO is retain available?
    // let retained = false

    // console.log("MqttClient:onMessage: ", topic)
    // let payloadBytes = responseObject.payloadBytes
    if (topic.startsWith(SYS_TOPIC)) {
      this.sysValues.set(topic, message.toString())
    } else if (this.onMessage) {
      let that = this
      // Don't block the next message, prevent dropping of messages?
      setTimeout(() => {
        try {
          this.onMessage(that.accountID, topic, message, retained)
        } catch (err: any) {
          console.error("MqttClient.handleMessage: Exception handling message on topic", topic, ". Stack trace:")
          console.error(err.stack)   // this provides proper stack filename and line numbers
        }
      }, 0)
    }
    this.msgCount++
    let t1 = performance.now();
    console.log("MqttClient.handleMessage (" + topic + ").", Math.round(t1 - t0) + " milliseconds. msgCount=", this.msgCount)
  }

  // reconnection starts
  handleReconnect() {
    console.log("MqttClient.handleReconnect. Trying to reconnect...")
    // do nothing as mqtt client retains subscriptions
  }
  // publish a message on the mqtt bus
  publish(topic: string, payload: string) {
    if (this.mqttJS) {
      this.mqttJS.publish(topic, payload, (err) => {
        if (err) {
          console.error("mqttjs-client:Publish Error", err)
        }
      })
    }
  }

  /** subscribe to a topic.
   * @param topic to subscribe to. Can include wildcards but must be unique
   * @param qos of subscription. default is at-least-once (1)
   * @param handler to invoke when topic message is received
   */
  subscribe(topic: string, qos: number = 1, handler: (topic: string, message: string) => void) {
    this.subscriptions.set(topic, handler)
    let subscribeOptions = {
      qos: qos as MQTT.QoS,
    }
    // console.log("MqttClient.Subscribe: qos="+qos+" topics=",topics.toString())
    if (this.mqttJS) {
      this.mqttJS.subscribe(topic, subscribeOptions,
        (err, granted) => {
          console.log("MqttClient.Subscribe to topic",
            granted ? "Success." : "Failed.", "Topic:", topic)
        })
    }
  }

  // remove a subscription
  // @param topic used to subscribe
  unsubscribe(topic: string) {
    // remove it from out tracked subscriptions list
    for (let index = 0; index < this.subscriptions.size; index++) {
      this.subscriptions.delete(topic)
      // try {
      //   if (s != null && s["topic"] == topic) {
      //     this.subscriptions.splice(index, 1)
      //     break
      //   }
      // } catch (err) {
      //   console.log("MqttClient.Unsubscribe: Error unsubscribe from topic '" + topic + "': ", err)
      // }
    }
    if (this.mqttJS) {
      this.mqttJS.unsubscribe(topic)
    }
  }

}

