package com.alphafreight.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onResume() {
        super.onResume();
        if (getBridge() != null) {
            getBridge().triggerJSEvent("appResume", "window");
        }
    }
}
