import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import {
  Button,
  FlatList,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { resetInternetCredentials } from "react-native-keychain";

import { Checkbox } from "../../components/Checkbox";
import { Pill } from "../../components/Pill";
import { Route, workspace } from "../../utils/badmagic";
import { AuthenticatedStackParamsList } from "../AuthenticatedStackNavigator";

const allParams = new Set();
workspace.routes.forEach((route) => {
  route.routeParams.forEach((param) => allParams.add(param.name));
});
console.log(allParams);

const activeRoutes = workspace.routes.filter((route) => !route.deprecated);

export function EndpointsScreen() {
  const [search, setSearch] = useState("");
  const [deprecated, setDeprecated] = useState(false);

  const routes = useMemo(() => {
    const routes = deprecated ? workspace.routes : activeRoutes;

    const q = search.trim().toLowerCase();

    if (!q) {
      return routes;
    }

    return routes.filter(
      (route) => route._nameLower.includes(q) || route.path.includes(q)
    );
  }, [search, deprecated]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ gap: 16, padding: 16, backgroundColor: "#222" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            borderColor: "#000",
            borderWidth: 1,
          }}
        >
          <View style={{ flexGrow: 1 }}>
            <TextInput
              placeholder="Search"
              value={search}
              onChangeText={setSearch}
              style={{ paddingLeft: 12 }}
            />
          </View>
          <View>
            <Button title="ⓧ" onPress={() => setSearch("")} color="#222" />
          </View>
        </View>
        <Checkbox checked={deprecated} onChangeChecked={setDeprecated}>
          <Text>Show deprecated routes</Text>
        </Checkbox>
      </View>
      <FlatList
        data={routes}
        renderItem={({ item }) => <EndpointItem route={item} />}
        style={{ flexGrow: 1 }}
      />
      <Button
        title="Log Out"
        onPress={() => resetInternetCredentials("BADMAGIC_QA")}
      />
    </SafeAreaView>
  );
}

const DEPRECATED_PILL = (
  <Pill color="red">
    <Text style={{ fontSize: 12, fontWeight: "bold", color: "white" }}>
      deprecated
    </Text>
  </Pill>
);

function EndpointItem({ route: { name, path, deprecated } }: { route: Route }) {
  const { navigate } =
    useNavigation<NativeStackNavigationProp<AuthenticatedStackParamsList>>();

  return (
    <TouchableOpacity
      onPress={() => navigate("Endpoint", { path })}
      style={{ padding: 16 }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <View style={{ flexShrink: 1 }}>
          <View style={{}}>
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={{ fontSize: 16, fontWeight: "600" }}
            >
              {name}
            </Text>
            <Text adjustsFontSizeToFit numberOfLines={2}>
              {path}
            </Text>
          </View>
        </View>
        <View>{deprecated ? DEPRECATED_PILL : null}</View>
      </View>
    </TouchableOpacity>
  );
}
