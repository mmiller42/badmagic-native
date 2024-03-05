import { jwtDecode } from "jwt-decode";
import { axios } from "../utils/axios";
import { isAxiosError } from "axios";

type TokensResponse = {
  data: {
    access_token: string;
    refresh_token: string;
    expires: number;
    user_id: number;
  };
};

type TwoFactorResponse = {
  data: {
    tfa_api_token: string;
  };
};

function isTokensResponse(
  response: TokensResponse | TwoFactorResponse
): response is TokensResponse {
  return "access_token" in response.data;
}

function isTwoFactorResponse(
  response: TokensResponse | TwoFactorResponse
): response is TwoFactorResponse {
  return "tfa_api_token" in response.data;
}

export type AuthenticateRequest = {
  email: string;
  password: string;
};

type TokenPayload<TType extends "access" | "refresh" = "access" | "refresh"> = {
  typ: TType;
  exp: number;
  sub: string;
  aud: "community_manager";
  iss: "community_manager";
  kid: string;
  iat: number;
  jti: string;
  nbf: number;
};

export type Session = {
  user_id: number;
  access: {
    token: string;
    payload: TokenPayload<"access">;
  };
  refresh: {
    token: string;
    payload: TokenPayload<"refresh">;
  };
};

function formatSession(data: TokensResponse): Session {
  return {
    user_id: data.data.user_id,
    access: {
      token: data.data.access_token,
      payload: jwtDecode(data.data.access_token) as TokenPayload<"access">,
    },
    refresh: {
      token: data.data.refresh_token,
      payload: jwtDecode(data.data.refresh_token) as TokenPayload<"refresh">,
    },
  };
}

function handleAuthenticateError(error: unknown): never {
  if (isAxiosError(error) && error.response) {
    switch (error.response.status) {
      case 401:
        throw new NoUnitsError();
      case 403:
        throw new AccountLockedError();
      case 422:
        throw new BadCredentialsError();
    }
  }

  throw error;
}

export class TwoFactorError extends Error {
  readonly tfa_api_token: string;

  constructor(tfa_api_token: string, message?: string | undefined) {
    super(message);
    this.tfa_api_token = tfa_api_token;
  }
}

export class BadCredentialsError extends Error {}

export class NoUnitsError extends Error {}

export class AccountLockedError extends Error {}

export class SessionExpiredError extends Error {}

export async function authenticate({
  email,
  password,
}: AuthenticateRequest): Promise<Session> {
  try {
    const { data } = await axios.post<TokensResponse | TwoFactorResponse>(
      "/v1/sessions",
      { email, password }
    );

    if (isTwoFactorResponse(data)) {
      throw new TwoFactorError(data.data.tfa_api_token);
    }

    return formatSession(data);
  } catch (e) {
    handleAuthenticateError(e);
  }
}

export type TwoFactorAuthenticateRequest = {
  tfa_api_token: string;
  token: string;
};

export async function twoFactorAuthenticate({
  tfa_api_token,
  token,
}: TwoFactorAuthenticateRequest): Promise<Session> {
  try {
    const { data } = await axios.post<TokensResponse>("/v1/sessions", {
      tfa_api_token,
      token,
    });

    return formatSession(data);
  } catch (e) {
    handleAuthenticateError(e);
  }
}

export type RefreshRequest = {
  token: string;
};

export async function refreshCredentials({
  token,
}: RefreshRequest): Promise<Session> {
  try {
    const { data } = await axios.post<TokensResponse>(
      "/v1/tokens",
      {},
      {
        headers: { "authorization-x-refresh": token },
      }
    );

    return formatSession(data);
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 401) {
      throw new SessionExpiredError();
    }

    throw e;
  }
}
