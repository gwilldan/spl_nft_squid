import { run } from "@subsquid/batch-processor";
import { augmentBlock } from "@subsquid/solana-objects";
import { TypeormDatabase } from "@subsquid/typeorm-store";
import * as tokenProgram from "./abi/token-program";
import { Transfer, Owner, Token } from "./model/generated";
import { dataSource } from "./datasource";
import bs58 from "bs58";
import { getAssets } from "./metaplex";
import { DasApiAssetList } from "@metaplex-foundation/digital-asset-standard-api";

const rpcURL = "https://api.mainnet-beta.solana.com";

const database = new TypeormDatabase();

interface RawTransfer {
	id: string;
	token: string;
	from: string;
	to: string;
	amount: bigint;
	timestamp: Date;
	slot: number;
	blockNumber: number;
	signature: string;
}

let assets: DasApiAssetList | null = null;

run(dataSource, database, async (ctx) => {

	if (assets === null) {
		assets = await getAssets(rpcURL)
	}

	let blocks = ctx.blocks.map(augmentBlock);

	let rawTransfers: RawTransfer[] = [];

	for (let block of blocks) {
		for (let ins of block.instructions) {
			if (
				ins.programId !== tokenProgram.programId ||
				ins.d1 !== tokenProgram.instructions.transfer.d1
			) {
				continue;
			}
			const source = ins.accounts[0];
			const destination = ins.accounts[1];
			const tx = ins.getTransaction();
			const srcTransfer = tx.tokenBalances.find((tb) => tb.account == source);

			const tokenMint = srcTransfer?.preMint;

			const asset = assets.items.find((asset) => asset.id === tokenMint);

			// This check here could've been a way to verify the mint is part of the collection.
			if (!asset) {
				continue;
			}

			const from = srcTransfer?.preOwner;
			const desTransfer = tx.tokenBalances.find(
				(tb) => tb.account === destination
			);

			const to = desTransfer?.postOwner || desTransfer?.preOwner || destination;

			const amount = decodeSplTransferAmountFromBase58(ins.data);

			//create a new Type for raw transfers and pass the token ID (the NFT ID) to the token id
			rawTransfers.push({
				id: ins.id,
				token: ins.id,
				from: from as string,
				to,
				amount,
				timestamp: new Date(block.header.timestamp * 1000),
				slot: block.header.slot,
				blockNumber: block.header.height,
				signature: tx.signatures[0],
			});
		}
	}

	const owners: Map<string, Owner> = createOwners(rawTransfers);
	const tokens: Map<string, Token> = createTokens(rawTransfers, owners);
	const transfers: Transfer[] = createTransfers(rawTransfers, owners, tokens);

	await ctx.store.upsert([...owners.values()]);
	await ctx.store.upsert([...tokens.values()]);
	await ctx.store.insert(transfers);
});

function createOwners(rawTransfers: RawTransfer[]): Map<string, Owner> {
	let owners: Map<string, Owner> = new Map();
	for (const t of rawTransfers) {
		owners.set(t.from, new Owner({ id: t.from }));
		owners.set(t.to, new Owner({ id: t.to }));
	}
	return owners;
}
function createTokens(
	rawTransfers: RawTransfer[],
	owners: Map<string, Owner>
): Map<string, Token> {
	let tokens: Map<string, Token> = new Map();
	for (const t of rawTransfers) {
		let tokenIdString = `${t.token}`;
		tokens.set(
			tokenIdString,
			new Token({
				id: tokenIdString,
				tokenId: t.token,
				owner: owners.get(t.to),
			})
		);
	}
	return tokens;
}

function createTransfers(
	rawTransfers: RawTransfer[],
	owners: Map<string, Owner>,
	tokens: Map<string, Token>
): Transfer[] {
	return rawTransfers.map(
		(t) =>
			new Transfer({
				id: t.id,
				token: tokens.get(t.token),
				from: owners.get(t.from),
				to: owners.get(t.to),
				amount: t.amount,
				timestamp: t.timestamp,
				slot: t.slot,
				blockNumber: t.blockNumber,
				signature: t.signature,
			})
	);
}

function decodeSplTransferAmountFromBase58(dataBase58: string): bigint {
	const data = bs58.decode(dataBase58);
  
	if (data[0] !== 3) {
	  throw new Error("Not a SPL Token Transfer instruction");
	}
  
	if (data.length < 9) {
	  throw new Error("Invalid instruction data length");
	}
  
	// Little-endian 64-bit unsigned integer
	const amountBytes = data.slice(1, 9); 
  
	// Convert little-endian bytes to hex string (reversed order)
	const hex = [...amountBytes]
	  .reverse()
	  .map((byte) => byte.toString(16).padStart(2, "0"))
	  .join("");
  
	const amount = BigInt("0x" + hex);
  
	return amount;
  }
