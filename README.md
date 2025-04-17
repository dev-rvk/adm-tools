# Android Device Manager - Setup Guide

## Prerequisites
This guide covers the installation steps required to set up the project on **Ubuntu**, **Windows**, and **macOS**.

---

## Installation

### Ubuntu
Run the following commands in the terminal:
```sh
# Install npm
sudo apt install npm

# Install pnpm
sudo npm install -g pnpm@latest-10

# Install TypeScript compiler
sudo npm install -g typescript

# Install ADB
sudo apt-get install android-tools-adb

# Install Fastboot
sudo apt-get install android-tools-fastboot
```

### Windows
Run the following commands in **PowerShell (as Administrator)**:
```powershell
# Install npm (comes with Node.js)
winget install OpenJS.NodeJS

# Install pnpm
npm install -g pnpm@latest-10

# Install TypeScript compiler
npm install -g typescript

# Install ADB & Fastboot (via Chocolatey)
choco install adb fastboot
```
If you don't have Chocolatey installed, follow the instructions at [Chocolatey Installation](https://chocolatey.org/install).

### macOS
Run the following commands in the terminal:
```sh
# Install npm (comes with Node.js)
brew install node

# Install pnpm
npm install -g pnpm@latest-10

# Install TypeScript compiler
npm install -g typescript

# Install ADB & Fastboot
brew install android-platform-tools
```
If you don't have Homebrew installed, follow the instructions at [Homebrew Installation](https://brew.sh/).

---

## Clone the Repository
```sh
git clone https://github.com/dev-rvk/adm-emulator
cd adm-emulator
```

## Build Configuration
Setup the `config` package and build it:
```sh
pmpm run config
```

## Install Dependencies
```sh
pnpm install
```

## Pull Docker Images
Ensure you have Docker installed and running, then execute:
```sh
## so decompiler
docker pull devrvk/so-decompiler:latest


## JADX decompiler
# For x86_64 processors
docker pull devrvk/jadx-decompile:amd64

# For arm processors
docker pull devrvk/jadx-decompile:arm64


```
## To run the app
Execute the `dev` script:
```sh
pmpm dev
```

## Ensure the following URLS are treated secure (in chromium based browesers)
URL: chrome://flags/#unsafely-treat-insecure-origin-as-secure
Replace with the correct IP, keep Ports the same
```
http://192.168.1.142:3001,ws://192.168.1.142:3001,http://192.168.1.142:5051,http://192.168.1.142:3002
```
---

## Additional Notes
- Ensure that `pnpm`, `npm`, and `node` are added to your system's PATH.
- Verify installations using:
  ```sh
  node -v
  npm -v
  pnpm -v
  tsc -v
  adb version
  fastboot --version
  ```

This completes the setup process. Happy coding!

## Repo Info for developement

## Using this example

Clone the repository:
Install dependencies:

```sh
pnpm install
```

### Add ui components

Use the pre-made script:

```sh
pnpm ui add <component-name>
```

> This works just like the `shadcn/ui` CLI.

### Add a new app

Turborepo offer a simple command to add a new app:

```sh
pnpm turbo gen workspace --name <app-name>
```

This will create a new empty app in the `apps` directory.

If you want, you can copy an existing app with:

```sh
pnpm turbo gen workspace --name <app-name> --copy
```

> [!NOTE]
> Remember to run `pnpm install` after copying an app.

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages
- `apps /`
- - `app-1`: a [Next.js](https://nextjs.org/) app with next-auth (Google Account Oath Support)

- `packages /`
- - `@repo/zod-types`: Zod types for validation
- - `@repo/db`: Postgress database, exports a new prisma client
- - `@repo/ui`: a stub React component library (🚀 powered by **shadcn/ui**)
- - `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- - `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Database scripts

View package.json for the scripts


### Build

To build all apps and packages, run the following command:

```sh
pnpm build
```

### Develop

To develop all apps and packages, run the following command:

```sh
pnpm dev
```

### Remote Caching

Turborepo can use a technique known as [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup), then enter the following commands:

```
cd <project name>
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```sh
npx turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)

Learn more about shadcn/ui:

- [Documentation](https://ui.shadcn.com/docs)
