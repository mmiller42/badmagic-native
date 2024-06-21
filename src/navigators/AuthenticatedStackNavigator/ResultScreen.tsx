import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo } from "react";
import { ScrollView, Text, View } from "react-native";

import { AuthenticatedStackScreenProps } from "../AuthenticatedStackNavigator";
import { useBadMagicRoute, useBadMagicUri } from "../../hooks/badmagic";

export function ResultScreen({
  navigation,
  route: {
    params: { queryKey },
  },
}: AuthenticatedStackScreenProps<"Result">) {
  const [path, routeParams, qsParams] = queryKey;

  const route = useBadMagicRoute(path);
  const uri = useBadMagicUri(route, routeParams, qsParams);

  useEffect(() => {
    if (uri) {
      navigation.setOptions({ title: route?.name });
    }
  }, [route.name, navigation]);

  const query = useQuery({ queryKey });

  const json = useMemo(
    () => (query.data ? JSON.stringify(query.data, null, 2) : null),
    [query.data]
  );

  return !route ? null : (
    <View style={{ flex: 1 }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomColor: "gray",
          borderBottomWidth: 1,
          backgroundColor: "white",
        }}
      >
        <Text style={{ fontSize: 18 }}>{uri}</Text>
      </View>
      <ScrollView
        style={{ flexGrow: 1 }}
        contentContainerStyle={{ padding: 16 }}
      >
        {query.data ? (
          <Text style={{ fontFamily: "monospace" }}>{json}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
