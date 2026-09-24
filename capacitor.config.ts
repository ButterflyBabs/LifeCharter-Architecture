import type { CapacitorConfig } from "@capacitor/cli";

// The LifeCharter Collective iPhone app. It loads the live Collective
// (lccommandsuite.com/community) inside a native shell that adds Apple push
// notifications, haptics, a launch screen, universal links and an offline
// screen. The web app detects it via the user agent / Capacitor bridge and
// hides anything App Store rules don't allow in-app (e.g. buying Plus).
const config: CapacitorConfig = {
  appId: "com.lifecharter.collective",
  appName: "LifeCharter Collective",
  webDir: "capacitor-www",
  server: {
    url: "https://lccommandsuite.com/community",
    errorPath: "offline.html",
    allowNavigation: ["lccommandsuite.com"],
  },
  appendUserAgent: "LifeCharterCollectiveApp/1.0",
  backgroundColor: "#FAF8F3",
  ios: {
    contentInset: "never", // the web layout already pads for the notch and home bar (viewport-fit=cover)
    scheme: "LifeCharterCollective",
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#FAF8F3",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Keyboard: {
      resize: "native",
    },
  },
};

export default config;
