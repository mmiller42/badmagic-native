export class Timeout {
  readonly #controller = new AbortController();
  readonly #timeoutId: ReturnType<typeof setTimeout>;
  #done = false;

  constructor(
    callback: () => void,
    delay: number,
    signal?: AbortSignal | undefined
  ) {
    this.#timeoutId = setTimeout(() => {
      this.#done = true;
      callback();
    }, delay);
    signal?.addEventListener("abort", () => this.abort());
  }

  get signal(): AbortSignal {
    return this.#controller.signal;
  }

  abort(): void {
    if (!this.#done) {
      clearTimeout(this.#timeoutId);
      this.#controller.abort();
    }
  }
}
