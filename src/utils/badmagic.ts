import json from "../assets/resident_workspace.json";

export type Workspace = {
  name: string;
  config: Config;
  routes: Route[];
};

export type Config = {
  baseUrl: string;
};

export type Route = {
  name: string;
  _nameLower: string;
  path: string;
  routeParams: Param[];
  method: "GET";
  qsParams: Param[];
  documentation: string;
  deprecated: boolean;
};

export type Param = {
  name: string;
  defaultValue: string;
  placeholder: string;
  description: string;
  options: ParamOption[] | null;
};

export type ParamOption = {
  label: string;
  value: string;
};

type RawParam = {
  name: string;
  defaultValue?: unknown | undefined;
  placeholder?: string | undefined;
  description?: string | undefined;
  options?: { label?: string | undefined; value: unknown }[] | undefined;
};

function getRouteParams(path: string): Param[] {
  return Array.from(path.matchAll(/:(\w+)/g)).map(([, name]) => ({
    name,
    defaultValue: "",
    placeholder: name,
    description: "",
    options: null,
  }));
}

export function routeToUri(
  path: string,
  params: Record<string, string>,
  qsParams: Record<string, string>
): string {
  const searchParams = new URLSearchParams(Object.entries(qsParams));
  const qs = Array.from(searchParams)
    .flatMap(([, [param, value]]) =>
      value ? [`${param}=${encodeURIComponent(value)}`] : []
    )
    .join("&");
  return (
    path.replaceAll(/:(\w+)/g, (_, param) => params[param]) +
    (qs ? `?${qs}` : "")
  );
}

export const workspace: Workspace = {
  name: json.name,
  config: {
    baseUrl: json.config.baseUrl,
  },
  routes: json.routes.map(
    ({ name, path, qsParams, documentation = "", deprecated = false }) => ({
      name,
      _nameLower: name.toLowerCase(),
      path: path.replace(/^\/?api\//, "/"),
      routeParams: getRouteParams(path),
      method: "GET" as const,
      qsParams:
        (qsParams as RawParam[] | undefined)?.map(
          ({
            name,
            defaultValue = "",
            description = "",
            placeholder = "",
            options = null,
          }) => ({
            name,
            defaultValue: String(defaultValue),
            description,
            placeholder: placeholder || name,
            options:
              options?.map(({ value, label = value }) => ({
                label: String(label),
                value: String(value),
              })) ?? null,
          })
        ) ?? [],
      documentation,
      deprecated,
    })
  ),
};
