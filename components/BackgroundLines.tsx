import React from "react";
import { Dimensions } from "react-native";
import { MotiView } from "moti";
import Svg, { Path } from "react-native-svg";
import { Easing } from "react-native-reanimated";

const { width, height } = Dimensions.get("window");
const DIAMONDS = 120; // הרבה יהלומים

export default function BackgroundDiamonds() {
  const diamonds = Array.from({ length: DIAMONDS });

  return (
    <>
      {diamonds.map((_, index) => {
        const size = Math.random() * 8 + 8; // יהלומים קטנים-בינוניים
        const startX = Math.random() * width;
        const initialY = height * 0.4 + Math.random() * (height * 0.9);
        const endY = -150;
        const delay = Math.random() * 5000;
        const duration = 12000 + Math.random() * 3000;

        return (
          <MotiView
            key={index}
            from={{ translateY: initialY, opacity: 0 }}
            animate={{ translateY: endY, opacity: 0.8 }}
            transition={{
              type: "timing",
              duration,
              delay,
              repeat: Infinity,
              repeatReverse: false,
              easing: Easing.linear,
            }}
            style={{
              position: "absolute",
              top: 0,
              left: startX,
              width: size,
              height: size,
            }}
          >
            <Svg width={size} height={size} viewBox="0 0 100 100">
              <Path
                d="M10,30 L30,10 L70,10 L90,30 L50,90 Z"
                fill="rgba(255, 255, 255, 0.13)" // מילוי עדין שקוף
                stroke="rgba(255, 255, 255, 0.5)" // קו תוחם ברור
                strokeWidth="2"
              />
            </Svg>
          </MotiView>
        );
      })}
    </>
  );
}
