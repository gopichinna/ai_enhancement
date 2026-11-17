/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module" ], function(module) {
  const DEFAULT_THEME = "cf";
  const JATO_DARK = "dark";
  const JATO_LIGHT = "light";
  const DEFAULT_VALUE_FOR_ENABLE_THEME_SELECTION = true;
  const APPLY_DEFAULT = true;
  const themes = {
    DEFAULT_THEME: DEFAULT_THEME,
    JATO_DARK: JATO_DARK,
    JATO_LIGHT: JATO_LIGHT
  };
  const defaultConfig = {
    theme: DEFAULT_THEME,
    enableThemeSelection: DEFAULT_VALUE_FOR_ENABLE_THEME_SELECTION,
    applyDefault: APPLY_DEFAULT
  };
  const moduleConfig = module.config() ?? {};
  let themingConfig = {
    ...defaultConfig,
    ...moduleConfig
  };
  const SUPPORTED_THEMES = [ DEFAULT_THEME, JATO_DARK, JATO_LIGHT ];
  const getConfig = () => {
    return themingConfig;
  };
  const getTheme = () => {
    const config = getConfig();
    let theme = config["theme"] ?? "";
    theme = theme.toLowerCase();
    theme = SUPPORTED_THEMES.indexOf(theme) === -1 ? DEFAULT_THEME : theme;
    return theme;
  };
  const storeTheme = (theme = DEFAULT_THEME) => {
    saveTheme(theme);
  };
  const saveTheme = (theme = DEFAULT_THEME) => {
    themingConfig["theme"] = theme;
  };
  const applyTheme = (element, themeName) => {
    const config = getConfig();
    if (element === undefined && config.applyDefault) {
      element = document.documentElement;
    }
    const theme = themeName ?? getTheme();
    element && (element.dataset.smartTheme = theme);
  };
  const isJATOTheme = () => {
    const theme = getTheme();
    return theme !== DEFAULT_THEME;
  };
  const isThemeSelectionEnabled = () => {
    return getConfig().enableThemeSelection;
  };
  return {
    getTheme: getTheme,
    applyTheme: applyTheme,
    isJATOTheme: isJATOTheme,
    themes: themes,
    isThemeSelectionEnabled: isThemeSelectionEnabled,
    saveTheme: saveTheme,
    storeTheme: storeTheme
  };
});