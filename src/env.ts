import packageJSON from "../package.json";

const env = {
  ...process.env,
  ...((packageJSON.env as any)[process.env.NODE_ENV || "development"] || {}),
};

window.env = Object.keys(env).reduce((windowEnv, key) => {
  if (key.startsWith("APP_")) {
    windowEnv[key] = env[key];
  }
  return windowEnv;
}, window.env || {});
