// Constants for use by applications
import fs, { access } from 'fs'
import { ThingTD } from '../thing/ThingTD'
import { thingStore, ThingStore } from "../thing/ThingStore"
import { ConsumedThing } from '../thing/ConsumedThing'
import { DateTime } from 'luxon'


const DefaultServiceName = "thingdir"
const DefaultPort = 8886

// paths with REST commands
const PATH_THINGS = "/things"           // list or query path
const PATH_THING_ID = "/things/{thingID}" // for methods get, post, patch, delete
const PATH_VALUES = "/values"           // read for values

// query parameters
const QPARAM_OFFSET = "offset"
const QPARAM_LIMIT = "limit"
const QPARAM_QUERY = "queryparams"
const QPARAM_THINGS = "things="

const DefaultLimit = 100
const MaxLimit = 1000

// connection status
const StatusLoading = "loading"
const StatusLoaded = "loaded"
const StatusFailed = "failed"
const StatusNew = "new"


// Client for connecting to a Hub Directory Service and query TDs
export class DirectoryClient {
  private hostPort: string = ""
  private caCert: string = "" // in PEM format
  private thingStore: ThingStore
  // private tlsClient: TLSSocket|null = null

  // Directory service client
  // @param address of directory service to connect to.
  // @param port the directory service is listening on. Use default port if not provided
  constructor(address: string, port: number | undefined) {
    if (!port) {
      port = DefaultPort
    }
    this.hostPort = address + ":" + port.toString()
    this.thingStore = thingStore
  }

  /**
   * getBatch reads a batch of requests with given URL from offset and limit number
   * @param url: full https url to connect to the directory server
   * @param offset: batch offset, use the total count that was already received in previous calls
   * @param limit: maximum number of results 
   */
  async getBatch(url: string, offset: number, limit: number, accessToken: string): Promise<Array<any>> {

    let urlWithOffset = `${url}?offset=${offset}&limit=${limit}`

    // const promise: Promise<Array<any>> = fetch(urlWithOffset, {
    let resp = await fetch(urlWithOffset, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'bearer ' + accessToken,
      },
      // }).then(resp => resp.json())
    })
    if (!resp) {
      let err = new Error("DirectoryClient.getBatch: Missing content for URL: " + url)
      console.warn(err)
      throw (err)
    } else if (resp.status >= 400) {
      let err = new Error(`DirectoryClient.getBatch: Error code '{resp.status}' ({resp.statusText}) for URL: {url}`)
      console.warn(err)
      throw (err)
    }
    let respText = await resp.text()
    let jsonResp = JSON.parse(respText)
    if (!jsonResp) {
      let err = new Error("DirectoryClient.getBatch: response is not json for URL: " + url)
      console.warn(err)
      throw (err)
    }
    console.log("DirectoryClient.getBatch: Response content=", jsonResp)
    return jsonResp
    //  }).catch((reason: any) => {
    //       console.error("DirectoryClient.getBatch: Error reading from URL '%s': %s", urlWithOffset, reason)
    //       throw (reason)
    //     })
    //   return promise
  }

  /** ListTDs
   * Load the TDs from the directory starting at the offset. The result is limited to the nr of records 
   * provided with the limit parameter. The server can choose to apply its own limit, in which case 
   * the lowest value is used.
   * @param offset of the list to query from
   * @param limit result to nr of TDs. Use 0 for default (100).
   */
  async listTDs(offset: number, limit: number, accessToken: string): Promise<Array<ThingTD>> {
    // https://smallstep.com/hello-mtls/doc/client/axios
    // const httpsAgent = new https.Agent({
    //     // cert: fs.readFileSync('clientCert.pem'),
    //     // key: fs.readFileSync('clientKey.pem'),
    //     ca: fs.readFileSync('caCert.pem'),
    // });
    if (limit <= 0) {
      limit = DefaultLimit
    }
    let url = "https://" + this.hostPort + PATH_THINGS
    // axios.get(url, {httpsAgent})
    // let options = {
    //     hostname: this.address,
    //     port: this.port,
    //     path: path,
    //     method: 'POST',
    //     ca: this.caCert,
    //     body: jsonPayload,
    // }
    console.log("DirectoryClient.listTDs: from '%s'. offset=%s, limit=%s", url, offset, limit)
    let done = false
    let tds: Array<ThingTD> = new Array<ThingTD>()
    while (!done) {
      await this.getBatch(url, offset, limit, accessToken)
        .then((items: Array<ThingTD>) => {
          if (!done) {
            tds.push(...items)
            offset += items.length
          }
          // only continue if limit nr results is received
          done = (items.length < limit)
        }).catch((err) => {
          throw (err)
        })
    }
    return tds
  }


  // Load the directory of things and update the directory store
  async loadDirectory(accessToken: string) {
    let offset = 0
    let limit = 100

    // TODO: repeat until all things are collected
    return this.listTDs(0, 0, accessToken)
      .then((things: ThingTD[]) => {
        console.log("DirectoryClient.loadDirectory: Received directory update containing '%s' items", things.length)
        for (let td of things) {
          // augment the Thing with zone, device ID and publisher and devicetype
          let parts = ThingTD.GetThingIDParts(td.id)
          td.zone = parts.zone
          td.deviceID = parts.deviceID
          td.publisher = parts.publisherID
          td.deviceType = parts.deviceType
          this.thingStore.update(td)
        }
      }).catch((reason: any) => {
        console.warn("Failed retrieving directory: ", reason)
        throw (reason)
      })
  }

  // read the property values for use in a Consumed Thing
  // This only needs to be done during startup. MQTT subscription keeps the values up to date.
  async readProperties(cThing: ConsumedThing, accessToken: string) {
    let url = "https://" + this.hostPort + PATH_VALUES + "/" + cThing.id
    console.log("DirectoryClient.readProperties: from '%s'", url)

    await this.getBatch(url, 0, MaxLimit, accessToken)
      .then((values: any) => {
        console.log("DirectoryClient.readProperties: received values from url %s", url)
        let thingProps = values as Object
        Object.entries(thingProps).forEach(([propName, val]) => {
          let updated = DateTime.fromISO(val.updated)
          cThing.handlePropertyChange(propName, val.value, updated)
        })
      })
  }

  /* QueryTDs with the given JSONPATH expression - todo
   * Returns a list of TDs matching the query, starting at the offset. The result is limited to the
   * nr of records provided with the limit parameter. The server can choose to apply its own limit,
   * in which case the lowest value is used.
   * @param jsonPath with the query expression
   * @param offset is the start index of the list to query from
   * @param limit limits the result to nr of TDs. Use 0 for default.
   */
  async QueryTDs(jsonpath: string, offset: number, limit: number): Promise<Array<ThingTD>> {
    // TODO: query implementation
    return Array<ThingTD>()
  }

}

