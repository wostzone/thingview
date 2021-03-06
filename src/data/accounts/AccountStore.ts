// HubAccountStore is a local storage persistent data for hub accounts
import { reactive, readonly } from "vue";
import { nanoid } from 'nanoid'

// Hub Account record
export class AccountRecord extends Object {
  /** unique account id (required)
   */
  id: string = nanoid(5);

  /** Account friendly name for display
   */
  name: string = "new account";

  /** login credentials
   */
  loginName: string = "email@something";

  /** Hub hostname or IP address (must match its server certificate name)
   */
  address: string = "localhost";

  /** port of authentication service, typically 8881. 0 to use the express server proxy instead.
   */
  authPort?: number = 0; // 8881;

  /** port of mqtt service. typically 8885 for websocket.
   */
  mqttPort?: number = 0; // 8885;

  /** port of the directory service. typically 8886. 0 to use the express server proxy instead
   */
  directoryPort?: number = 0; // 8886;

  /** when enabled, attempt to connect
   */
  enabled: boolean = false;

  /** remember the refresh token to avoid asking for login for this account (until it expires)
   */
  rememberMe: boolean = false;

  /** last obtained authentication access token
   */
  // accessToken: string = ""
}

class AccountsData {
  accounts = Array<AccountRecord>()
}

/** Hub account data implementation with additional methods for loading and saving
 */
export class AccountStore {
  private data: AccountsData
  private storageKey: string = "accountStore"

  constructor() {
    let defaultAccount = this.newAccountRecord()
    defaultAccount.name = "Hub server"
    defaultAccount.loginName = "user1" // for testing
    this.data = reactive(new AccountsData())
  }

  /** add a new account to the list and save the account list
   */
  add(account: AccountRecord): void {
    // ensure each account has an ID
    if (!account.id) {
      account.id = nanoid(5)
    }
    let newAccount = JSON.parse(JSON.stringify(account))
    this.data.accounts.push(newAccount)
    this.save()
  }

  /** Return a list of accounts
   */
  get accounts(): readonly AccountRecord[] {
    return readonly(this.data.accounts) as AccountRecord[]
  }

  /** Get the account with the given id
   */
  getAccountById(id: string): AccountRecord | undefined {
    let accounts = this.data.accounts

    let ac = accounts.find(el => (el.id === id))
    if (!ac) {
      return undefined
    }
    return readonly(ac) as AccountRecord

  }

  /** Load accounts from session/local storage
   * First load from session storage. If session storage is empty, try local storage
   */
  load() {
    let serializedStore = sessionStorage.getItem(this.storageKey)
    if (!serializedStore) {
      serializedStore = localStorage.getItem(this.storageKey)
    }
    if (serializedStore != null) {
      let accountData: AccountsData = JSON.parse(serializedStore)
      if (accountData != null && accountData.accounts.length > 0) {
        this.data.accounts.splice(0, this.data.accounts.length)
        this.data.accounts.push(...accountData.accounts)
        console.debug("Loaded %s accounts from local storage", accountData.accounts.length)
      } else {
        console.log("No accounts in storage. Keeping existing accounts")
      }
    }
    // ensure there is at least 1 account to display
    if (this.data.accounts.length == 0) {
      let defaultAccount = new AccountRecord()
      this.data.accounts.push(defaultAccount)
    }
  }

  /** create a new account record instance.
   * This only creates the instance for editing and does not add the record to the store.
   */
  newAccountRecord(): AccountRecord {
    let ar = new AccountRecord()
    ar.name = "New account"
    ar.authPort = ar.directoryPort = ar.mqttPort = parseInt(location.port)
    ar.address = location.hostname
    ar.enabled = true

    return ar
  }

  /** remove the given account by id
   */
  remove(id: string) {
    let remainingAccounts = this.data.accounts.filter((item: AccountRecord) => {
      // console.log("Compare id '",id,"' with item id: ", item.id)
      return (item.id != id)
    })
    console.log("Removing account with id", id,)
    this.data.accounts.splice(0, this.data.accounts.length)
    this.data.accounts.push(...remainingAccounts)
    this.save()
  }

  /** Save account in session and local storage
   * If RememberMe is set, also save the data in localStorage for use between sessions.
   * If RememberMe is not set, the localstorage key is removed
   */
  save() {
    console.log("Saving %s accounts to local storage", this.data.accounts.length)
    let serializedStore = JSON.stringify(this.data)
    sessionStorage.setItem(this.storageKey, serializedStore)

    // If one account is to be remembered, Keep them all. 
    let rememberMe = false
    for (let account of this.data.accounts) {
      rememberMe = rememberMe || account.rememberMe
    }

    if (rememberMe) {
      localStorage.setItem(this.storageKey, serializedStore)
    } else {
      localStorage.removeItem(this.storageKey)
    }
  }

  /** Enable or disable the hub account
   * When enabled is true, an attempt will be made to connect to the Hub on the port(s)
   * When enabled is false, any existing connections will be closed
   */
  setEnabled(id: string, enabled: boolean) {
    let account = this.data.accounts.find(el => (el.id === id))
    if (!account) {
      console.log("SetEnabled: ERROR account with ID", id, " not found")
      return
    }
    console.log("SetEnabled of account", account.name, ":", enabled)
    account.enabled = enabled
    this.save()

  }

  /** Update the account with the given record and save
   * If the record ID does not exist, and ID will be assigned and the record is added
   * If the record ID exists, the record is updated
   */
  update(account: AccountRecord) {
    let newAccount = JSON.parse(JSON.stringify(account))

    let existing = this.data.accounts.find(el => (el.id === account.id))

    if (!existing) {
      console.log("Adding account", newAccount)
      this.data.accounts.push(newAccount) // why would it not exist?
    } else {
      console.log("Update account", newAccount)
      // reactive update of the existing record
      Object.assign(existing, newAccount)
    }
    this.save()
  }
}

/** accountStore is a singleton
 */
export const accountStore = new AccountStore()

