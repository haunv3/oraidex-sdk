import 'dotenv/config';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { stringToPath } from '@cosmjs/crypto';
import { GasPrice } from '@cosmjs/stargate';
import { delay, matchingOrder } from './index';

(async () => {
  const prefix = 'orai';
  const mnemonic = process.env['MNEMONIC'];
  const contractAddr = process.env.CONTRACT;
  if (!mnemonic || mnemonic.length < 48) {
    throw new Error('Must set MNEMONIC to a 12 word phrase');
  }
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    hdPaths: [stringToPath(process.env.HD_PATH || "m/44'/118'/0'/0/0")],
    prefix
  });
  const [firstAccount] = await wallet.getAccounts();
  const senderAddress = firstAccount.address;
  const client = await SigningCosmWasmClient.connectWithSigner(process.env.RPC_URL!, wallet, {
    gasPrice: GasPrice.fromString('0.002orai'),
    prefix
  });

  while (true) {
    try {
      const start = Date.now();
      const result = await matchingOrder(client, senderAddress, contractAddr, 30, 'orai');
      console.log('matching time:', Date.now() - start, 'ms', 'result', result);
    } catch (error) {
      console.error(error);
    }

    await delay(1000);
  }
})();
