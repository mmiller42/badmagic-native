import { Platform } from "react-native";
import {
  ACCESS_CONTROL,
  AUTHENTICATION_TYPE,
  getInternetCredentials,
  getSupportedBiometryType,
  Options,
  resetInternetCredentials,
  SECURITY_RULES,
  setInternetCredentials,
  STORAGE_TYPE,
} from "react-native-keychain";

const DEFAULT_TIMEOUT = 10_000;
const BIOMETRY_TIMEOUT = 30_000;

let runningOperation: Promise<unknown> = Promise.resolve();

class TimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new TimeoutError()), timeout);
    return promise
      .finally(() => clearTimeout(timeoutId))
      .then(resolve)
      .catch(reject);
  });
}

function enqueue<T>(timeout: number, task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve) => {
    const done = (): Promise<T> => {
      const next = withTimeout(task(), timeout);
      resolve(next);
      return next;
    };

    runningOperation = runningOperation.then(done, done);
  });
}

const biometrySupported = enqueue(DEFAULT_TIMEOUT, () =>
  getSupportedBiometryType()
)
  .then((type) => type !== null)
  .catch(() => false);

export async function isBiometrySupported(): Promise<boolean> {
  return await biometrySupported;
}

export async function putCredentials(
  server: string,
  username: string,
  password: string
): Promise<void> {
  // if (!(await isBiometrySupported())) {
  //   return;
  // }

  const set = async (): Promise<void> => {
    await setInternetCredentials(server, username, password, {
      rules: SECURITY_RULES.AUTOMATIC_UPGRADE,
    });
  };

  try {
    await enqueue(DEFAULT_TIMEOUT, set);
  } catch (e1) {
    console.warn("error from setCredentials:", e1);

    try {
      await enqueue(DEFAULT_TIMEOUT, () => resetInternetCredentials(server));
    } catch (e2) {
      console.warn("error resetting credentials:", e2);
      return;
    }

    try {
      await enqueue(DEFAULT_TIMEOUT, set);
    } catch (e3) {
      console.warn("error even after resetting credentials:", e3);
    }
  }

  console.log(
    "set internet credentials successfully:",
    server,
    username,
    password
  );
}

export class BiometryFailedError extends Error {}

export async function getCredentials(
  server: string
): Promise<{ server: string; username: string; password: string } | null> {
  // if (!(await isBiometrySupported())) {
  //   return null;
  // }

  const get = async (
    options?: Options
  ): Promise<{ server: string; username: string; password: string } | null> => {
    try {
      const result = await getInternetCredentials(server, {
        // accessControl: ACCESS_CONTROL.BIOMETRY_ANY,
        // authenticationType: AUTHENTICATION_TYPE.BIOMETRICS,
        rules: SECURITY_RULES.AUTOMATIC_UPGRADE,
        ...options,
      });

      console.log({ result, options });

      return result
        ? { server, username: result.username, password: result.password }
        : null;
    } catch (e) {
      if (e instanceof Error && /cancel|not correct/i.test(e.message)) {
        throw new BiometryFailedError();
      }

      throw e;
    }
  };

  try {
    return await enqueue(BIOMETRY_TIMEOUT, get);
  } catch (e1) {
    if (e1 instanceof BiometryFailedError) {
      throw e1;
    }

    console.warn("error from getCredentials:", e1);

    if (Platform.OS === "android") {
      try {
        return await enqueue(BIOMETRY_TIMEOUT, () =>
          get({ storage: STORAGE_TYPE.FB })
        );
      } catch (e2) {
        if (e2 instanceof BiometryFailedError) {
          throw e2;
        }

        console.warn("failed with FB storage type:", e2);
      }
    }

    return null;
  }
}

export async function resetCredentials(server: string): Promise<void> {
  await enqueue(DEFAULT_TIMEOUT, async () => {
    try {
      await resetInternetCredentials(server);
    } catch (e) {
      console.warn("resetInternetCredentials error:", e);
    }
  });
}

export async function getSecureItem<T>(key: string): Promise<T | null> {
  const get = async (options?: Options): Promise<T | null> => {
    const result = await getInternetCredentials(key, {
      rules: SECURITY_RULES.AUTOMATIC_UPGRADE,
      ...options,
    });
    return result ? jsonParse<T>(result.password) : null;
  };

  try {
    return await enqueue(DEFAULT_TIMEOUT, get);
  } catch (e1) {
    console.warn("error from getCredentials:", e1);

    if (Platform.OS === "android") {
      try {
        return await enqueue(BIOMETRY_TIMEOUT, () =>
          get({ storage: STORAGE_TYPE.FB })
        );
      } catch (e2) {
        console.warn("failed with FB storage type:", e2);
      }
    }

    return null;
  }
}

export async function putSecureItem<T>(key: string, value: T): Promise<void> {
  await putCredentials(key, key, JSON.stringify(value));
}

export async function removeSecureItem(key: string): Promise<void> {
  await resetCredentials(key);
}

class JsonParseError extends Error {
  readonly exception: Error;
  constructor(exception: Error) {
    super(exception.message);
    this.exception = exception;
  }
}

function jsonParse<T>(value: string): T {
  try {
    return JSON.parse(value) as T;
  } catch (e) {
    throw new JsonParseError(e instanceof Error ? e : new Error(String(e)));
  }
}
