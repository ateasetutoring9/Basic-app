export class ForbiddenError extends Error {
  readonly status = 403;

  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}
