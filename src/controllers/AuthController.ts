import { isAxiosError } from "axios";
import mitt from "mitt";

import { refreshTokens, TokensResponse } from "../api/auth";
import { getSecureItem } from "../modules/keychain";
import { Timeout } from "../utils/Timeout";
import { credentialsController } from "./CredentialsController";

const CLOCK_DRIFT_MS = 30_000;

function refreshDelayTime(tokens: TokensResponse): number {
  return Math.max(
    tokens.access.payload.exp * 1000 - Date.now() - CLOCK_DRIFT_MS,
    0
  );
}

function canRefresh(tokens: TokensResponse): boolean {
  return tokens.refresh.payload.exp * 1000 - CLOCK_DRIFT_MS > Date.now();
}

export class UnauthenticatedError extends Error {}
export class AbortError extends Error {}

type Session = Pick<TokensResponse, "user_id"> | null;
type EventMap = { tokens: TokensResponse | null; session: Session | null };

class AuthController {
  readonly #emitter = mitt<EventMap>();
  #tokens: TokensResponse | null = null;
  #refreshTimeout: Timeout | null = null;

  get tokens(): TokensResponse | null {
    return this.#tokens;
  }

  get session(): Session | null {
    return this.#tokens ? { user_id: this.#tokens.user_id } : null;
  }

  subscribe<TEvent extends keyof EventMap>(
    event: TEvent,
    listener: (data: EventMap[TEvent]) => void
  ): () => void {
    this.#emitter.on(event, listener);

    return () => {
      this.#emitter.off(event, listener);
    };
  }

  async accessToken(
    signal?: AbortSignal | undefined
  ): Promise<TokensResponse["access"]> {
    if (signal?.aborted) {
      throw new AbortError();
    }

    if (this.#tokens && refreshDelayTime(this.#tokens) > 0) {
      return this.#tokens.access;
    }

    return new Promise<TokensResponse["access"]>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new AbortError());
        return;
      }

      const handleTokens = (tokens: TokensResponse | null): void => {
        if (tokens) {
          resolve(tokens.access);
        } else {
          reject(new UnauthenticatedError());
        }

        unsubscribe();
      };

      const unsubscribe = this.subscribe("tokens", handleTokens);

      signal?.addEventListener("abort", unsubscribe);
    });
  }

  updateSession(tokens: TokensResponse | null): void {
    if (
      tokens === this.#tokens ||
      (tokens &&
        this.#tokens &&
        tokens.access.payload.iat <= this.#tokens.access.payload.iat)
    ) {
      return;
    }

    const current = this.#tokens;
    this.#tokens = tokens;
    this.#refreshTimeout?.abort();

    if (tokens) {
      const delay = refreshDelayTime(tokens);
      console.log(
        "Scheduling refreshing for ",
        delay,
        "ms",
        `(at ${new Date(Date.now() + delay).toLocaleTimeString()})`
      );
      this.#refreshTimeout = new Timeout(() => this.#refresh(), delay);
    }

    if (
      (!current && tokens) ||
      (current && !tokens) ||
      (current && tokens && current.user_id !== tokens.user_id)
    ) {
      this.#emitter.emit(
        "session",
        tokens ? { user_id: tokens.user_id } : null
      );
    }

    this.#emitter.emit("tokens", tokens);
  }

  #refresh(): void {
    const tokens = this.#tokens;

    if (!tokens) {
      return;
    }

    if (canRefresh(tokens)) {
      refreshTokens({ token: tokens.refresh.token })
        .catch((e) => {
          if (isAxiosError(e) && !e.response) {
            console.log("offline?", e);
            return tokens;
          }
          throw e;
        })
        .then(
          (tokens) => {
            this.updateSession(tokens);
          },
          (e) => {
            console.log("refresh error:", e);
            this.updateSession(null);
          }
        );
    } else {
      console.log("refresh token is too old to refresh");
      credentialsController.unlock();
    }
  }

  async initialize(): Promise<void> {
    const tokens = await getSecureItem<TokensResponse>("oauthTokens");
    console.log({ tokens, canRefresh: tokens && canRefresh(tokens) });

    if (tokens && canRefresh(tokens)) {
      this.updateSession(tokens);
    } else {
      await credentialsController.unlock();
    }
  }
}

export const authController = new AuthController();
