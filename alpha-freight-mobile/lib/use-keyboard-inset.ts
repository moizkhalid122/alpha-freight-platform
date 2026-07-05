import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  type KeyboardEvent,
} from "react-native";
import { useWindowDimensions } from "react-native";

function insetFromEvent(event: KeyboardEvent, windowHeight: number): number {
  const { screenY } = event.endCoordinates;
  return Math.max(0, Math.round(windowHeight - screenY));
}

export function useKeyboardInset() {
  const { height: windowHeight } = useWindowDimensions();
  const [inset, setInset] = useState(0);
  const lastEventRef = useRef<KeyboardEvent | null>(null);

  const applyInset = useCallback((event: KeyboardEvent | null) => {
    if (!event) {
      setInset(0);
      return;
    }

    const height = Dimensions.get("window").height;
    setInset(insetFromEvent(event, height));
  }, []);

  useEffect(() => {
    if (lastEventRef.current) {
      applyInset(lastEventRef.current);
    }
  }, [windowHeight, applyInset]);

  useEffect(() => {
    const onShow = (event: KeyboardEvent) => {
      lastEventRef.current = event;
      applyInset(event);
    };

    const onHide = () => {
      lastEventRef.current = null;
      setInset(0);
    };

    const onFrame = (event: KeyboardEvent) => {
      lastEventRef.current = event;
      applyInset(event);
    };

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subscriptions = [
      Keyboard.addListener(showEvent, onShow),
      Keyboard.addListener(hideEvent, onHide),
    ];

    if (Platform.OS === "ios") {
      subscriptions.push(Keyboard.addListener("keyboardWillChangeFrame", onFrame));
    }

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [applyInset]);

  return {
    inset,
    isVisible: inset > 0,
  };
}
