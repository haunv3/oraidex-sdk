import { Log } from "@cosmjs/stargate/build/logs";
import { Tx } from "@oraichain/cosmos-rpc-sync";
import { Addr, Asset, AssetInfo, Binary, Decimal, Uint128 } from "@oraichain/oraidex-contracts-sdk";
import { ExecuteMsg as OraiswapRouterExecuteMsg } from "@oraichain/oraidex-contracts-sdk/build/OraiswapRouter.types";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";

export type AssetData = {
  info: AssetInfo;
  symbol: string;
  image: string;
  name: string;
};

export type SwapOperationData = {
  txhash: string;
  offerDenom: string;
  offerAmount: string;
  askDenom: string;
  returnAmount: string;
  taxAmount: number;
  commissionAmount: number;
  spreadAmount: number;
};

export type AccountTx = {
  accountAddress: string;
  txhash: string;
};

export type LiquidityOpType = "provide" | "withdraw";

export type ProvideLiquidityOperationData = {
  txhash: string;
  firstTokenAmount: number;
  firstTokenDenom: string;
  secondTokenAmount: number;
  secondTokenDenom: string;
  txCreator: string;
  opType: LiquidityOpType;
};

export type WithdrawLiquidityOperationData = ProvideLiquidityOperationData;

export type TxAnlysisResult = {
  // transactions: Tx[];
  swapOpsData: SwapOperationData[];
  accountTxs: AccountTx[];
  provideLiquidityOpsData: ProvideLiquidityOperationData[];
  withdrawLiquidityOpsData: WithdrawLiquidityOperationData[];
};

export type MsgExecuteContractWithLogs = MsgExecuteContract & {
  logs: Log;
};

export type ModifiedMsgExecuteContract = Omit<MsgExecuteContractWithLogs, "msg"> & {
  msg: MsgType;
};

export type MsgType =
  | {
      provide_liquidity: {
        assets: [Asset, Asset];
        receiver?: Addr | null;
        slippage_tolerance?: Decimal | null;
      };
    }
  | OraiswapRouterExecuteMsg
  | {
      send: {
        amount: Uint128;
        contract: string;
        msg: Binary;
      };
    }
  | OraiswapPairCw20HookMsg;

export type OraiswapPairCw20HookMsg = {
  swap: { belief_price?: Decimal; max_spread?: Decimal; to?: string } | { withdraw_liquidity: {} };
};

export type PairMapping = {
  asset_infos: [AssetInfo, AssetInfo];
};
