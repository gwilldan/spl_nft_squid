import { DataSourceBuilder, SolanaRpcClient } from "@subsquid/solana-stream";
import * as tokenProgram from "./abi/token-program";

export const dataSource = new DataSourceBuilder()
  .setGateway("https://v2.archive.subsquid.io/network/solana-mainnet")
  .setRpc(
    process.env.SOLANA_NODE == null
      ? undefined
      : {
          client: new SolanaRpcClient({
            url: process.env.SOLANA_NODE,
          }),
          strideConcurrency: 10,
        }
  )
  .setBlockRange({ from: 299804550 })
  .setFields({
    block: {
      timestamp: true,
    },
    transaction: {
      signatures: true,
    },
    instruction: {
      programId: true,
      accounts: true,
      data: true,
    },
    tokenBalance: {
      preAmount: false,
      postAmount: false,
      preOwner: true,
      postOwner: true,
    },
  })
  .addInstruction({
    where: {
      programId: [tokenProgram.programId],
      d1: [tokenProgram.instructions.transfer.d1],
    },
    include: {
      transaction: true,
      transactionInstructions: false,
    },
  })

  .build();