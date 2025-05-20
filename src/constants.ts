// `mint` is the address of the nft collection mint to index.
// Solana has different metadata program for nfts and other tokens.
// Metaplex is a popular metadata program for nfts.
// If we can get nft transfers that their collection mint is the same as this `mint`, it's easier to index.
// Or if we can get all nfts, belonging to this collection.
// Also, nfts transfers do not usually reference the collection mint.
export const collection = "5f2PvbmKd9pRLjKdMr8nrK8fNisLi7irjB6X5gopnKpB";
