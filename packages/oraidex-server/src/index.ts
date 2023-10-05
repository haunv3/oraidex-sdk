#!/usr/bin/env node

import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { OraiswapRouterQueryClient } from "@oraichain/oraidex-contracts-sdk";
import {
  DuckDb,
  GetCandlesQuery,
  GetPricePairQuery,
  GetStakedByUserQuery,
  ORAI,
  OraiDexSync,
  PairInfoDataResponse,
  TickerInfo,
  VolumeRange,
  findPairAddress,
  getAllFees,
  getAllVolume24h,
  getOraiPrice,
  getPairLiquidity,
  getPriceByAsset,
  getVolumePairByUsdt,
  oraiInfo,
  oraiUsdtPairOnlyDenom,
  pairWithStakingAsset,
  pairs,
  pairsOnlyDenom,
  pairsWithDenom,
  parseAssetInfoOnlyDenom,
  simulateSwapPrice,
  toDisplay,
  usdtInfo
} from "@oraichain/oraidex-sync";
import cors from "cors";
import "dotenv/config";
import express, { Request } from "express";
import fs from "fs";
import path from "path";
import { getDate24hBeforeNow, getSpecificDateBeforeNow, pairToString, parseSymbolsToTickerId } from "./helper";

const app = express();
app.use(cors());

let duckDb: DuckDb;

const port = parseInt(process.env.PORT) || 2024;
const hostname = process.env.HOSTNAME || "0.0.0.0";
const rpcUrl = process.env.RPC_URL || "https://rpc.orai.io";

app.get("/version", async (req, res) => {
  try {
    const packageContent = fs.readFileSync(path.join(__dirname, "../package.json"), { encoding: "utf-8" });
    const packageJson = JSON.parse(packageContent);
    res.status(200).send(packageJson.version);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/pairs", async (req, res) => {
  try {
    const pairInfos = await duckDb.queryPairInfos();
    res.status(200).send(
      pairs.map((pair) => {
        const pairAddr = findPairAddress(pairInfos, pair.asset_infos);
        return {
          ticker_id: parseSymbolsToTickerId(pair.symbols),
          base: pair.symbols[0],
          target: pair.symbols[1],
          pool_id: pairAddr ?? ""
        };
      })
    );
  } catch (error) {
    res.status(500).send(`Error getting pair infos: ${JSON.stringify(error)}`);
  }
});

app.get("/tickers", async (req, res) => {
  try {
    const { endTime } = req.query;
    const cosmwasmClient = await CosmWasmClient.connect(rpcUrl);
    const routerContract = new OraiswapRouterQueryClient(
      cosmwasmClient,
      process.env.ROUTER_CONTRACT_ADDRESS || "orai1j0r67r9k8t34pnhy00x3ftuxuwg0r6r4p8p6rrc8az0ednzr8y9s3sj2sf"
    );
    const pairInfos = await duckDb.queryPairInfos();
    const latestTimestamp = endTime ? parseInt(endTime as string) : await duckDb.queryLatestTimestampSwapOps();
    const then = getDate24hBeforeNow(new Date(latestTimestamp * 1000)).getTime() / 1000;
    const data: TickerInfo[] = (
      await Promise.allSettled(
        pairs.map(async (pair) => {
          const symbols = pair.symbols;
          const pairAddr = findPairAddress(pairInfos, pair.asset_infos);
          const tickerId = parseSymbolsToTickerId(symbols);
          const baseIndex = 0;
          const targetIndex = 1;
          const baseInfo = parseAssetInfoOnlyDenom(pair.asset_infos[baseIndex]);
          const targetInfo = parseAssetInfoOnlyDenom(pair.asset_infos[targetIndex]);
          const volume = await duckDb.queryAllVolumeRange(baseInfo, targetInfo, then, latestTimestamp);
          let tickerInfo: TickerInfo = {
            ticker_id: tickerId,
            base_currency: symbols[baseIndex],
            target_currency: symbols[targetIndex],
            last_price: "",
            base_volume: toDisplay(BigInt(volume.volume[baseInfo])).toString(),
            target_volume: toDisplay(BigInt(volume.volume[targetInfo])).toString(),
            pool_id: pairAddr ?? "",
            base: symbols[baseIndex],
            target: symbols[targetIndex]
          };
          try {
            // reverse because in pairs, we put base info as first index
            const price = await simulateSwapPrice(pair.asset_infos, routerContract);
            tickerInfo.last_price = price;
          } catch (error) {
            tickerInfo.last_price = "0";
          }
          return tickerInfo;
        })
      )
    ).map((result) => {
      if (result.status === "fulfilled") return result.value;
      else console.log("result: ", result.reason);
    });
    res.status(200).send(data);
  } catch (error) {
    console.log("error: ", error);
    res.status(500).send(`Error: ${JSON.stringify(error)}`);
  }
});

// TODO: refactor this and add unit tests
app.get("/volume/v2/historical/chart", async (req, res) => {
  const { startTime, endTime, tf } = req.query;
  const timeFrame = tf ? parseInt(tf as string) : 60;
  const latestTimestamp = endTime ? parseInt(endTime as string) : await duckDb.queryLatestTimestampSwapOps();
  const then = startTime
    ? parseInt(startTime as string)
    : getSpecificDateBeforeNow(new Date(latestTimestamp * 1000), 259200).getTime() / 1000;
  const volumeInfos = await Promise.all(
    pairsOnlyDenom.map((pair) => {
      return duckDb.getVolumeRange(timeFrame, then, latestTimestamp, pairToString(pair.asset_infos));
    })
  );
  // console.log("volume infos: ", volumeInfos);
  let volumeRanges: { [time: string]: VolumeRange[] } = {};
  for (let volumePair of volumeInfos) {
    for (let volume of volumePair) {
      if (!volumeRanges[volume.time]) volumeRanges[volume.time] = [{ ...volume }];
      else volumeRanges[volume.time].push({ ...volume });
    }
  }
  let result = [];
  for (let [time, volumeData] of Object.entries(volumeRanges)) {
    const oraiUsdtVolumeData = volumeData.find((data) => data.pair === pairToString(oraiUsdtPairOnlyDenom));
    if (!oraiUsdtVolumeData) {
      res.status(500).send("Cannot find ORAI_USDT volume data in the volume list");
    }
    const totalVolumePrice = volumeData.reduce((acc, volData) => {
      // console.log("base price in usdt: ", basePriceInUsdt);
      // if base denom is orai then we calculate vol using quote vol
      let volumePrice = 0;
      if (volData.pair.split("-")[0] === ORAI) {
        volumePrice = oraiUsdtVolumeData.basePrice * toDisplay(BigInt(volData.baseVolume));
      } else if (volData.pair.split("-")[1] === ORAI) {
        volumePrice = oraiUsdtVolumeData.basePrice * toDisplay(BigInt(volData.quoteVolume));
      } else {
        return acc; // skip for now cuz dont know how to calculate price if not paired if with ORAI
      }
      // volume price is calculated based on the base currency & quote volume
      return acc + volumePrice;
    }, 0);
    result.push({ time, value: totalVolumePrice });
  }
  res.status(200).send(result);
});

app.get("/v1/candles/", async (req: Request<{}, {}, {}, GetCandlesQuery>, res) => {
  try {
    if (!req.query.pair || !req.query.tf || !req.query.startTime || !req.query.endTime)
      return res.status(400).send("Not enough query params");

    const candles = await duckDb.getOhlcvCandles(req.query);
    res.status(200).send(candles);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/v1/pools/", async (_req, res) => {
  try {
    const [volumes, allFee7Days, pools, allPoolApr] = await Promise.all([
      getAllVolume24h(),
      getAllFees(),
      duckDb.getPools(),
      duckDb.getApr()
    ]);
    const allLiquidities = await Promise.all(pools.map((pair) => getPairLiquidity(pair)));

    res.status(200).send(
      pools.map((pool, index) => {
        const poolApr = allPoolApr.find((item) => item.pairAddr === pool.pairAddr);
        return {
          ...pool,
          volume24Hour: volumes[index]?.toString() ?? "0",
          fee7Days: allFee7Days[index]?.toString() ?? "0",
          apr: poolApr?.apr ?? 0,
          totalLiquidity: allLiquidities[index]
        } as PairInfoDataResponse;
      })
    );
  } catch (error) {
    console.log({ error });
    res.status(500).send(error.message);
  }
});

// get price & volume ORAI in specific time (default: 24h).
app.get("/orai-info", async (req, res) => {
  try {
    // query tf is in minute unit.
    const SECONDS_PER_DAY = 24 * 60 * 60;
    let tf = req.query.tf ? Number(req.query.tf) * 60 : SECONDS_PER_DAY;
    const currentDate = new Date();
    const dateBeforeNow = getSpecificDateBeforeNow(new Date(), tf);
    const oneDayBeforeNow = getSpecificDateBeforeNow(new Date(), SECONDS_PER_DAY);
    const timestamp = Math.round(dateBeforeNow.getTime() / 1000);

    const [volume24h, oraiPriceByTime, currenOraiPrice] = await Promise.all([
      getVolumePairByUsdt([oraiInfo, usdtInfo], oneDayBeforeNow, currentDate),
      getOraiPrice(timestamp),
      getOraiPrice()
    ]);

    let percentPriceChange = 0;
    if (oraiPriceByTime !== 0) {
      percentPriceChange = ((currenOraiPrice - oraiPriceByTime) / oraiPriceByTime) * 100;
    }

    res.status(200).send({
      price: currenOraiPrice,
      volume_24h: toDisplay(volume24h),
      price_change: percentPriceChange
    });
  } catch (error) {
    console.log({ error });
    res.status(500).send(`Error: ${JSON.stringify(error)}`);
  }
});

// get price base asset & volume of specific pair in specific time (default: 24h)
app.get("/price", async (req: Request<{}, {}, {}, GetPricePairQuery>, res) => {
  try {
    if (!req.query.base_denom || !req.query.quote_denom) {
      return res.status(400).send("Not enough query params: base_denom, quote_denom, tf");
    }

    // query tf is in minute unit
    const SECONDS_PER_DAY = 24 * 60 * 60;
    let tf = req.query.tf ? Number(req.query.tf) * 60 : SECONDS_PER_DAY;
    const dateBeforeNow = getSpecificDateBeforeNow(new Date(), tf);
    const timestamp = Math.round(dateBeforeNow.getTime() / 1000);

    const pair = pairsWithDenom.find(
      (pair) => pair.asset_denoms[0] === req.query.base_denom && pair.asset_denoms[1] === req.query.quote_denom
    );
    if (!pair)
      return res.status(400).send(`Not found pair with assets: ${req.query.base_denom}-${req.query.quote_denom}`);

    const [baseAssetPriceByTime, currentBaseAssetPrice] = await Promise.all([
      getPriceByAsset(pair.asset_infos, "base_in_quote", timestamp),
      getPriceByAsset(pair.asset_infos, "base_in_quote")
    ]);

    let percentPriceChange = 0;
    if (baseAssetPriceByTime !== 0) {
      percentPriceChange = ((currentBaseAssetPrice - baseAssetPriceByTime) / baseAssetPriceByTime) * 100;
    }

    res.status(200).send({
      price: currentBaseAssetPrice,
      price_change: percentPriceChange
    });
  } catch (error) {
    console.log({ error });
    res.status(500).send(`Error: ${JSON.stringify(error)}`);
  }
});

app.get("/v1/my-staking", async (req: Request<{}, {}, {}, GetStakedByUserQuery>, res) => {
  if (!req.query.stakerAddress) {
    return res.status(400).send("Not enough query params: stakerAddress");
  }

  try {
    const DEFAULT_TIME_FRAME = 30 * 24 * 60 * 60; // 30 days in second unit.
    const tf = +req.query.tf || DEFAULT_TIME_FRAME;
    const now = new Date();
    const startTime = Math.round(getSpecificDateBeforeNow(now, tf).getTime() / 1000);
    const endTime = Math.round(now.getTime() / 1000);

    const [staked, earned] = await Promise.all([
      duckDb.getMyStakedAmount(req.query.stakerAddress, startTime, endTime),
      duckDb.getMyEarnedAmount(req.query.stakerAddress, startTime, endTime)
    ]);
    const stakedWithKey = staked.reduce((accumulator, item) => {
      accumulator[item.stakingAssetDenom] = item.stakeAmountInUsdt;
      return accumulator;
    }, {});
    const earnedWithKey = earned.reduce((accumulator, item) => {
      accumulator[item.stakingAssetDenom] = item.earnAmountInUsdt;
      return accumulator;
    }, {});

    const result = pairWithStakingAsset.reduce(
      (result, item) => {
        const stakingAssetDenom = parseAssetInfoOnlyDenom(item.stakingAssetInfo);
        result[stakingAssetDenom] = {
          stakingAmountInUsdt: stakedWithKey[stakingAssetDenom] || 0,
          earnAmountInUsdt: earnedWithKey[stakingAssetDenom] || 0
        };
        return result;
      },
      {} as {
        [key: string]: {
          stakingAmountInUsdt: number;
          earnAmountInUsdt: number;
        };
      }
    );

    const finalResult = Object.entries(result).map(([denom, values]) => ({
      stakingAssetDenom: denom,
      stakingAmountInUsdt: values.stakingAmountInUsdt,
      earnAmountInUsdt: values.earnAmountInUsdt
    }));

    res.status(200).send(finalResult);
  } catch (error) {
    console.log({ error });
    res.status(500).send(`Error: ${JSON.stringify(error)}`);
  }
});

app.listen(port, hostname, async () => {
  // sync data for the service to read
  duckDb = await DuckDb.create(process.env.DUCKDB_PROD_FILENAME);
  const oraidexSync = await OraiDexSync.create(
    duckDb,
    process.env.RPC_URL || "https://rpc.orai.io",
    process.env as any
  );
  oraidexSync.sync();
  console.log(`[server]: oraiDEX info server is running at http://${hostname}:${port}`);
});
