/**
 * @format
 */

import "./src/polyfills/base64";
import "./src/polyfills/console";

import { AppRegistry } from "react-native";

import { name as appName } from "./app.json";
import { App } from "./src/App";

AppRegistry.registerComponent(appName, () => App);
