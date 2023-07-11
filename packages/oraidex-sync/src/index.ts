import "dotenv/config";
import { parseTxs, parseWasmEvents } from "./helper";
import { DuckDb } from "./db";
import { WriteData, SyncData, Txs } from "@oraichain/cosmos-rpc-sync";
import "dotenv/config";

const duckDb = new DuckDb();
class WriteOrders extends WriteData {
  constructor() {
    super();
  }

  async process(chunk: any): Promise<boolean> {
    try {
      const { txs, offset: newOffset, queryTags } = chunk as Txs;
      console.log("txs: ", txs.length);
      parseTxs(txs);
    } catch (error) {
      console.log("error processing data: ", error);
      return false;
    }
    return true;
  }
}

const sync = async () => {
  try {
    await duckDb.initDuckDb();
    await duckDb.createHeightSnapshot();
    const rpcUrl = process.env.RPC_URL || "https://rpc.orai.io";
    let { currentInd } = await duckDb.loadHeightSnapshot();
    // if its' the first time, then we use the height 12388825 since its the safe height for the rpc nodes to include timestamp & new indexing logic
    if (currentInd <= 12388825) {
      currentInd = 12388825;
    }
    new SyncData({
      offset: currentInd,
      rpcUrl,
      queryTags: [],
      limit: 100,
      maxThreadLevel: 1,
      interval: 5000,
    }).pipe(new WriteOrders());
  } catch (error) {
    console.log("error in start: ", error);
  }
};

sync();

export { duckDb, sync };
