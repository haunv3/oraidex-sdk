import { AssetInfo } from "@oraichain/oraidex-contracts-sdk";
import {
  calculatePrefixSum,
  findAssetInfoPathToUsdt,
  findMappedTargetedAssetInfo,
  findPairAddress,
  calculatePriceByPool,
  toAmount,
  toDisplay,
  toDecimal,
  roundTime,
  groupByTime,
  collectAccumulateLpData,
  concatDataToUniqueKey
} from "../src/helper";
import { extractUniqueAndFlatten, pairs } from "../src/pairs";
import {
  ORAI,
  airiCw20Adress,
  atomIbcDenom,
  kwtCw20Address,
  milkyCw20Address,
  oraixCw20Address,
  osmosisIbcDenom,
  scAtomCw20Address,
  scOraiCw20Address,
  tronCw20Address,
  usdcCw20Address,
  usdtCw20Address
} from "../src/constants";
import { PairInfoData, ProvideLiquidityOperationData } from "../src/types";
import { PoolResponse } from "@oraichain/oraidex-contracts-sdk/build/OraiswapPair.types";

describe("test-helper", () => {
  describe("bigint", () => {
    describe("toAmount", () => {
      it("toAmount-percent", () => {
        const bondAmount = BigInt(1000);
        const percentValue = (toAmount(0.3, 6) * bondAmount) / BigInt(100000000);
        expect(percentValue.toString()).toBe("3");
      });

      it.each([
        [6000, 18, "6000000000000000000000"],
        [2000000, 18, "2000000000000000000000000"],
        [6000.5043177, 6, "6000504317"],
        [6000.504317725654, 6, "6000504317"],
        [0.0006863532, 6, "686"]
      ])(
        "toAmount number %.7f with decimal %d should return %s",
        (amount: number, decimal: number, expectedAmount: string) => {
          const res = toAmount(amount, decimal).toString();
          expect(res).toBe(expectedAmount);
        }
      );
    });

    describe("toDisplay", () => {
      it.each([
        ["1000", 6, "0.001", 6],
        ["454136345353413531", 15, "454.136345", 6],
        ["454136345353413531", 15, "454.13", 2],
        ["100000000000000", 18, "0.0001", 6]
      ])(
        "toDisplay number %d with decimal %d should return %s",
        (amount: string, decimal: number, expectedAmount: string, desDecimal: number) => {
          const res = toDisplay(amount, decimal, desDecimal).toString();
          expect(res).toBe(expectedAmount);
        }
      );
    });

    describe("toDecimal", () => {
      it("toDecimal-happy-path", async () => {
        const numerator = BigInt(6);
        const denominator = BigInt(3);
        const res = toDecimal(numerator, denominator);
        expect(res).toBe(2);
      });

      it("should return 0 when denominator is zero", async () => {
        const numerator = BigInt(123456);
        const denominator = BigInt(0);
        expect(toDecimal(numerator, denominator)).toBe(0);
      });

      it("should correctly convert a fraction into its equivalent decimal value", () => {
        const numerator = BigInt(1);
        const denominator = BigInt(3);

        // Convert the fraction to its decimal value using toDecimal.
        const decimalValue = toDecimal(numerator, denominator);
        // Expect the decimal value to be equal to the expected value.
        expect(decimalValue).toBeCloseTo(0.333333, 6);
      });

      it.each([
        [BigInt(1), BigInt(3), 0.333333, 6],
        [BigInt(1), BigInt(3), 0.3333, 4],
        [BigInt(1), BigInt(2), 0.5, 6]
      ])(
        "should correctly convert a fraction into its equivalent decimal value",
        (numerator, denominator, expectedDecValue, desDecimal) => {
          // Convert the fraction to its decimal value using toDecimal.
          const decimalValue = toDecimal(numerator, denominator);
          // Expect the decimal value to be equal to the expected value.
          expect(decimalValue).toBeCloseTo(expectedDecValue, desDecimal);
        }
      );
    });
  });

  it.each<[AssetInfo, number]>([
    [{ token: { contract_addr: usdtCw20Address } }, 2],
    [{ token: { contract_addr: usdcCw20Address } }, 1],
    [{ native_token: { denom: "orai" } }, 9],
    [{ token: { contract_addr: airiCw20Adress } }, 1]
  ])("test-findMappedTargetedAssetInfo", (info, expectedListLength) => {
    // setup

    // act
    const result = findMappedTargetedAssetInfo(info);

    // assert
    expect(result.length).toEqual(expectedListLength);
  });

  it.each<[AssetInfo, number]>([
    [{ token: { contract_addr: usdtCw20Address } }, 1],
    [{ native_token: { denom: "orai" } }, 2],
    [{ token: { contract_addr: airiCw20Adress } }, 3],
    [{ token: { contract_addr: milkyCw20Address } }, 2],
    [{ token: { contract_addr: scAtomCw20Address } }, 4]
  ])("test-findAssetInfoPathToUsdt", (info, expectedListLength) => {
    // setup

    // act
    const result = findAssetInfoPathToUsdt(info);

    // assert
    expect(result.length).toEqual(expectedListLength);
  });

  it("test-calculatePrefixSum", () => {
    const data = [
      {
        denom: "foo",
        amount: 100
      },
      { denom: "foo", amount: 10 },
      { denom: "bar", amount: 5 },
      { denom: "bar", amount: -1 },
      { denom: "hello", amount: 5 }
    ];
    const result = calculatePrefixSum(1, data);
    expect(result).toEqual([
      { denom: "foo", amount: 101 },
      { denom: "foo", amount: 111 },
      { denom: "bar", amount: 6 },
      { denom: "bar", amount: 5 },
      { denom: "hello", amount: 6 }
    ]);
  });

  it("test-extractUniqueAndFlatten-extracting-unique-items-in-pair-mapping", () => {
    // act
    const result = extractUniqueAndFlatten(pairs);
    // assert
    expect(result).toEqual([
      { token: { contract_addr: "orai10ldgzued6zjp0mkqwsv2mux3ml50l97c74x8sg" } },
      { native_token: { denom: "orai" } },
      { token: { contract_addr: "orai1lus0f0rhx8s03gdllx2n6vhkmf0536dv57wfge" } },
      {
        token: { contract_addr: "orai1065qe48g7aemju045aeyprflytemx7kecxkf5m7u5h5mphd0qlcs47pclp" }
      },
      {
        native_token: { denom: "ibc/A2E2EEC9057A4A1C2C0A6A4C78B0239118DF5F278830F50B4A6BDD7A66506B78" }
      },
      { token: { contract_addr: "orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh" } },
      { token: { contract_addr: "orai1nd4r053e3kgedgld2ymen8l9yrw8xpjyaal7j5" } },
      {
        native_token: { denom: "ibc/9C4DCD21B48231D0BC2AC3D1B74A864746B37E4292694C93C617324250D002FC" }
      },
      { token: { contract_addr: "orai1gzvndtzceqwfymu2kqhta2jn6gmzxvzqwdgvjw" } },
      {
        token: { contract_addr: "orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd" }
      },
      {
        token: { contract_addr: "orai1c7tpjenafvgjtgm9aqwm7afnke6c56hpdms8jc6md40xs3ugd0es5encn0" }
      },
      {
        token: { contract_addr: "orai19q4qak2g3cj2xc2y3060t0quzn3gfhzx08rjlrdd3vqxhjtat0cq668phq" }
      }
    ]);
  });
  it.each<[AssetInfo, string | undefined]>([
    [{ token: { contract_addr: usdtCw20Address } }, "orai1c5s03c3l336dgesne7dylnmhszw8554tsyy9yt"],
    [{ token: { contract_addr: "foo" } }, undefined]
  ])("test-findPairAddress", (assetInfo, expectedPairAddr) => {
    // setup
    let pairInfoData: PairInfoData[] = [
      {
        firstAssetInfo: JSON.stringify({ native_token: { denom: ORAI } } as AssetInfo),
        secondAssetInfo: JSON.stringify({ token: { contract_addr: usdtCw20Address } } as AssetInfo),
        commissionRate: "",
        pairAddr: "orai1c5s03c3l336dgesne7dylnmhszw8554tsyy9yt",
        liquidityAddr: "",
        oracleAddr: ""
      }
    ];
    let assetInfos: [AssetInfo, AssetInfo] = [{ native_token: { denom: ORAI } }, assetInfo];

    // act
    const result = findPairAddress(pairInfoData, assetInfos);

    // assert
    expect(result).toEqual(expectedPairAddr);
  });

  it("test-pairs-should-persist-correct-order-and-has-correct-data", () => {
    // this test should be updated once there's a new pair coming
    expect(pairs).toEqual([
      {
        asset_infos: [{ token: { contract_addr: airiCw20Adress } }, { native_token: { denom: ORAI } }],
        symbols: ["AIRI", "ORAI"]
      },
      {
        asset_infos: [{ token: { contract_addr: oraixCw20Address } }, { native_token: { denom: ORAI } }],
        symbols: ["ORAIX", "ORAI"]
      },
      {
        asset_infos: [{ token: { contract_addr: scOraiCw20Address } }, { native_token: { denom: ORAI } }],
        symbols: ["scORAI", "ORAI"]
      },
      {
        asset_infos: [{ native_token: { denom: ORAI } }, { native_token: { denom: atomIbcDenom } }],
        symbols: ["ORAI", "ATOM"]
      },
      {
        asset_infos: [{ native_token: { denom: ORAI } }, { token: { contract_addr: usdtCw20Address } }],
        symbols: ["ORAI", "USDT"]
      },
      {
        asset_infos: [{ token: { contract_addr: kwtCw20Address } }, { native_token: { denom: ORAI } }],
        symbols: ["KWT", "ORAI"]
      },
      {
        asset_infos: [
          { native_token: { denom: ORAI } },
          {
            native_token: { denom: osmosisIbcDenom }
          }
        ],
        symbols: ["ORAI", "OSMO"]
      },
      {
        asset_infos: [{ token: { contract_addr: milkyCw20Address } }, { token: { contract_addr: usdtCw20Address } }],
        symbols: ["MILKY", "USDT"]
      },
      {
        asset_infos: [{ native_token: { denom: ORAI } }, { token: { contract_addr: usdcCw20Address } }],
        symbols: ["ORAI", "USDC"]
      },
      {
        asset_infos: [{ native_token: { denom: ORAI } }, { token: { contract_addr: tronCw20Address } }],
        symbols: ["ORAI", "WTRX"]
      },
      {
        asset_infos: [{ token: { contract_addr: scAtomCw20Address } }, { native_token: { denom: atomIbcDenom } }],
        symbols: ["scATOM", "ATOM"]
      }
    ]);
  });

  it.each([
    [new Date("2023-07-12T15:12:16.943634115Z").getTime(), 60, 1689174720],
    [new Date("2023-07-12T15:12:24.943634115Z").getTime(), 60, 1689174720],
    [new Date("2023-07-12T15:13:01.943634115Z").getTime(), 60, 1689174780]
  ])("test-roundTime", (date: number, interval: number, expectedResult) => {
    const roundedTime = roundTime(date, interval);
    expect(roundedTime).toEqual(expectedResult);
  });

  it("test-groupByTime-should-group-the-first-two-elements-into-one", () => {
    const data = [
      {
        askDenom: "orai",
        commissionAmount: 0,
        offerAmount: 10000,
        offerDenom: "atom",
        returnAmount: 100,
        spreadAmount: 0,
        taxAmount: 0,
        timestamp: 1690119727,
        txhash: "foo",
        txheight: 1
      },
      {
        askDenom: "orai",
        commissionAmount: 0,
        offerAmount: 10,
        offerDenom: "atom",
        returnAmount: 1,
        spreadAmount: 0,
        taxAmount: 0,
        timestamp: 1690119740,
        txhash: "foo",
        txheight: 1
      },
      {
        askDenom: "atom",
        commissionAmount: 0,
        offerAmount: 10,
        offerDenom: "orai",
        returnAmount: 1,
        spreadAmount: 0,
        taxAmount: 0,
        timestamp: 1690119800,
        txhash: "foo",
        txheight: 1
      }
    ];

    const result = groupByTime(data);
    expect(result).toEqual([
      {
        askDenom: "orai",
        commissionAmount: 0,
        offerAmount: 10000,
        offerDenom: "atom",
        returnAmount: 100,
        spreadAmount: 0,
        taxAmount: 0,
        timestamp: 1690119720,
        txhash: "foo",
        txheight: 1
      },
      {
        askDenom: "orai",
        commissionAmount: 0,
        offerAmount: 10,
        offerDenom: "atom",
        returnAmount: 1,
        spreadAmount: 0,
        taxAmount: 0,
        timestamp: 1690119720,
        txhash: "foo",
        txheight: 1
      },
      {
        askDenom: "atom",
        commissionAmount: 0,
        offerAmount: 10,
        offerDenom: "orai",
        returnAmount: 1,
        spreadAmount: 0,
        taxAmount: 0,
        timestamp: 1690119780,
        txhash: "foo",
        txheight: 1
      }
    ]);
  });

  it("test-calculatePriceByPool", () => {
    const result = calculatePriceByPool(BigInt(10305560305234), BigInt(10205020305234), 0);
    expect(result).toEqual(BigInt(9902432));
  });

  it("test-collectAccumulateLpData-should-aggregate-ops-with-same-pairs", () => {
    const poolResponses: PoolResponse[] = [
      {
        assets: [
          { info: { native_token: { denom: ORAI } }, amount: "1" },
          { info: { token: { contract_addr: usdtCw20Address } }, amount: "1" }
        ],
        total_share: "2"
      },
      {
        assets: [
          { info: { native_token: { denom: ORAI } }, amount: "4" },
          { info: { token: { contract_addr: atomIbcDenom } }, amount: "4" }
        ],
        total_share: "8"
      }
    ];
    const ops: ProvideLiquidityOperationData[] = [
      {
        firstTokenAmount: 1,
        firstTokenDenom: ORAI,
        secondTokenAmount: 1,
        secondTokenDenom: usdtCw20Address,
        firstTokenLp: 1,
        secondTokenLp: 1,
        opType: "provide",
        uniqueKey: "1",
        timestamp: 1,
        txCreator: "a",
        txhash: "a",
        txheight: 1
      },
      {
        firstTokenAmount: 1,
        firstTokenDenom: ORAI,
        secondTokenAmount: 1,
        secondTokenDenom: usdtCw20Address,
        firstTokenLp: 1,
        secondTokenLp: 1,
        opType: "withdraw",
        uniqueKey: "2",
        timestamp: 1,
        txCreator: "a",
        txhash: "a",
        txheight: 1
      },
      {
        firstTokenAmount: 1,
        firstTokenDenom: ORAI,
        secondTokenAmount: 1,
        secondTokenDenom: atomIbcDenom,
        firstTokenLp: 1,
        secondTokenLp: 1,
        opType: "withdraw",
        uniqueKey: "3",
        timestamp: 1,
        txCreator: "a",
        txhash: "a",
        txheight: 1
      }
    ];

    collectAccumulateLpData(ops, poolResponses);
    expect(ops[0].firstTokenLp.toString()).toEqual("2");
    expect(ops[0].secondTokenLp.toString()).toEqual("2");
    expect(ops[1].firstTokenLp.toString()).toEqual("1");
    expect(ops[1].secondTokenLp.toString()).toEqual("1");
    expect(ops[2].firstTokenLp.toString()).toEqual("3");
    expect(ops[2].secondTokenLp.toString()).toEqual("3");
  });

  it("test-concatDataToUniqueKey-should-return-unique-key-in-correct-order-from-timestamp-to-first-to-second-amount-and-denom", () => {
    // setup
    const firstDenom = "foo";
    const firstAmount = 1;
    const secondDenom = "bar";
    const secondAmount = 1;
    const timestamp = 100;

    // act
    const result = concatDataToUniqueKey({ firstAmount, firstDenom, secondAmount, secondDenom, timestamp });

    // assert
    expect(result).toEqual("100-foo-1-bar-1");
  });

  // it.each<[[AssetInfo, AssetInfo], AssetInfo, number]>([
  //   [
  //     [{ native_token: { denom: ORAI } }, { native_token: { denom: atomIbcDenom } }],
  //     { native_token: { denom: atomIbcDenom } },
  //     0
  //   ],
  //   [
  //     [{ native_token: { denom: ORAI } }, { token: { contract_addr: usdtCw20Address } }],
  //     { native_token: { denom: ORAI } },
  //     1
  //   ],
  //   [
  //     [{ native_token: { denom: ORAI } }, { token: { contract_addr: usdcCw20Address } }],
  //     { native_token: { denom: ORAI } },
  //     1
  //   ],
  //   [
  //     [{ token: { contract_addr: tronCw20Address } }, { native_token: { denom: atomIbcDenom } }],
  //     { token: { contract_addr: tronCw20Address } },
  //     1
  //   ]
  // ])("test-findUsdOraiInPair", (infos, expectedInfo, expectedBase) => {
  //   // act
  //   const result = findUsdOraiInPair(infos);
  //   // assert
  //   expect(result.target).toEqual(expectedInfo);
  //   expect(result.baseIndex).toEqual(expectedBase);
  // });
});
