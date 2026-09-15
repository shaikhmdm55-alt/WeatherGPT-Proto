#!/bin/bash
set -e

echo "=== Building Android APK for WeatherGPT ==="

WORKSPACE_DIR="$(pwd)"
BUILD_DIR="/tmp/android_apk_build"
SRC_APK_DIR="$WORKSPACE_DIR/src"
PUBLIC_APK_DIR="$WORKSPACE_DIR/public"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/src/com/weathergpt/app"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/res/drawable"
mkdir -p "$BUILD_DIR/assets"
mkdir -p "$BUILD_DIR/obj"
mkdir -p "$BUILD_DIR/bin"

# 1. Generate Manifest
cat << 'EOF' > "$BUILD_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.weathergpt.app"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/ic_launcher"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:allowBackup="true">
        <activity
            android:name="com.weathergpt.app.MainActivity"
            android:exported="true"
            android:label="@string/app_name"
            android:configChanges="orientation|keyboardHidden|screenSize|screenLayout|smallestScreenSize"
            android:theme="@android:style/Theme.NoTitleBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 2. Strings resource
cat << 'EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">WeatherGPT</string>
</resources>
EOF

# 3. Generate Launcher Icon (Emerald Shield Green)
python3 -c "
import zlib, struct

def make_png(width, height, r, g, b):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)
        for x in range(width):
            # circle mask
            dx = (x - width / 2.0) / (width / 2.0)
            dy = (y - height / 2.0) / (height / 2.0)
            if dx*dx + dy*dy <= 0.85:
                raw_data.extend([r, g, b, 255])
            else:
                raw_data.extend([15, 23, 42, 255]) # Slate-900 background
    compressed = zlib.compress(bytes(raw_data))
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data))
    png.extend(struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + ihdr_crc)
    idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + compressed))
    png.extend(struct.pack('>I', len(compressed)) + b'IDAT' + compressed + idat_crc)
    iend_crc = struct.pack('>I', zlib.crc32(b'IEND'))
    png.extend(struct.pack('>I', 0) + b'IEND' + iend_crc)
    return bytes(png)

with open('$BUILD_DIR/res/drawable/ic_launcher.png', 'wb') as f:
    f.write(make_png(72, 72, 16, 185, 129))
"

# 4. Copy Web Distribution to Assets
echo "Copying web dist assets..."
cp -r "$WORKSPACE_DIR/dist/"* "$BUILD_DIR/assets/"

# 5. Generate R.java
echo "Generating R.java with aapt..."
aapt package -m \
  -J "$BUILD_DIR/src" \
  -M "$BUILD_DIR/AndroidManifest.xml" \
  -S "$BUILD_DIR/res" \
  -I /usr/lib/android-sdk/platforms/android-23/android.jar

# 6. Create MainActivity.java
cat << 'EOF' > "$BUILD_DIR/src/com/weathergpt/app/MainActivity.java"
package com.weathergpt.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.webkit.GeolocationPermissions;
import android.graphics.Color;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        
        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#020617"));
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setGeolocationEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });

        // Load offline local application bundle from APK assets
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
EOF

# 7. Compile Java to Bytecode
echo "Compiling Java sources..."
javac -source 8 -target 8 \
  -bootclasspath /usr/lib/android-sdk/platforms/android-23/android.jar \
  -d "$BUILD_DIR/obj" \
  "$BUILD_DIR/src/com/weathergpt/app/R.java" \
  "$BUILD_DIR/src/com/weathergpt/app/MainActivity.java"

# 8. Convert to Dalvik Executable (classes.dex)
echo "Converting bytecode to Dalvik DEX..."
/usr/bin/dalvik-exchange --dex \
  --output="$BUILD_DIR/bin/classes.dex" \
  "$BUILD_DIR/obj"

# 9. Package APK with aapt
echo "Packaging APK..."
aapt package -f \
  -M "$BUILD_DIR/AndroidManifest.xml" \
  -S "$BUILD_DIR/res" \
  -A "$BUILD_DIR/assets" \
  -I /usr/lib/android-sdk/platforms/android-23/android.jar \
  -F "$BUILD_DIR/bin/weathergpt.unsigned.apk"

# 10. Add classes.dex to APK
cd "$BUILD_DIR/bin"
aapt add weathergpt.unsigned.apk classes.dex
cd "$WORKSPACE_DIR"

# 11. Generate Android Debug Keystore
echo "Generating signing key..."
KEYSTORE="$BUILD_DIR/debug.keystore"
keytool -genkeypair -v \
  -keystore "$KEYSTORE" \
  -alias androiddebugkey \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass android \
  -keypass android \
  -dname "CN=WeatherGPT,O=Agriculture,C=IN"

# 12. Sign APK with apksigner (v1 and v2 signature)
echo "Signing APK with apksigner..."
apksigner sign \
  --ks "$KEYSTORE" \
  --ks-pass pass:android \
  --ks-key-alias androiddebugkey \
  --key-pass pass:android \
  --out "$BUILD_DIR/bin/WeatherGPT-debug.apk" \
  "$BUILD_DIR/bin/weathergpt.unsigned.apk"

# 13. Verify Signature
echo "Verifying APK..."
apksigner verify -v "$BUILD_DIR/bin/WeatherGPT-debug.apk"

# 14. Copy to target project folders
mkdir -p "$SRC_APK_DIR"
mkdir -p "$PUBLIC_APK_DIR"

cp "$BUILD_DIR/bin/WeatherGPT-debug.apk" "$SRC_APK_DIR/weathergpt.apk"
cp "$BUILD_DIR/bin/WeatherGPT-debug.apk" "$SRC_APK_DIR/WeatherGPT-debug.apk"
cp "$BUILD_DIR/bin/WeatherGPT-debug.apk" "$PUBLIC_APK_DIR/weathergpt.apk"

echo "=== APK Successfully Created! ==="
ls -lh "$SRC_APK_DIR/weathergpt.apk" "$SRC_APK_DIR/WeatherGPT-debug.apk" "$PUBLIC_APK_DIR/weathergpt.apk"
