import React, { ReactNode } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface AuroraBackgroundProps {
  children: ReactNode;
}

export default function AuroraBackground({ children }: AuroraBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* Aurora-like gradients */}
      <LinearGradient
        colors={["#F0F6FF", "#E3EDFF", "#D6E6FF"]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Subtle blue/indigo aurora shapes */}
      <LinearGradient
        colors={["#B3C7F7AA", "transparent"]}
        start={{ x: 0.2, y: 0.1 }}
        end={{ x: 0.8, y: 0.7 }}
        style={[
          styles.aurora,
          { top: -80, left: -60, width: width * 0.9, height: height * 0.4, borderRadius: 300 },
        ]}
      />
      <LinearGradient
        colors={["#A5B4FC88", "transparent"]}
        start={{ x: 0.8, y: 0.2 }}
        end={{ x: 0.2, y: 1 }}
        style={[
          styles.aurora,
          { bottom: -60, right: -40, width: width * 0.7, height: height * 0.3, borderRadius: 200 },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  aurora: {
    position: "absolute",
    opacity: 0.45,
  },
  content: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
}); 