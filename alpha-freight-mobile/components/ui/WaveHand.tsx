import { StyleSheet, View } from "react-native";
import LottieView from "lottie-react-native";

type WaveHandProps = {
  size?: number;
};

export default function WaveHand({ size = 34 }: WaveHandProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <LottieView
        source={require("@/assets/animations/wave-hand.json")}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: -2,
    marginLeft: -6,
    marginRight: -2,
  },
});
