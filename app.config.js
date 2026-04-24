const appJson = require("./app.json");
const themeColors = require("./constants/theme.colors.json");

module.exports = () => {
  const config = appJson.expo;

  return {
    ...config,
    android: {
      ...config.android,
      adaptiveIcon: {
        ...config.android.adaptiveIcon,
        backgroundColor: themeColors.light.surfaceAlt,
      },
    },
    plugins: config.plugins.map((plugin) => {
      if (Array.isArray(plugin) && plugin[0] === "expo-splash-screen") {
        const [, options] = plugin;

        return [
          plugin[0],
          {
            ...options,
            backgroundColor: themeColors.light.background,
            dark: {
              ...(options.dark ?? {}),
              backgroundColor: themeColors.dark.background,
            },
          },
        ];
      }

      return plugin;
    }),
  };
};
