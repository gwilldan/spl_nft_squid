import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { dasApi } from "@metaplex-foundation/digital-asset-standard-api";
import { collection } from "./constants";
import assert from "assert";

export const getAssets = async (endpoint: string) => {
  const umi = createUmi(endpoint).use(dasApi());
  const assets = await umi.rpc.getAssetsByGroup({
    groupKey: "collection",
    groupValue: collection,
  });
  assert(assets.total > 0, "No assets found");

  return assets;
};
