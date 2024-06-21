import { isAxiosError } from "axios";
import { jwtDecode } from "jwt-decode";

import { unauthenticated } from "../utils/axios";

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

export type TokensResponse = {
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

export type RequestOptions = { signal?: AbortSignal | undefined };

export type AuthenticateRequest = {
  email: string;
  password: string;
};

export async function authenticate(
  { email, password }: AuthenticateRequest,
  { signal }: RequestOptions = {}
): Promise<TokensResponse> {
  try {
    const { data } = await unauthenticated.post<
      TokensApiResponse | TwoFactorApiResponse
    >("/v1/sessions", { email, password }, { signal });

    if (isTwoFactorResponse(data)) {
      throw new TwoFactorCodeRequiredError(data.data.tfa_api_token);
    }

    return formatTokensResponse(data);
  } catch (e) {
    handleAuthenticateError(e);
  }
}

export type TwoFactorAuthenticateRequest = {
  tfa_api_token: string;
  token: string;
};

export async function twoFactorAuthenticate(
  { tfa_api_token, token }: TwoFactorAuthenticateRequest,
  { signal }: RequestOptions = {}
): Promise<TokensResponse> {
  try {
    const { data } = await unauthenticated.post<TokensApiResponse>(
      "/v1/sessions",
      { tfa_api_token, token },
      { signal }
    );

    return formatTokensResponse(data);
  } catch (e) {
    handleAuthenticateError(e, true);
  }
}

export type RefreshRequest = {
  token: string;
};

export async function refreshTokens(
  { token }: RefreshRequest,
  { signal }: RequestOptions = {}
): Promise<TokensResponse> {
  try {
    const { data } = await unauthenticated.post<TokensApiResponse>(
      "/v1/tokens",
      {},
      {
        headers: { "authorization-x-refresh": token },
        signal,
      }
    );

    return formatTokensResponse(data);
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 401) {
      throw new SessionExpiredError();
    }

    throw e;
  }
}

type TokensApiResponse = {
  data: {
    access_token: string;
    refresh_token: string;
    expires: number;
    user_id: number;
    tfa_api_token?: never;
  };
};

type TwoFactorApiResponse = {
  data: {
    tfa_api_token: string;
    access_token?: never;
    refresh_token?: never;
    expires?: never;
    user_id?: never;
  };
};

function isTwoFactorResponse(
  response: TokensApiResponse | TwoFactorApiResponse
): response is TwoFactorApiResponse {
  return "tfa_api_token" in response.data;
}

function formatTokensResponse(data: TokensApiResponse): TokensResponse {
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

function handleAuthenticateError(
  error: unknown,
  mfaRequest: boolean = false
): never {
  if (isAxiosError(error) && error.response) {
    switch (error.response.status) {
      case 401:
        if (
          mfaRequest &&
          error.response.data?.errors?.[0]?.description === "Invalid code"
        ) {
          throw new BadCredentialsError();
        } else {
          throw new NoUnitsError();
        }
      case 403:
        throw new AccountLockedError();
      case 422:
        throw new BadCredentialsError();
    }
  }

  throw error;
}

export class TwoFactorCodeRequiredError extends Error {
  readonly tfa_api_token: string;

  constructor(tfa_api_token: string, message?: string | undefined) {
    super(message);
    this.tfa_api_token = tfa_api_token;
  }
}

export class BadLoginRequestBaseError extends Error {}

export class BadCredentialsError extends BadLoginRequestBaseError {}

export class NoUnitsError extends BadLoginRequestBaseError {}

export class AccountLockedError extends BadLoginRequestBaseError {}

export class SessionExpiredError extends Error {}
