# TurtleCoin®: Checkpoints Updater

This project is designed to update blockchain checkpoints, PIN the resulting file hash in [IPFS](https://ipfs.io/) via [Pinata.cloud](https://pinata.cloud/), update a [DNSLink](https://docs.ipfs.io/guides/concepts/dnslink/) via [CloudFlare](https://www.cloudflare.com/) DNS, and leverage the [CloudFlare IPFS Gateway](https://cloudflare-ipfs.com) to serve the data.

## Prerequisites

- node >=8
- yarn
- A [Pinata.cloud](https://pinata.cloud/) account

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

## Author

👤 **The TurtleCoin Developers**

* Twitter: [@_turtlecoin](https://twitter.com/_turtlecoin)
* Github: [@turtlecoin](https://github.com/turtlecoin)


## 📝 License

Copyright © 2019 [The TurtleCoin Developers](https://github.com/turtlecoin).

This project is [GPL-3.0](https://github.com/turtlecoin/ipfs-cf-checkpointer-node/blob/master/LICENSE) licensed.
