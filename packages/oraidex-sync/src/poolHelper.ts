import { MulticallQueryClient } from "@oraichain/common-contracts-sdk";
import { Asset, AssetInfo, OraiswapPairQueryClient } from "@oraichain/oraidex-contracts-sdk";
import { PoolResponse } from "@oraichain/oraidex-contracts-sdk/build/OraiswapPair.types";
import { ORAI, oraiInfo, usdtCw20Address, usdtInfo } from "./constants";
import {
  calculatePriceByPool,
  fetchPoolInfoAmount,
  getCosmwasmClient,
  getPairInfoFromAssets,
  parseAssetInfoOnlyDenom
} from "./helper";
import { pairs } from "./pairs";
import { queryPoolInfos } from "./query";
import { PairInfoData, PairMapping } from "./types";

// use this type to determine the ratio of price of base to the quote or vice versa
export type RatioDirection = "base_in_quote" | "quote_in_base";

/**
 * Check pool if has native token is not ORAI -> has fee
 * @returns boolean
 */
function isPoolHasFee(assetInfos: [AssetInfo, AssetInfo]): boolean {
  let hasNative = false;
  for (const asset of assetInfos) {
    if ("native_token" in asset) {
      hasNative = true;
      if (asset.native_token.denom === "orai") {
        return false;
      }
    }
  }
  if (hasNative) return true;
  return false;
}

async function getPoolInfos(pairAddrs: string[], wantedHeight?: number): Promise<PoolResponse[]> {
  // adjust the query height to get data from the past
  const cosmwasmClient = await getCosmwasmClient();
  cosmwasmClient.setQueryClientWithHeight(wantedHeight);
  const multicall = new MulticallQueryClient(
    cosmwasmClient,
    process.env.MULTICALL_CONTRACT_ADDRESS || "orai1q7x644gmf7h8u8y6y8t9z9nnwl8djkmspypr6mxavsk9ual7dj0sxpmgwd"
  );
  const res = await queryPoolInfos(pairAddrs, multicall);
  return res;
}

function getPairByAssetInfos(assetInfos: [AssetInfo, AssetInfo]): PairMapping {
  return pairs.find((pair) => {
    const [baseAsset, quoteAsset] = pair.asset_infos;
    const denoms = [parseAssetInfoOnlyDenom(baseAsset), parseAssetInfoOnlyDenom(quoteAsset)];
    return (
      denoms.includes(parseAssetInfoOnlyDenom(assetInfos[0])) && denoms.includes(parseAssetInfoOnlyDenom(assetInfos[1]))
    );
  });
}

// get price ORAI in USDT base on ORAI/USDT pool.
async function getOraiPrice(): Promise<number> {
  const oraiUsdtPair = getPairByAssetInfos([oraiInfo, usdtInfo]);
  const ratioDirection: RatioDirection =
    parseAssetInfoOnlyDenom(oraiUsdtPair.asset_infos[0]) === ORAI ? "base_in_quote" : "quote_in_base";
  return getPriceByAsset([oraiInfo, usdtInfo], ratioDirection);
}

// get pair of assets then query info from contract to calculate price asset.
async function getPriceByAsset(assetInfos: [AssetInfo, AssetInfo], ratioDirection: RatioDirection): Promise<number> {
  const pairInfo = await getPairInfoFromAssets(assetInfos);
  // offer: orai, ask: usdt -> price offer in ask = calculatePriceByPool([ask, offer])
  // offer: orai, ask: atom -> price ask in offer  = calculatePriceByPool([offer, ask])
  const { offerPoolAmount, askPoolAmount } = await fetchPoolInfoAmount(...assetInfos, pairInfo.contract_addr);
  const assetPrice = calculatePriceByPool(askPoolAmount, offerPoolAmount, +pairInfo.commission_rate);
  return ratioDirection === "base_in_quote" ? assetPrice : 1 / assetPrice;
}

// find pool match this asset with orai => calculate price this asset token in ORAI.
// then, calculate price of this asset token in USDT based on price ORAI in USDT.
async function getPriceAssetByUsdt(asset: AssetInfo): Promise<number> {
  if (parseAssetInfoOnlyDenom(asset) === parseAssetInfoOnlyDenom(usdtInfo)) return 1;

  let priceInOrai = 1;
  if (parseAssetInfoOnlyDenom(asset) !== parseAssetInfoOnlyDenom(oraiInfo)) {
    const foundPair = getPairByAssetInfos([asset, oraiInfo]);
    if (!foundPair) return 0;

    const ratioDirection: RatioDirection =
      parseAssetInfoOnlyDenom(foundPair.asset_infos[0]) === ORAI ? "quote_in_base" : "base_in_quote";
    priceInOrai = await getPriceByAsset(foundPair.asset_infos, ratioDirection);
  }

  const priceOraiInUsdt = await getOraiPrice();

  return priceInOrai * priceOraiInUsdt;
}

async function calculateFeeByUsdt(fee: Asset): Promise<number> {
  if (!fee) return 0;
  const priceInUsdt = await getPriceAssetByUsdt(fee.info);
  return priceInUsdt * +fee.amount;
}

function calculateFeeByAsset(asset: Asset, shareRatio: number): Asset {
  const TAX_CAP = 10 ** 6;
  const TAX_RATE = 0.3;
  // just native_token not ORAI has fee
  if (!("native_token" in asset.info)) return null;
  const amount = +asset.amount;
  const refundAmount = amount * shareRatio;
  const fee = Math.min(refundAmount - (refundAmount * 1) / (TAX_RATE + 1), TAX_CAP);
  return {
    amount: fee.toString(),
    info: asset.info
  };
}

/**
 * First, calculate fee by offer asset & askAsset
 * then, calculate fee of those asset to ORAI
 * finally, convert this fee in ORAI to USDT.
 * @param pair
 * @param txHeight
 * @param withdrawnShare
 * @returns fee in USDT
 */
async function calculateLiquidityFee(pair: PairInfoData, txHeight: number, withdrawnShare: number): Promise<bigint> {
  const cosmwasmClient = await getCosmwasmClient();
  cosmwasmClient.setQueryClientWithHeight(txHeight);

  const pairContract = new OraiswapPairQueryClient(cosmwasmClient, pair.pairAddr);
  const poolInfo = await pairContract.pool();
  const totalShare = +poolInfo.total_share;
  const shareRatio = withdrawnShare / totalShare;

  const [feeByAssetFrom, feeByAssetTo] = [
    calculateFeeByAsset(poolInfo.assets[0], shareRatio),
    calculateFeeByAsset(poolInfo.assets[1], shareRatio)
  ];

  const feeByUsdt = (await calculateFeeByUsdt(feeByAssetFrom)) + (await calculateFeeByUsdt(feeByAssetTo));
  return BigInt(Math.round(feeByUsdt));
}

export {
  calculateFeeByAsset,
  calculateLiquidityFee,
  getOraiPrice,
  getPairByAssetInfos,
  getPoolInfos,
  getPriceAssetByUsdt,
  getPriceByAsset,
  isPoolHasFee
};
