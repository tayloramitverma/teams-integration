// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export const localStorageAvailable = typeof Storage !== "undefined";

export const LocalStorageKeys = {
  DisplayName: "DisplayName",
  Theme: "AzureCommunicationUI_Theme",
};

/**
 * Get display name from local storage.
 */
export const getDisplayNameFromLocalStorage = () =>
  window.localStorage.getItem(LocalStorageKeys.DisplayName);

/**
 * Save display name into local storage.
 */
export const saveDisplayNameToLocalStorage = (displayName) =>
  window.localStorage.setItem(LocalStorageKeys.DisplayName, displayName);

/**
 * Get theme from local storage.
 */
export const getThemeFromLocalStorage = (scopeId) =>
  window.localStorage.getItem(LocalStorageKeys.Theme + "_" + scopeId);

/**
 * Save theme into local storage.
 */
export const saveThemeToLocalStorage = (theme, scopeId) =>
  window.localStorage.setItem(LocalStorageKeys.Theme + "_" + scopeId, theme);
