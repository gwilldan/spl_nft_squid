# solana-example

This project shows how one can index Orca Exchange USDC-SOL swaps using Subsquid SDK.

## About SDK

Subsquid SDK is a TypeScript ETL toolkit for blockchain data, that currently supports

- Ethereum and everything Ethereum-like
- [Substrate](https://substrate.io)-based chains
- Solana.

Subsquid SDK stands apart from the competition by

- Being a toolkit (rather than an indexing app like TheGraph or Ponder)
- Fast binary data codecs and type-safe access to decoded data
- Native support for sourcing the data from Subsquid Network.

The latter is a key point, as Subsquid Network is a decentralized data lake and query engine,
that allows to granularly select and stream subset of block data to lightweight clients
while providing game changing performance over traditional RPC API.

## Getting started

### Prerequisites

- Node.js (version 20.x and above)
- Docker

### Run indexer

input collection address in the src/constant.ts file

create a .env file and input the following codeblock

```
DB_NAME=postgres
DB_USER=postgres
DB_PASS=postgres
DB_PORT=23751

```

## This is a simple squid workflow

```bash
# Install dependencies
npm i

# Compile the project
npx tsc

# Launch Postgres database to store the data
docker compose up -d

# Apply database migrations to create the target schema
npx squid-typeorm-migration apply

# Run indexer
node -r dotenv/config lib/main.js

# Checkout indexed swaps
docker exec "$(basename "$(pwd)")-db-1" psql -U postgres \
  -c "SELECT slot, from_token, to_token, from_amount, to_amount FROM exchange ORDER BY id LIMIT 10"
```

For further details, please consult heavily commented [main.ts](./src/main.ts).

For even more details, see [Solana Indexing Docs](https://docs.subsquid.io/solana-indexing/)

## Decoding binary data

`@subsquid/borsh` package allows to easily define fast and type-safe codec for any Solana data structure.

In the future we plan to develop robust code generation tools,
that would allow to create all relevant definitions from IDL files automatically.

Meanwhile, [abi](./src/abi) module gives an example of how that might look like.

## Disclaimer

Solana support is in beta.

In particular, we expect to make Subsquid Network data ingestion at least 50 times faster.
