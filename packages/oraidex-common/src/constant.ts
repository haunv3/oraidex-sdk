import { CosmosChainId, EvmChainId } from "./network";

export const truncDecimals = 6;
export const atomic = 10 ** truncDecimals;

export const ORAI = "orai";
export const UAIRI = "uAIRI";
export const AIRI = "AIRI";
export const ATOM = "ATOM";
export const OSMO = "OSMO";
export const LP = "LP";
export const KWT = "oraie";
export const MILKY = "milky";
export const STABLE_DENOM = "usdt";
export const TRON_DENOM = "trx";

// estimate fee
export const GAS_ESTIMATION_SWAP_DEFAULT = 580000;
export const GAS_ESTIMATION_BRIDGE_DEFAULT = 200000;
export const MULTIPLIER = 1.6;
export const HIGH_GAS_PRICE = 0.007;
export const AVERAGE_COSMOS_GAS_PRICE = 0.025; // average based on Keplr

export const SEC_PER_YEAR = 60 * 60 * 24 * 365;

// commission_rate pool
export const COMMISSION_RATE = "0.003";

/* network:settings */
export const IBC_TRANSFER_TIMEOUT = 3600;
export const AXIOS_THROTTLE_THRESHOLD = 2000;
export const AXIOS_TIMEOUT = 10000;

// bsc and eth information
export const ETHEREUM_SCAN = "https://etherscan.io";
export const BSC_SCAN = "https://bscscan.com";
export const TRON_SCAN = "https://tronscan.org";
export const KWT_SCAN = "https://scan.kawaii.global";

export const ORAI_BRIDGE_UDENOM = "uoraib";
export const ORAI_BRIDGE_EVM_DENOM_PREFIX = "oraib";
export const ORAI_BRIDGE_EVM_ETH_DENOM_PREFIX = "eth-mainnet";
export const ORAI_BRIDGE_EVM_TRON_DENOM_PREFIX = "trontrx-mainnet";
export const ORAI_BRIDGE_EVM_FEE = "1";
export const ORAI_BRIDGE_CHAIN_FEE = "1";

// bsc contracts
export const ORAI_BSC_CONTRACT = "0xA325Ad6D9c92B55A3Fc5aD7e412B1518F96441C0";
export const AIRI_BSC_CONTRACT = "0x7e2A35C746F2f7C240B664F1Da4DD100141AE71F";
export const USDT_BSC_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";
export const WRAP_BNB_CONTRACT = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
export const KWT_BSC_CONTRACT = "0x257a8d1E03D17B8535a182301f15290F11674b53";
export const MILKY_BSC_CONTRACT = "0x6fE3d0F096FC932A905accd1EB1783F6e4cEc717";
// tron contracts
export const USDT_TRON_CONTRACT = "0xa614f803B6FD780986A42c78Ec9c7f77e6DeD13C";
export const WRAP_TRON_TRX_CONTRACT = "0x891cdb91d149f23B1a45D9c5Ca78a88d0cB44C18";

// erc20 contracts
export const ORAI_ETH_CONTRACT = "0x4c11249814f11b9346808179Cf06e71ac328c1b5";
export const USDC_ETH_CONTRACT = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
export const MILKY_ERC_CONTRACT = "0xd567B3d7B8FE3C79a1AD8dA978812cfC4Fa05e75";
export const WRAP_ETH_CONTRACT = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const KWT_DENOM = ORAI_BRIDGE_EVM_DENOM_PREFIX + KWT_BSC_CONTRACT;
export const MILKY_DENOM = ORAI_BRIDGE_EVM_DENOM_PREFIX + MILKY_BSC_CONTRACT;

// config for relayer
export const ATOM_ORAICHAIN_CHANNELS = "channel-301 channel-15";
// export const ATOM_ORAICHAIN_CHANNELS="channel-642 channel-124"
export const OSMOSIS_ORAICHAIN_CHANNELS = "channel-216 channel-13";
export const ORAIB_ORAICHAIN_CHANNELS = "channel-1 channel-29";
export const ORAIB_ORAICHAIN_CHANNELS_TEST = "channel-5 channel-64";
export const ORAIB_ORAICHAIN_CHANNELS_OLD = "channel-0 channel-20";
export const KWT_ORAICHAIN_CHANNELS = "channel-0 channel-21";
export const INJECTIVE_ORAICHAIN_CHANNELS = "channel-147 channel-146";
export const NOBLE_ORAICHAIN_CHANNELS = "channel-34 channel-147";
export const NOBLE_ORAICHAIN_CHANNELS_TEST = "channel-35 channel-148";

// config for ibc denom
export const ATOM_ORAICHAIN_DENOM = "ibc/A2E2EEC9057A4A1C2C0A6A4C78B0239118DF5F278830F50B4A6BDD7A66506B78";
export const OSMOSIS_ORAICHAIN_DENOM = "ibc/9C4DCD21B48231D0BC2AC3D1B74A864746B37E4292694C93C617324250D002FC";
export const AIRIBSC_ORAICHAIN_DENOM = "ibc/C458B4CC4F5581388B9ACB40774FDFBCEDC77A7F7CDFB112B469794AF86C4A69";
export const USDTBSC_ORAICHAIN_DENOM = "ibc/E8B5509BE79025DD7A572430204271D3061A535CC66A3A28FDEC4573E473F32F";
export const KWTBSC_ORAICHAIN_DENOM = "ibc/4F7464EEE736CCFB6B444EB72DE60B3B43C0DD509FFA2B87E05D584467AAE8C8";
export const MILKYBSC_ORAICHAIN_DENOM = "ibc/E12A2298AC40011C79F02F26C324BD54DF20F4B2904CB9028BFDEDCFAA89B906";
export const KWT_SUB_NETWORK_DENOM = "ibc/E8734BEF4ECF225B71825BC74DE30DCFF3644EAC9778FFD4EF9F94369B6C8377";
export const MILKY_SUB_NETWORK_DENOM = "ibc/81ACD1F7F5380CAA3F590C58C699FBD408B8792F694888D7256EEAF564488FAB";
export const INJECTIVE_ORAICHAIN_DENOM = "ibc/49D820DFDE9F885D7081725A58202ABA2F465CAEE4AFBC683DFB79A8E013E83E";
export const ORAIIBC_INJECTIVE_DENOM = "ibc/C20C0A822BD22B2CEF0D067400FCCFB6FAEEE9E91D360B4E0725BD522302D565";

// config for oraichain token
export const AIRI_CONTRACT = "orai10ldgzued6zjp0mkqwsv2mux3ml50l97c74x8sg";
export const ORAIX_CONTRACT = "orai1lus0f0rhx8s03gdllx2n6vhkmf0536dv57wfge";
export const USDT_CONTRACT = "orai12hzjxfh77wl572gdzct2fxv2arxcwh6gykc7qh";
export const USDC_CONTRACT = "orai15un8msx3n5zf9ahlxmfeqd2kwa5wm0nrpxer304m9nd5q6qq0g6sku5pdd";
export const KWT_CONTRACT = "orai1nd4r053e3kgedgld2ymen8l9yrw8xpjyaal7j5";
export const MILKY_CONTRACT = "orai1gzvndtzceqwfymu2kqhta2jn6gmzxvzqwdgvjw";
export const SCORAI_CONTRACT = "orai1065qe48g7aemju045aeyprflytemx7kecxkf5m7u5h5mphd0qlcs47pclp";
export const TRX_CONTRACT = "orai1c7tpjenafvgjtgm9aqwm7afnke6c56hpdms8jc6md40xs3ugd0es5encn0";
export const SCATOM_CONTRACT = "orai19q4qak2g3cj2xc2y3060t0quzn3gfhzx08rjlrdd3vqxhjtat0cq668phq";
export const XOCH_CONTRACT = "orai1lplapmgqnelqn253stz6kmvm3ulgdaytn89a8mz9y85xq8wd684s6xl3lt";
export const INJECTIVE_CONTRACT = "orai19rtmkk6sn4tppvjmp5d5zj6gfsdykrl5rw2euu5gwur3luheuuusesqn49";

// config for oraichain contract
export const FACTORY_CONTRACT = "orai1hemdkz4xx9kukgrunxu3yw0nvpyxf34v82d2c8";
export const FACTORY_V2_CONTRACT = "orai167r4ut7avvgpp3rlzksz6vw5spmykluzagvmj3ht845fjschwugqjsqhst";
export const ROUTER_V2_CONTRACT = "orai1j0r67r9k8t34pnhy00x3ftuxuwg0r6r4p8p6rrc8az0ednzr8y9s3sj2sf";
export const ORACLE_CONTRACT = "orai18rgtdvlrev60plvucw2rz8nmj8pau9gst4q07m";
export const STAKING_CONTRACT = "orai19p43y0tqnr5qlhfwnxft2u5unph5yn60y7tuvu";
export const REWARDER_CONTRACT = "orai15hua2q83fp666nwhnyrn9g8gt9ueenl32qnugh";
export const CONVERTER_CONTRACT = "orai14wy8xndhnvjmx6zl2866xqvs7fqwv2arhhrqq9";
export const ORAIDEX_LISTING_CONTRACT = "orai1mkr02jzz0jfh34ps6z966uyueu4tlmnyg57nn72pxfq9t9a706tsha5znh";
export const IBC_WASM_HOOKS_CONTRACT = "orai1w0h4ua3k8w2udju97nlws6dfh2ppwkhcewg09zp8gera4mf8lxxs6q086g";

// config for evm
export const GRAVITY_EVM_CONTRACT = "0x758191e89ff9E898D884ca3426e486e5d8476A44";
// export const GRAVITY_TRON_CONTRACT in tron format TLXrPtQor6xxF2HeQtmKJUUkVNjJZVsgTM
export const GRAVITY_TRON_CONTRACT = "0x73Ddc880916021EFC4754Cb42B53db6EAB1f9D64";

// IBC Wasm contract
export const IBC_WASM_CONTRACT = "orai195269awwnt5m6c843q6w7hp8rt0k7syfu9de4h0wz384slshuzps8y7ccm";
export const IBC_WASM_CONTRACT_TEST = "orai1jtt8c2lz8emh8s708y0aeduh32xef2rxyg8y78lyvxn806cu7q0sjtxsnv";

// Utiliti contract
export const MULTICALL_CONTRACT = "orai1q7x644gmf7h8u8y6y8t9z9nnwl8djkmspypr6mxavsk9ual7dj0sxpmgwd";

export const BASE_API_URL = "https://api.oraidex.io";

// websocket consts
export const WEBSOCKET_RECONNECT_ATTEMPTS = 5;
export const WEBSOCKET_RECONNECT_INTERVAL = 20000;

export const UNISWAP_ROUTER_DEADLINE = 15000; // swap deadline in ms
export const EVM_BALANCE_RETRY_COUNT = 5;

export const EVM_CHAIN_ID: EvmChainId[] = ["0x38", "0x01", "0x1ae6", "0x2b6653dc"];
export const COSMOS_CHAIN_ID: CosmosChainId[] = [
  "Oraichain",
  "oraibridge-subnet-2",
  "osmosis-1",
  "cosmoshub-4",
  "injective-1",
  "kawaii_6886-1",
  "noble-1"
];

// asset info token
export const ORAI_INFO = {
  native_token: {
    denom: ORAI
  }
};

export const ORAIX_INFO = {
  token: {
    contract_addr: ORAIX_CONTRACT
  }
};

export const ORAIXOCH_INFO = {
  token: {
    contract_addr: XOCH_CONTRACT
  }
};

// slippage swap
export const OPTIONS_SLIPPAGE = [1, 3, 5];
export const DEFAULT_SLIPPAGE = OPTIONS_SLIPPAGE[0];
export const DEFAULT_MANUAL_SLIPPAGE = 2.5;

// create cw20 token
export const CODE_ID_CW20 = 761;
export const CW20_DECIMALS = 6;

// type switch wallet between keplr and owallet
export type WalletType = "keplr" | "owallet";

export const gravityContracts: Omit<Record<EvmChainId, string>, "0x1ae6"> = {
  "0x38": GRAVITY_EVM_CONTRACT,
  "0x01": GRAVITY_EVM_CONTRACT,
  "0x2b6653dc": GRAVITY_TRON_CONTRACT
};
