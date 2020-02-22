import "ts-polyfill";

import { hash } from "@aicacia/hash";
import packageJson from "../package.json";

const NAMSPACE = "urn:x-cast:aicacia",
  VIDEO_ID = "video";

const pc = new RTCPeerConnection({
  iceServers: [
    {
      urls: window.env.APP_STUN_URL
    }
  ]
});

function onLoad() {
  const context = cast.framework.CastReceiverContext.getInstance();

  const options = new cast.framework.CastReceiverOptions();
  options.versionCode = hash(packageJson.version);
  options.customNamespaces = { [NAMSPACE]: "JSON" };

  context.setLoggerLevel(
    process.env.NODE_ENV === "production"
      ? cast.framework.LoggerLevel.INFO
      : cast.framework.LoggerLevel.DEBUG
  );

  context.addEventListener(cast.framework.system.EventType.READY, event => {
    console.log(cast.framework.system.EventType.READY, event);
    onResize();
    onInit();
  });

  context.start(options);
}

function onResize() {
  cast.framework.CastReceiverContext.getInstance().sendCustomMessage(
    NAMSPACE,
    undefined as any,
    {
      type: "resize",
      width: window.innerWidth,
      height: window.innerHeight
    }
  );
}

export function onInit() {
  pc.addEventListener("icecandidate", event => {
    console.log("icecandidate", event);
    if (event.candidate) {
      cast.framework.CastReceiverContext.getInstance().sendCustomMessage(
        NAMSPACE,
        undefined as any,
        {
          type: "candidate",
          candidate: event.candidate
        }
      );
    }
  });

  pc.addEventListener("negotiationneeded", () => {
    console.log("negotiationneeded", event);
    pc.createOffer()
      .then(onLocalDescCreated)
      .catch(createOnError("negotiationneeded"));
  });

  pc.addEventListener("track", event => {
    console.log("track", event);
    const media = document.getElementById(VIDEO_ID) as HTMLVideoElement;
    media.srcObject = event.streams[0];
  });

  cast.framework.CastReceiverContext.getInstance().addCustomMessageListener(
    NAMSPACE,
    event => {
      const data = (event as any).data;

      switch (data.type) {
        case "sdp": {
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
            .then(() => {
              if (pc.remoteDescription?.type === "offer") {
                pc.createAnswer()
                  .then(onLocalDescCreated)
                  .catch(createOnError("createAnswer"));
              }
            })
            .catch(createOnError("setRemoteDescription"));
          break;
        }
        case "candidate": {
          pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(
            createOnError("addIceCandidate")
          );
          break;
        }
      }
    }
  );
}

function onLocalDescCreated(desc: RTCSessionDescriptionInit) {
  console.log("localDescCreated", desc);
  return pc
    .setLocalDescription(desc)
    .then(() =>
      cast.framework.CastReceiverContext.getInstance().sendCustomMessage(
        NAMSPACE,
        undefined as any,
        { type: "sdp", sdp: pc.localDescription }
      )
    )
    .catch(createOnError("localDescCreated"));
}

function createOnError(name: string) {
  return function onError(error: Error) {
    console.error(name, error);
  };
}

window.addEventListener("load", onLoad);
window.addEventListener("resize", onResize);
window.addEventListener("orientationchange", onResize);
