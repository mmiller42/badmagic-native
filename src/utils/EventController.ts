import { noop } from "lodash-es";
import mitt, { Emitter } from "mitt";

type EventMap<TEvents extends Record<string, unknown>> = Pick<
  TEvents,
  keyof TEvents & string
>;
type EventName<
  TEvents extends EventMap<TEvents>,
  TEvent extends keyof TEvents & string = keyof TEvents & string
> = TEvent;
type EventData<
  TEvents extends EventMap<TEvents>,
  TEvent extends keyof TEvents & string = keyof TEvents & string
> = TEvents[TEvent];
type EventListener<
  TEvents extends EventMap<TEvents>,
  TEvent extends keyof TEvents & string = keyof TEvents & string
> = (data: EventData<TEvents, TEvent>) => void;
type UnsubscribeFn = () => void;

export class EventController<TEvents extends EventMap<TEvents>> {
  readonly #emitter = mitt<TEvents>();
  readonly subscriptions = new EventSubscriptions(this.#emitter);

  constructor() {
    this.emit = this.emit.bind(this);
  }

  emit<TEvent extends EventName<TEvents>>(
    event: TEvent,
    data: EventData<TEvents, TEvent>
  ): void {
    this.#emitter.emit(event, data);
  }
}

class EventSubscriptions<TEvents extends Record<string, unknown>> {
  readonly #emitter: Emitter<TEvents>;

  constructor(emitter: Emitter<TEvents>) {
    this.#emitter = emitter;
    this.subscribe = this.subscribe.bind(this);
    this.once = this.once.bind(this);
  }

  subscribe<TEvent extends EventName<TEvents>>(
    event: TEvent,
    listener: EventListener<TEvents, TEvent>,
    signal?: AbortSignal | undefined
  ): UnsubscribeFn {
    if (signal?.aborted) {
      return noop;
    }

    this.#emitter.on(event, listener);

    signal?.addEventListener("abort", () => {
      this.#emitter.off(event, listener);
    });

    return () => {
      this.#emitter.off(event, listener);
    };
  }

  once<TEvent extends EventName<TEvents>>(
    event: TEvent,
    listener: EventListener<TEvents, TEvent>,
    signal?: AbortSignal | undefined
  ): UnsubscribeFn {
    const handler: EventListener<TEvents, TEvent> = (data) => {
      listener(data);
      unsubscribe();
    };

    const unsubscribe = this.subscribe(event, handler, signal);
    return unsubscribe;
  }
}
