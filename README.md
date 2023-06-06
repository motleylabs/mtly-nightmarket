# @motleylabs/mtly-nightmarket

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@motleylabs/mtly-nightmarket.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@motleylabs/mtly-nightmarket.svg?style=flat
[npm-url]: https://www.npmjs.com/package/@motleylabs/mtly-nightmarket

An easy to use TypeScript API for interacting with the [nightmarket.io](https://nightmarket.io) marketplace contract.

This API is used by the [Night Market front end](https://github.com/motleylabs/nightmarket-oss).

## Contributing

We welcome contributions to Night Market from the community -- please open a pull request!

Feel free to join the [Motley DAO Discord](https://discord.gg/motleydao) to talk to the team and other community members.

All contributions are automatically licensed under the [Apache 2.0](LICENSE) license.

## Installation

You can install the package with [NPM](https://www.npmjs.com/package/@motleylabs/mtly-nightmarket) or using [Yarn](https://yarnpkg.com/package/@motleylabs/mtly-nightmarket).

### Using NPM

```bash
npm install @motleylabs/mtly-nightmarket
```

### Using Yarn

```bash
yarn add @motleylabs/mtly-nightmarket
```

#### Beta channel

The `beta` branch is available by using the `@motleylabs/mtly-nightmarket@beta` package.

## Getting Started

All marketplace actions are implemented as functions of the [`NightmarketClient`](https://motleylabs.github.io/mtly-nightmarket/classes/NightmarketClient.html). 

Each action returns the instructions to add to a Solana Web3.js [`VersionedTransaction`](https://solana-labs.github.io/solana-web3.js/classes/VersionedTransaction.html).

Example usge of the API can be found in the [`examples`](examples/) directory.
