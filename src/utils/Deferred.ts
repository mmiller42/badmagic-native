export type DeferredState<T> =
  | { state: "pending"; value?: undefined; reason?: undefined }
  | { state: "resolved"; value: T; reason?: undefined }
  | { state: "rejected"; reason: unknown; value?: undefined };

export class Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T | PromiseLike<T>) => void;
  readonly reject: (reason?: unknown) => void;
  #state: DeferredState<T> = Object.freeze({ state: "pending" });

  constructor() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;

    this.promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    this.resolve = resolve;
    this.reject = reject;

    this.promise.then(
      (value) => {
        this.#state = Object.freeze({ state: "resolved", value });
      },
      (reason) => {
        this.#state = Object.freeze({ state: "rejected", reason });
      }
    );
  }

  get state(): DeferredState<T> {
    return this.#state;
  }
}
