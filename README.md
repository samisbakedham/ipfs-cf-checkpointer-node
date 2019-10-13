# TurtleCoin®: Checkpoints Updater

## Prerequisites

- node >=8
- yarn

## Install

```sh
git clone https://github.com/turtlecoin/ipfs-cf-checkpointer-node
cd ipfs-cf-checkpointer-node
npm install -g yarn
yarn install
```

## Usage

1) Set your environment variables and start the script

```bash
export CHECKPOINT_FILE=checkpoints.csv
export PINATA_API_KEY=yourpinatakey
export PINATA_SECRET_API_KEY=yourpinatasecretkey
export CLOUDFLARE_TOKEN=yourcloudflaretoken
export CLOUDFLARE_ZONE_ID=yourcloudflarezoneid
export CLOUDFLARE_SUBDOMAIN=yourcloudflaresubdomain
yarn start
```

## Run tests

```sh
yarn test
```

## Known Bugs

1) The script will not complete until [Pinata-SDK PR #7](https://github.com/PinataCloud/Pinata-SDK/pull/7) is completely published without that patch being manually applied to the Pinata-SDK webpacked file(s).

## Author

👤 **The TurtleCoin Developers**

* Twitter: [@_turtlecoin](https://twitter.com/_turtlecoin)
* Github: [@turtlecoin](https://github.com/turtlecoin)


## 📝 License

Copyright © 2019 [The TurtleCoin Developers](https://github.com/turtlecoin).

This project is [GPL-3.0](https://github.com/turtlecoin/ipfs-cf-checkpointer-node/blob/master/LICENSE) licensed.
