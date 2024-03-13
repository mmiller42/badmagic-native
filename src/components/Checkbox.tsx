import React, { ReactNode } from "react";
import { Button, TouchableOpacity, View } from "react-native";

export type CheckboxProps = {
  children: ReactNode;
  checked: boolean;
  onChangeChecked: (checked: boolean) => void;
};

export function Checkbox({
  children,
  checked,
  onChangeChecked,
}: CheckboxProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <View>
        <Button
          title={checked ? "☒" : "☐"}
          onPress={() => onChangeChecked(!checked)}
          color="#222"
        />
      </View>
      <TouchableOpacity
        onPress={() => onChangeChecked(!checked)}
        style={{ flexGrow: 1 }}
      >
        {children}
      </TouchableOpacity>
    </View>
  );
}
