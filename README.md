# ts-cast-stream-receiver-ui

cast-stream-receiver ui

## up and running

install [direnv](https://direnv.net/)

```bash
$ cp .envrc.example .envrc
```

start the app in dev

```bash
$ npm i
```

```bash
$ npm run gulp start
```

build the app in dev

```bash
$ npm run gulp build
```

## Docker/Kubernetes

build the docker image

```bash
$ npm run gulp docker.build
```

## plop

### component

```bash
$ npm run plop component
? component name Example
? page component if component is not in shared components
? does the component need a container Yes
✔  ++ /app/components/shared/Example/Example.tsx
✔  ++ /app/components/shared/Example/index.ts
✔  ++ /app/components/shared/Example/ExampleContainer.ts
```

### page component

```bash
$ npm run plop page
? component name Example
? path for routes /example
✔  ++ /app/components/pages/Example/Example.tsx
✔  ++ /app/components/pages/Example/index.ts
✔  ++ /app/components/pages/Example/ExampleContainer.ts
✔  ++ /app/components/pages/Example/ExamplePage.tsx
✔  +- /app/routes.ts
✔  _+ /app/routes.ts
```

### form

```bash
$ npm run plop form
? page to put component in Example
? component name Form
✔  ++ /app/components/pages/Example/Form.tsx
```

### store

```bash
$ npm run plop store
? store name example
✔  ++ /app/stores/example/actions.ts
✔  ++ /app/stores/example/definitions.ts
✔  ++ /app/stores/example/index.ts
✔  ++ /app/stores/example/selectors.ts
✔  +- /app/stores/index.ts
✔  _+ /app/stores/index.ts
✔  +- /app/lib/state.ts
✔  _+ /app/lib/state.ts
```

### middleware

```bash
$ npm run plop middleware
? middleware name example
✔  ++ /app/middleware/example.ts
✔  +- /app/routes.ts
✔  _+ /app/routes.ts
```
