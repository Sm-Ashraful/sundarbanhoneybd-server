class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.status = statusCode;
    this.data = null;
    this.errors = errors;
    this.message = message;
    this.success = false;

    if (stack) {
      console.log("Error status: ", stack);
      this.stack = stack;
    } else {
      console.log("Error status this: ", this);
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export { ApiError };
