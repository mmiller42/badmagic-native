import { Session, refreshCredentials } from "../api/auth";
import mitt from "mitt";
import { Timeout } from "../utils/Timeout";
import { isAxiosError } from "axios";

const CLOCK_DRIFT_MS = 30_000;

function refreshDelayTime(session: Session): number {
  return Math.max(
    session.access.payload.exp * 1000 - Date.now() - CLOCK_DRIFT_MS,
    0
  );
}

function canRefresh(session: Session): boolean {
  return session.refresh.payload.exp * 1000 - CLOCK_DRIFT_MS > Date.now();
}

async function refreshTokens(session: Session): Promise<Session> {
  try {
    return await refreshCredentials({ token: session.refresh.token });
  } catch (e) {
    if (isAxiosError(e) && !e.response) {
      console.log("offline error?", e);
      return session;
    }

    throw e;
  }
}

type RefreshTokensCallback = (session: Session) => Promise<Session | null>;

class UnauthenticatedError extends Error {}
class AbortError extends Error {}

class AuthController {
  readonly #emitter = mitt<{ session: Session | null }>();
  #session: Session | null = null;
  #refreshTimeout: Timeout | null = null;

  constructor(session: Session | null = null) {
    this.updateSession(session);
  }

  get session(): Session | null {
    return this.#session;
  }

  subscribe(listener: (session: Session | null) => void): () => void {
    this.#emitter.on("session", listener);

    return () => {
      this.#emitter.off("session", listener);
    };
  }

  async accessToken(
    signal?: AbortSignal | undefined
  ): Promise<Session["access"]> {
    if (this.#session && refreshDelayTime(this.#session) > 0) {
      return this.#session.access;
    }

    return new Promise<Session["access"]>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new AbortError());
        return;
      }

      const handleSession = (session: Session | null): void => {
        if (session) {
          resolve(session.access);
        } else {
          reject(new UnauthenticatedError());
        }

        this.#emitter.off("session", handleSession);
      };

      this.#emitter.on("session", handleSession);

      signal?.addEventListener("abort", () => {
        this.#emitter.off("session", handleSession);
      });
    });
  }

  updateSession(session: Session | null): void {
    if (
      session === this.#session ||
      (session &&
        this.#session &&
        session.access.payload.iat <= this.#session.access.payload.iat)
    ) {
      return;
    }

    const current = this.#session;
    this.#session = session;
    this.#refreshTimeout?.abort();

    if (session) {
      const delay = refreshDelayTime(session);
      console.log("Scheduling refreshing for ", delay, "ms");
      this.#refreshTimeout = new Timeout(() => this.#refresh(), delay);
    }

    if (session ? current?.user_id !== session.user_id : current) {
      this.#emitter.emit("session", session);
    }
  }

  #refresh(): void {
    if (!this.#session) {
      return;
    }

    if (canRefresh(this.#session)) {
      refreshTokens(this.#session).then(
        (session) => {
          this.updateSession(session);
        },
        (e) => {
          console.log("refresh error:", e);
          this.updateSession(null);
        }
      );
    } else {
      console.log("refresh token is too old to refresh");
      this.updateSession(null);
    }
  }
}

export const authController = new AuthController();
