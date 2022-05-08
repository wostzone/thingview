// special error to indicate need for reauthorization

/** Unexpected error in handling response */
export class ResponseError extends Error {

  constructor(message: string) {
    super(message)
  }
  public errorCode: number = 0
}

/** Authentication error, reauthentication is required */
export class UnauthorizedError extends Error {
  public errorCode: number = 0

  constructor(message: string, errorCode: number) {
    super(message)
    this.errorCode = errorCode
  }
}
