const sdk = require("@defillama/sdk");
//const { Token } = require("graphql");
const erc20 = require("../helper/abis/erc20.json");
const abi = require("./abi.json");
const {
  sumTokens,
  sumTokensAndLPs,
  unwrapUniswapLPs,
} = require("../helper/unwrapLPs");
const utils = require("../helper/utils.js");
const { pool2Exports } = require("../helper/pool2");
const abiGeneral = require("../helper/abis/masterchef.json");
const { default: BigNumber } = require("bignumber.js");
const { isFunction } = require("util");
const { transformPolygonAddress } = require("../helper/portedTokens");
const { addFundsInMasterChef } = require("../helper/masterchef");
const { uniTvlExport, calculateUniTvl } = require("../helper/calculateUniTvl");


const MASTERCHEF_CONTRACT = "0x4aA8DeF481d19564596754CD2108086Cf0bDc71B";
const IRISTETU = "0x8bd49c0106da8618128e56f57e0d4b8d820d9d72";
const vaultWMATIC = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
const WMATIC_TOKEN = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
const APOLLO_TOKEN = "0x64b4d9B111BcA3c7C2d24bc73136d30Bbaca0067";
const pAPOLLO_TOKEN = "0xe644be5d4d5e7f16f0039cd67bcd438d1a62ef13";
const MC_APOLLO = "0x12c147e5f46E167008A93A18153b054c70515Aa7";

const KAVIANWMATICVAULT = "0x75fd7fa818f0d970668dca795b7d79508776a5b1";
const KAVIANWMATICLP = "0xca2cfc8bf76d9d8eb08e824ee6278f7b885c3b70";

const GBNTWMATICVAULT = "0xA375495919205251a05f3B259B4D3cc30a4d3ED5";
const GBNTWMATICLP = "0xd883c361d1e8a7e1f77d38e0a6e45d897006b798";

const ROUTEDFYNVAULT = "0xD55D83f4f3c67E02B6a37E9eAd2396B9a5C9E3F9";
const ROUTEDFYNLP = "0xb0dc320ea9eea823a150763abb4a7ba8286cd08b";

const IRISWMATICVAULT = "0xd74941d4f9202d7e4c550d344507298a4e3ed2dd";
const IRISWMATICLP = "0xCBd7b263460ad4807dEAdAd3858DE6654f082cA4";

const vaultK2WM = async (timestamp, ehtBlock, chainBlocks) => {
  const balances = {};
  const block = chainBlocks.polygon;
  const chain = "polygon";
  // const transformAddress = (addr) => `polygon:${addr}`;
  const transformAddress = await transformPolygonAddress();
  const stackedLP = sdk.api.erc20.balanceOf({
    target: KAVIANWMATICLP,
    owner: KAVIANWMATICVAULT,
    chain: "polygon",
    block: chainBlocks.polygon,
  });
  const lpBalance = (await stackedLP).output;
  
  await unwrapUniswapLPs(balances,
     [{
       token: KAVIANWMATICLP,
       balance: lpBalance
     }], block, chain, transformAddress);
  return balances;
};

const vaultGBWM = async (timestamp, ehtBlock, chainBlocks) => {
  const balances = {};
  const block = chainBlocks.polygon;
  const chain = "polygon";
  // const transformAddress = (addr) => `polygon:${addr}`;
  const transformAddress = (addr) => `polygon:${addr}`;
  const stackedLP = sdk.api.erc20.balanceOf({
    target: GBNTWMATICLP,
    owner: GBNTWMATICVAULT,
    chain: "polygon",
    block: chainBlocks.polygon,
  });
  const lpBalance = (await stackedLP).output;
  await unwrapUniswapLPs(balances,
     [{
       token: GBNTWMATICLP,
       balance: lpBalance
     }], block, chain, transformAddress);
  return balances;
};

const vaultRODFYN = async (timestamp, ehtBlock, chainBlocks) => {
  const balances = {};
  const block = chainBlocks.polygon;
  const chain = "polygon";
  // const transformAddress = (addr) => `polygon:${addr}`;
  const transformAddress = (addr) => `polygon:${addr}`;
  const stackedLP = sdk.api.erc20.balanceOf({
    target: ROUTEDFYNLP,
    owner: ROUTEDFYNVAULT,
    chain: "polygon",
    block: chainBlocks.polygon,
  });
  const lpBalance = (await stackedLP).output;
  await unwrapUniswapLPs(balances,
     [{
       token: ROUTEDFYNLP,
       balance: lpBalance
     }], block, chain, transformAddress);
  return balances;
};
const uniTvl = async (timestamp, ehtBlock, chainBlocks) => {
  const balances = {};
  const transformAddress = addr => `polygon:${addr}`;
  return calculateUniTvl(transformAddress, chainBlocks.polygon, "polygon", "0x570d669b8e2751dfe65bbdd4db3b34b53c9c6d6f", 0, true);
  // return await uniTvlExport(KAVIANWMATICLP, "polygon");
}
const masterchefTVL = async (  chainBlocks) => {
  const balances = {};
  const transformAddress = addr => `polygon:${addr}`;
  await addFundsInMasterChef(balances, MASTERCHEF_CONTRACT, chainBlocks.polygon, "polygon", transformAddress)
  return balances;
}
module.exports = {
  misrepresentedTokens: true,
  methodology: "TVL comes from Hermes liquidity pools",
  // vault1: {
  //   vaultK2WM,
  // },
  masterchef: {
    masterchefTVL,
  } ,
  vault: {
    uniTvl,
  },
    // vaultKAVIANWMATIC: pool2Exports(KAVIANWMATICVAULT, [KAVIANWMATICLP], "polygon"),
    // vaultGBWMATIC: pool2Exports(GBNTWMATICVAULT, [GBNTWMATICLP], "polygon"),
    // vaultRODFYN: pool2Exports(ROUTEDFYNVAULT, [ROUTEDFYNLP], "polygon"),
    // vaultIRISWMATIC: pool2Exports(IRISWMATICVAULT, [IRISWMATICLP], "polygon"),
  tvl: masterchefTVL,
  // tvl: sdk.util.sumChainTvls([poolTvl]),
};
