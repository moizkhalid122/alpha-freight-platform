const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const stripeEntry = path.join(
  __dirname,
  "node_modules",
  "@stripe",
  "stripe-react-native",
  "lib",
  "commonjs",
  "index.js"
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@stripe/stripe-react-native") {
    return {
      filePath: stripeEntry,
      type: "sourceFile",
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
