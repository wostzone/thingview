import { AccountRecord } from "./AccountStore"

/** Account connection status definition
 */
export interface IConnectionStatus {
  /** account used to connect
   */
  account?: AccountRecord
  /**
   * Access token obtained when authenticating
   */
  accessToken: string
  /** authentication was successful
   */
  authenticated: boolean
  /** human description of authentication status
   */
  authStatusMessage: string

  /** the directory is obtained
   */
  directory: boolean
  /** message bus connection is established
   */
  connected: boolean

  /** human description of connection status
   */
  statusMessage: string
}