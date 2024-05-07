export default class MediumError extends Error {
  code = null
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}
