import { ApiError } from "../../utils/ApiError";

class AuthorizationError extends ApiError {
  /**
   * Authorization Error Constructor
   * @param {any} [message] - Error payload
   * @param {number} [statusCode] - Status code. Defaults to `401`
   * @param {string} [feedback=""] - Feedback message
   * @param {object} [authParams] - Authorization Parameters to set in `WWW-Authenticate` header
   */
  constructor(message, statusCode, errors, authParams) {
    super(message, statusCode || 401, errors); // Call parent constructor with args
    this.authorizationError = true;
    this.authParams = authParams || {};
    this.authHeaders = {
      "WWW-Authenticate": `Bearer ${this.#stringifyAuthParams()}`,
    };
  }

  // Private Method to convert object `key: value` to string `key=value`
  #stringifyAuthParams() {
    let str = "";

    let { realm, ...others } = this.authParams;

    realm = realm ? realm : "apps";

    str = `realm=${realm}`;

    const otherParams = Object.keys(others);
    if (otherParams.length < 1) return str;

    otherParams.forEach((authParam, index, array) => {
      // Delete other `realm(s)` if exists
      if (authParam.toLowerCase() === "realm") {
        delete others[authParam];
      }

      let comma = ",";
      // If is last Item then no comma
      if (array.length - 1 === index) comma = "";

      str = str + ` ${authParam}=${this.authParams[authParam]}${comma}`;
    });

    return str;
  }
}

export { AuthorizationError };
