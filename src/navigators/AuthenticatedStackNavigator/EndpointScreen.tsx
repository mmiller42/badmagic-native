import { useQuery } from "@tanstack/react-query";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";

import { ApiQueryKey } from "../../providers/QueryClientProvider";
import { Param, routeToUri, workspace } from "../../utils/badmagic";
import { AuthenticatedStackScreenProps } from "../AuthenticatedStackNavigator";

type Params = Record<string, string>;

export function EndpointScreen({
  navigation,
  route: { params },
}: AuthenticatedStackScreenProps<"Endpoint">) {
  const route = useMemo(() => {
    return workspace.routes.find((route) => route.path === params.path);
  }, [params.path]);

  console.log(route);

  useEffect(() => {
    if (route) {
      navigation.setOptions({ title: route.name });
    }
  }, [route, navigation]);

  const [routeParams, setRouteParams] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (route?.routeParams ?? []).map(({ name, defaultValue }) => [
        name,
        defaultValue,
      ])
    )
  );
  const [qsParams, setQsParams] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (route?.qsParams ?? []).map(({ name, defaultValue }) => [
        name,
        defaultValue,
      ])
    )
  );

  const uri = useMemo(
    () => (route?.path ? routeToUri(route.path, routeParams, qsParams) : ""),
    [route?.path, routeParams, qsParams]
  );

  const [queryKey, setQueryKey] = useState<ApiQueryKey | null>(null);
  const query = useQuery({ queryKey: queryKey!, enabled: queryKey !== null });

  const disabled = useMemo(
    () => Object.values(routeParams).some((param) => !param.trim()),
    [routeParams]
  );
  const json = useMemo(
    () => (query.data ? JSON.stringify(query.data, null, 2) : null),
    [query.data]
  );

  return !route ? null : (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flexGrow: 1 }}
        contentContainerStyle={{ padding: 16 }}
      >
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 18 }}>{uri}</Text>
          <View style={{ gap: 8, padding: 16 }}>
            {route.routeParams.map((param) => (
              <ParamField
                key={param.name}
                param={param}
                params={routeParams}
                setParams={setRouteParams}
              />
            ))}
            {route.qsParams.map((param) => (
              <ParamField
                key={param.name}
                param={param}
                params={qsParams}
                setParams={setQsParams}
              />
            ))}
          </View>
          {query.data ? (
            <Text style={{ fontFamily: "monospace" }}>{json}</Text>
          ) : null}
        </View>
      </ScrollView>
      <View>
        <Button
          title="Submit"
          onPress={() => {
            setQueryKey([route.path, routeParams, qsParams]);
          }}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

function ParamField({
  param: { name, placeholder, description },
  params,
  setParams,
}: {
  param: Param;
  params: Params;
  setParams: Dispatch<SetStateAction<Params>>;
}) {
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flexGrow: 1 }}>
          <Text>{name}</Text>
        </View>
        <View style={{ flexBasis: 200 }}>
          <TextInput
            placeholder={placeholder}
            value={params[name]}
            onChangeText={(value) =>
              setParams((params) => ({ ...params, [name]: value }))
            }
          />
        </View>
      </View>
      {description ? <Text>{description}</Text> : null}
    </View>
  );
}
