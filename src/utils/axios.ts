import Axios, { CreateAxiosDefaults, isAxiosError } from "axios";

import { authController } from "../controllers/AuthController";

const config: CreateAxiosDefaults<unknown> = {
  baseURL: "https://control.smartrent-qa.com/api",
};

export const unauthenticated = Axios.create(config);

function interceptResponseError(error: unknown): never {
  if (isAxiosError(error)) {
    console.log("request url:", error.request.responseURL);
    console.log("response:", error.response?.status, error.response?.data);
  }

  throw error;
}

unauthenticated.interceptors.response.use(undefined, interceptResponseError);

export const authenticated = Axios.create(config);

authenticated.interceptors.request.use(async (config) => {
  const accessToken = await authController.accessToken(
    config.signal as AbortSignal | undefined
  );
  console.log({ accessToken });
  config.headers.set("Authorization", `Bearer ${accessToken.token}`);

  return config;
});

authenticated.interceptors.response.use(undefined, interceptResponseError);
