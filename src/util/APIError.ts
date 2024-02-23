export default class APIError extends Error {
  public status: number;

  constructor(error: { name?: string; status: number; message: string }) {
    super(error.message);
    this.status = error.status;
  }
}
