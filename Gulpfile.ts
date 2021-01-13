import gulp = require("gulp");
// @ts-ignore
import ParcelBundler = require("parcel-bundler");
import del = require("del");
import { spawn } from "child_process";
import packageJson = require("./package.json");

const IS_PROD = process.env.NODE_ENV === "production",
  IS_DEV = !IS_PROD,
  PACKAGE_NAME = packageJson.name,
  ORGANIZATION = packageJson.organization,
  VERSION = packageJson.version,
  NAMESPACE = "ui",
  NAME = PACKAGE_NAME.replace(/[\._]+/g, "-"),
  HELM_DIR = `./helm/${ORGANIZATION}-${PACKAGE_NAME}`;

const createErrorHandlerExit = (callback: (error?: Error) => void) => (
  code: number
) =>
  code !== 0
    ? callback(new Error(`child process exited with code ${code}`))
    : callback();

const exec = (
  cmd: string,
  callback: (error?: Error) => void,
  createErrorHandler = createErrorHandlerExit
) => {
  const child = spawn(cmd, { stdio: "inherit", shell: true });
  const exit = createErrorHandler(callback);

  console.log(`Running: ${cmd}`);

  child.on("disconnect", callback);
  child.on("error", callback);
  child.on("close", exit);
  child.on("exit", exit);
};

const execIgnoreFailure = (cmd: string, callback: (error?: Error) => void) =>
  exec(cmd, callback, (callback) => () => callback());

/* Build 
================================================ */
const cleanCache = () => del(["./.cache"]);

gulp.task("clean-cache", cleanCache);

const clean = () => del(["./build"]);

gulp.task("clean", clean);

const createParcelTask = (serve = false) => {
  const parcel = () => {
    const bundler = new ParcelBundler("src/index.html", {
      outDir: "build",
      outFile: "index.html",
      publicUrl: (packageJson as any).homepage,

      cache: IS_DEV,
      minify: IS_PROD,

      hmr: IS_DEV,
      watch: serve === true,

      target: "browser",
      https: false,

      logLevel: 3,
    });

    if (serve) {
      return bundler.serve();
    } else {
      return bundler.bundle();
    }
  };

  return parcel;
};

gulp.task("parcel", createParcelTask());

const build = IS_PROD
  ? gulp.series(cleanCache, clean, createParcelTask())
  : gulp.series(clean, createParcelTask());

gulp.task("build", build);

const start = IS_PROD
  ? gulp.series(cleanCache, clean, createParcelTask())
  : gulp.series(clean, createParcelTask(true));

gulp.task("start", start);
gulp.task("default", start);

/* Docker 
================================================ */
// const dockerRepository = () => `${DOCKER_REGISTRY}/ui/${NAME}`;
const dockerRepository = () =>
  `registry.gitlab.com/aicacia/ts-cast-stream-receiver-ui`;
const dockerTag = () => `${dockerRepository()}:${VERSION}`;

const dockerBuild = (callback: () => void) =>
  exec(`docker build -t ${dockerTag()} .`, callback);

gulp.task("docker.build", dockerBuild);

const dockerPush = (callback: () => void) =>
  exec(`docker push ${dockerTag()}`, callback);

gulp.task("docker.push", dockerPush);

/* Helm 
================================================ */
const helmOverrides = () =>
  `--set image.tag=${VERSION} --set image.repository=${dockerRepository()} --set image.hash=$(docker inspect --format='{{index .Id}}' ${dockerTag()})`;

const createHelmInstall = (values = "") => (callback: () => void) =>
  exec(
    `helm install ${NAME} ${HELM_DIR} --namespace=${NAMESPACE}  ${helmOverrides()} ${
      values ? `--values ${values}` : ""
    }`,
    callback
  );

gulp.task("helm.install", createHelmInstall());
gulp.task(
  "helm.install.local",
  createHelmInstall(`${HELM_DIR}/values-local.yaml`)
);

const helmDelete = (callback: () => void) =>
  execIgnoreFailure(`helm delete ${NAME} --namespace=${NAMESPACE}`, callback);

gulp.task("helm.delete", helmDelete);

const createHelmUpgrade = (values = "") => (callback: () => void) =>
  exec(
    `helm upgrade ${NAME} ${HELM_DIR} --namespace=${NAMESPACE} --install ${helmOverrides()} ${
      values ? `--values ${values}` : ""
    }`,
    callback
  );

gulp.task("helm.upgrade", createHelmUpgrade());
gulp.task(
  "helm.upgrade.local",
  createHelmUpgrade(`${HELM_DIR}/values-local.yaml`)
);

gulp.task(
  "helm",
  gulp.series(build, dockerBuild, dockerPush, createHelmUpgrade())
);

gulp.task(
  "helm.local",
  gulp.series(
    build,
    dockerBuild,
    dockerPush,
    createHelmUpgrade(`${HELM_DIR}/values-local.yaml`)
  )
);
