const gulp = require("gulp"),
  ParcelBundler = require("parcel-bundler"),
  del = require("del"),
  { spawn } = require("child_process"),
  package = require("./package.json");

const { HELM_REPO_USERNAME, HELM_REPO_PASSWORD, NODE_ENV } = process.env,
  IS_PROD = NODE_ENV === "production",
  IS_TEST = NODE_ENV === "test",
  IS_DEV = !IS_PROD,
  PACKAGE_NAME = package.name,
  ORGANIZATION = package.organization,
  VERSION = package.version,
  { DOCKER_REGISTRY, HELM_REPO } = IS_PROD
    ? package.env.production
    : package.env.development,
  NAMESPACE = "ui",
  NAME = PACKAGE_NAME.replace(/[\._]+/g, "-"),
  HELM_DIR = `./helm/${ORGANIZATION}-${PACKAGE_NAME}`;

const createErrorHandlerExit = callback => code =>
  code !== 0
    ? callback(new Error(`child process exited with code ${code}`))
    : callback();

const exec = (cmd, callback, createErrorHandler = createErrorHandlerExit) => {
  const child = spawn(cmd, { stdio: "inherit", shell: true });
  const exit = createErrorHandler(callback);

  console.log(`Running: ${cmd}`);

  child.on("disconnect", callback);
  child.on("error", callback);
  child.on("close", exit);
  child.on("exit", exit);
};

const execIgnoreFailure = (cmd, callback) =>
  exec(cmd, callback, callback => () => callback());

/* Build 
================================================ */
const cleanCache = () => del(["./.cache"]);

gulp.task("clean-cache", cleanCache);

const clean = () => del(["./build"]);

gulp.task("clean", clean);

const createParcelTask = (serve = false) => {
  const parcel = () => {
    const bundler = new ParcelBundler("./app/index.html", {
      outDir: "./build",
      outFile: "index.html",

      cache: IS_DEV,
      cacheDir: ".cache",
      minify: IS_PROD,

      hmr: IS_DEV,
      watch: serve === true,

      target: "browser",
      https: IS_PROD,

      logLevel: 3
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
const dockerRepository = () => `${DOCKER_REGISTRY}/ui/${NAME}`;
const dockerTag = () => `${dockerRepository()}:${VERSION}`;

const dockerBuild = callback =>
  exec(`docker build -t ${dockerTag()} .`, callback);

gulp.task("docker.build", dockerBuild);

const dockerPush = callback => exec(`docker push ${dockerTag()}`, callback);

gulp.task("docker.push", dockerPush);

/* Helm 
================================================ */
const helmPush = callback =>
  exec(
    `cd ${HELM_DIR} && helm push . ${HELM_REPO} --email="${HELM_REPO_USERNAME}" --password="${HELM_REPO_PASSWORD}"`,
    callback
  );

gulp.task("helm.push", helmPush);

const helmOverrides = () =>
  `--set image.tag=${VERSION} --set image.repository=${dockerRepository()} --set image.hash=$(docker inspect --format='{{index .Id}}' ${dockerTag()})`;

const createHelmInstall = values => callback =>
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

const helmDelete = callback =>
  execIgnoreFailure(`helm delete ${NAME} --namespace=${NAMESPACE}`, callback);

gulp.task("helm.delete", helmDelete);

const createHelmUpgrade = values => callback =>
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
