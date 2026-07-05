import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

const KEYPAD_ROWS: { digit: string; letters?: string }[][] = [
  [
    { digit: "1" },
    { digit: "2", letters: "ABC" },
    { digit: "3", letters: "DEF" },
  ],
  [
    { digit: "4", letters: "GHI" },
    { digit: "5", letters: "JKL" },
    { digit: "6", letters: "MNO" },
  ],
  [
    { digit: "7", letters: "PQRS" },
    { digit: "8", letters: "TUV" },
    { digit: "9", letters: "WXYZ" },
  ],
];

type PinKeypadProps = {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
};

export default function PinKeypad({ onDigit, onBackspace, disabled = false }: PinKeypadProps) {
  return (
    <View style={styles.wrap}>
      {KEYPAD_ROWS.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((key) => (
            <Pressable
              key={key.digit}
              style={({ pressed }) => [
                styles.key,
                pressed && !disabled && styles.keyPressed,
                disabled && styles.keyDisabled,
              ]}
              disabled={disabled}
              onPress={() => onDigit(key.digit)}
            >
              <Text style={styles.keyDigit}>{key.digit}</Text>
              {key.letters ? <Text style={styles.keyLetters}>{key.letters}</Text> : <View style={styles.lettersSpacer} />}
            </Pressable>
          ))}
        </View>
      ))}

      <View style={styles.row}>
        <View style={styles.keyGhost} />
        <Pressable
          style={({ pressed }) => [
            styles.key,
            pressed && !disabled && styles.keyPressed,
            disabled && styles.keyDisabled,
          ]}
          disabled={disabled}
          onPress={() => onDigit("0")}
        >
          <Text style={styles.keyDigit}>0</Text>
          <View style={styles.lettersSpacer} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.key,
            styles.backspaceKey,
            pressed && !disabled && styles.keyPressed,
            disabled && styles.keyDisabled,
          ]}
          disabled={disabled}
          onPress={onBackspace}
        >
          <Ionicons name="backspace-outline" size={24} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

export function PinDots({
  length,
  filled,
  error = false,
}: {
  length: number;
 filled: number;
  error?: boolean;
}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length }).map((_, index) => {
        const active = index < filled;
        return (
          <View
            key={`dot-${index}`}
            style={[
              styles.dot,
              active && styles.dotFilled,
              error && active && styles.dotError,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    gap: 8,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
  },
  key: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
  },
  keyGhost: {
    width: 78,
    height: 78,
  },
  backspaceKey: {
    justifyContent: "center",
  },
  keyPressed: {
    backgroundColor: colors.inputFill,
  },
  keyDisabled: {
    opacity: 0.45,
  },
  keyDigit: {
    fontSize: 32,
    fontWeight: "400",
    color: colors.ink,
    lineHeight: 36,
  },
  keyLetters: {
    marginTop: -2,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: colors.mutedLight,
  },
  lettersSpacer: {
    height: 12,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    minHeight: 24,
    marginBottom: 28,
  },
  dot: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E8EDF2",
  },
  dotFilled: {
    backgroundColor: colors.brand,
  },
  dotError: {
    backgroundColor: colors.danger,
  },
});
