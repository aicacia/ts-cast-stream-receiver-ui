import { hash } from "@aicacia/hash";
import "ts-polyfill";
import { Client } from "../../ts-p2p/lib";
import packageJson from "../package.json";

const client = new Client({
    url: `${window.env.APP_WS_URL}/socket`
  }),
  MEDIA_ID = "media";

function onInit() {
  const context = cast.framework.CastReceiverContext.getInstance();

  const options = new cast.framework.CastReceiverOptions();
  options.versionCode = hash(packageJson.version);
  options.mediaElement = document.getElementById(MEDIA_ID);

  context.setLoggerLevel(
    process.env.NODE_ENV === "production"
      ? cast.framework.LoggerLevel.INFO
      : cast.framework.LoggerLevel.DEBUG
  );

  client.connect().then(() => {
    context.start(options);
  });
}

window.addEventListener("load", onInit);
