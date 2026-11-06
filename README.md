<div align="center">
  <img src="./src/assets/brand/logo.svg" alt="Dutyy logo" width="112">
  <h1><em>Dutyy</em></h1>
</div>

## About the project

Yes this is another To-Do app paired with a CLI. The project will organize your To-Dos around projects.

This repo contains code for just the frontend please see [Dutyy-api](https://github.com/Oatmeal4Breakfast/dutyy-api) for the backend.

_**Still in active development**_

## Getting started for development

### Installing node deps

```bash
npm install

```

```bash
just install
```

### Running the servers

Be sure to copy the example env file and fill in your vars.

The application runs the backend server as a container. If you are not using just run the following.

```bash
docker compose -f compose.dev.yml up -d
npm run dev
```

alternatively

```bash
just dev
```
