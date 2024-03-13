import React, { ReactNode } from "react";
import { ColorValue, View, ViewProps } from "react-native";

export type PillProps = {
  children: ReactNode;
  color: ColorValue;
} & ViewProps;

export function Pill({ children, color, style, ...rest }: PillProps) {
  return (
    <View style={{ flexDirection: "row", alignSelf: "flex-start" }}>
      <View
        style={[
          {
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: color,
            borderRadius: 8,
          },
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    </View>
  );
}
