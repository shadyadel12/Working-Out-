# Trainova mobile release policy

Public libraries, account deletion, payment/entitlement changes, new permissions, privacy behavior, native dependencies, and other major features must ship in a new App Store/Play Store binary with a new app version.

Expo OTA updates are limited to compatible bug fixes, copy/translation corrections, and minor JavaScript/UI adjustments that do not change the app's primary purpose, reviewed business model, native code, permissions, privacy behavior, or regulated functionality. Every OTA release must target the matching `runtimeVersion`, be tested against the installed binary, and be recorded in the changelog.
