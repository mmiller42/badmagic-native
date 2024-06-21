import mitt from "mitt";

import { authenticate, RequestOptions } from "../api/auth";
import {
  getCredentials,
  putCredentials as _putCredentials,
  resetCredentials,
} from "../modules/keychain";
import { authController } from "./AuthController";

type Credentials = { email: string; password: string };
const SERVER = "BADMAGIC_QA";

async function fetchCredentials(): Promise<Credentials | null> {
  const credentials = await getCredentials(SERVER);
  console.log("got creds=", !!credentials);
  return credentials
    ? { email: credentials.username, password: credentials.password }
    : null;
}

async function putCredentials(credentials: Credentials | null): Promise<void> {
  if (credentials) {
    await _putCredentials(SERVER, credentials.email, credentials.password);
  } else {
    await resetCredentials(SERVER);
  }
}

class CredentialsController {
  readonly #emitter = mitt<{ credentials: Credentials | null }>();
  #credentials: Credentials | null = null;

  constructor(credentials: Credentials | null = null) {
    this.updateCredentials(credentials);
  }

  get credentials(): Credentials | null {
    return this.#credentials;
  }

  async updateCredentials(credentials: Credentials | null): Promise<void> {
    if (
      credentials === this.#credentials ||
      (credentials?.email === this.#credentials?.email &&
        credentials?.password === this.#credentials?.password)
    ) {
      return;
    }

    console.log("putting");

    await putCredentials(credentials);
    this.#credentials = credentials;
    this.#emitter.emit("credentials", credentials);
  }

  subscribe(listener: (credentials: Credentials | null) => void): () => void {
    this.#emitter.on("credentials", listener);

    return () => {
      this.#emitter.off("credentials", listener);
    };
  }

  async unlock(options?: RequestOptions): Promise<void> {
    let credentials: Credentials | null;
    try {
      credentials = await fetchCredentials();
    } catch {
      credentials = null;
    }

    const session = credentials
      ? await authenticate(credentials, options)
      : null;
    authController.updateSession(session);

    this.#credentials = credentials;
    this.#emitter.emit("credentials", credentials);
  }
}

export const credentialsController = new CredentialsController();
