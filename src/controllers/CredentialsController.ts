import mitt from "mitt";
import {
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  getInternetCredentials,
  hasInternetCredentials,
  resetInternetCredentials,
  setInternetCredentials,
} from "react-native-keychain";

import { authenticate } from "../api/auth";
import { authController } from "./AuthController";

type Credentials = { email: string; password: string };
const SERVER = "BADMAGIC_QA";

async function fetchCredentials(): Promise<Credentials | null> {
  let startedAt = Date.now();
  console.log("fetching at", new Date());

  try {
    if (!(await hasInternetCredentials(SERVER))) {
      console.log("no creds after", Date.now() - startedAt, "ms");
      return null;
    }

    console.log("hasCreds=true after", Date.now() - startedAt, "ms");
    const credentials = await getInternetCredentials(SERVER);
    console.log(
      "got creds=",
      !!credentials,
      "after",
      Date.now() - startedAt,
      "ms"
    );
    return credentials
      ? (JSON.parse(credentials.password) as Credentials)
      : null;
  } catch (e) {
    console.log("fetchCredentials error:", e);

    try {
      await resetInternetCredentials(SERVER);
    } catch (e) {
      console.log("failed to reset:", e);
    }

    return null;
  }
}

async function putCredentials(credentials: Credentials | null): Promise<void> {
  try {
    await getInternetCredentials(SERVER);
  } catch (e) {
    console.log("getInternetCredentials error:", e);
    throw new Error("failed prompt");
  }

  try {
    if (!credentials) {
      await resetInternetCredentials(SERVER);
    } else {
      await setInternetCredentials(
        SERVER,
        SERVER,
        JSON.stringify(credentials),
        {
          accessControl: ACCESS_CONTROL.DEVICE_PASSCODE,
          accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
        }
      );
    }
  } catch (e) {
    console.log("putCredentials error:", e);
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

  // throws if creds are bad! which is good!
  async initialize(): Promise<void> {
    const credentials = await fetchCredentials();

    if (credentials) {
      const session = await authenticate(credentials);
      authController.updateSession(session);
    }

    this.#credentials = credentials;
    this.#emitter.emit("credentials", credentials);
  }
}

export const credentialsController = new CredentialsController();
