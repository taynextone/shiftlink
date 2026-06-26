export class ApiError extends Error {
  status: number;
  code?: string;
  isRetryable: boolean;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
    this.status = status;
    this.code = code;
    this.isRetryable = status === 0 || status === 408 || status === 429 || status >= 500;
  }
}
