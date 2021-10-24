const sdk = require("@defillama/sdk");
const abi = require("./abi.json");
const { GraphQLClient, gql } = require('graphql-request')
const { default: BigNumber } = require("bignumber.js");
const { addFundsInMasterChef } = require("../helper/masterchef");
const { toUSDTBalances } = require("../helper/balances");

const usdtAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7';

const masterchefs = {
  iris: "0x4aA8DeF481d19564596754CD2108086Cf0bDc71B",
  apollo: "0x66c12e9dC2b3D9Fd5DFe5f54b3Dc5C3D6f2461f4"
}

const vaults = [
  //IRIS VAULTS
  { 
    name: "KAVIAN/WMATIC",
    vault: "0x75fd7fa818f0d970668dca795b7d79508776a5b1",
    lpToken: "0xca2cfc8bf76d9d8eb08e824ee6278f7b885c3b70",
    amm: "quickswap"
  },
  {
    name: "GBNT/WMATIC",
    vault: "0x483a58Fd4B023CAE2789cd1E1e5F6F52f93df2C7",
    lpToken: "0xd883c361d1e8a7e1f77d38e0a6e45d897006b798",
    amm: "polycat"
  },
  //APOLLO VAULTS
  {
    name: "USDC/WETH",
    vault: "0x0f8860515B51bBbB3AEe4603Fe8716454a2Ed24C",
    lpToken: "0x853ee4b2a13f8a742d64c8f088be7ba2131f670d",
    amm: "quickswap"
  },
  {
    name: "USDC/USDT",
    vault: "0xaaF43E30e1Aa6ed2dfED9CCD03AbAF7C34B5B8F6",
    lpToken: "0x2cf7252e74036d1da831d11089d326296e64a728",
    amm: "quickswap"
  },
  {
    name: "ETH/WMATIC",
    vault: "0xC12b54BAEc88CC4F28501f90Bb189Ac7132ee97F",
    lpToken: "0xadbf1854e5883eb8aa7baf50705338739e558e5b",
    amm: "quickswap"
  },
  {
    name: "BTC/ETH",
    vault: "0xf32baBB43226DdF187151Eb392c1e7F8C0F4a2BB",
    lpToken: "0xdc9232e2df177d7a12fdff6ecbab114e2231198d",
    amm: "quickswap"
  },
  {
    name: "DFYN/ROUTE",
    vault: "0x467cb3cE716e0801355BFb3b3F4070108E46051f",
    lpToken: "0xb0dc320ea9eea823a150763abb4a7ba8286cd08b",
    amm: "dfyn"
  },

]

const ignoreAddr = [
  "0x75fd7fa818f0d970668dca795b7d79508776a5b1", //godKAVIANWMATIC
  "0x483a58Fd4B023CAE2789cd1E1e5F6F52f93df2C7", //godGBNTWMATIC
  "0x0f8860515B51bBbB3AEe4603Fe8716454a2Ed24C", //godUSDCWETH
  "0xaaF43E30e1Aa6ed2dfED9CCD03AbAF7C34B5B8F6", //godUSDCUSDT
  "0xC12b54BAEc88CC4F28501f90Bb189Ac7132ee97F", //godETHWMATIC
  "0xf32baBB43226DdF187151Eb392c1e7F8C0F4a2BB",  //godBTCETH
  "0x4d1E50D81C7FaFEBF4FC140c4C6eA7Fd1C2F372b", //DYFNLP
  "0x996B06F25069Cf9F0B88e639f8E1FB22C6558805"  //DFYNLP
]

const endpoints = { 
  quickswap: "https://api.thegraph.com/subgraphs/name/sameepsi/quickswap03",
  polycat: "https://api.thegraph.com/subgraphs/name/polycatfi/polycat-finance-dex",
  dfyn: "https://api.thegraph.com/subgraphs/name/ss-sonic/dfyn-v5",
  balancer: "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-polygon-v2"
}

const query = gql`
  query get_tvl($lpTokenId: String){
    pair(
      id: $lpTokenId
      ){
      totalSupply
      reserveUSD
    }
  }
  `;

async function getBalancerTVL(chainBlocks){
  const block = chainBlocks.polygon;
  const chain = "polygon";
  const lpTokenId = "0x7320d680ca9bce8048a286f00a79a2c9f8dcd7b3";
  const balancerAddr = "0x7320d680ca9bce8048a286f00a79a2c9f8dcd7b3000100000000000000000044"
  var graphQLClient = new GraphQLClient(endpoints.balancer);
  const queryBal = gql`
    query get_price($balancerAddr: String){
      pool(
        id: $balancerAddr
        ){
        totalLiquidity
        totalShares
      }
    }
    `;
  const response = await graphQLClient.request(queryBal, {
    balancerAddr
  });
  const price = BigNumber(response.pool.totalLiquidity).div(response.pool.totalShares);
  const balanceCall = sdk.api.abi.call({
    target: lpTokenId,
    abi: abi.balanceof,
    block: block,
    params: masterchefs.iris,
    chain: chain
  });
  const lpBalance = (await balanceCall).output;
  const usdTvl = BigNumber(lpBalance).times(price).div(1e18);

  return toUSDTBalances(usdTvl);
}

async function getVaultTVL(vaultInfo, chainBlocks){
  const block = chainBlocks.polygon;
  const chain = "polygon";
  const lpTokenId = vaultInfo.lpToken;
  var graphQLClient = new GraphQLClient(endpoints[vaultInfo.amm]);
  
  //First, we'll get the totalSupply and the reserves in USD in the AMM 4 this lpToken
  const pair = await graphQLClient.request(query, {
    lpTokenId
  });

  //Then, we get the balance in our vault
  const balanceCall = sdk.api.abi.call({
    target: vaultInfo.vault,
    abi: abi.balance,
    block: block,
    chain: chain
  })
  const lpBalance = (await balanceCall).output;
  
  //Last, the tvl in USD in our vault
  const usdTvl =  BigNumber(lpBalance).times(pair.pair.reserveUSD).div(pair.pair.totalSupply).div(1e18);
  
  return toUSDTBalances(usdTvl)["0xdac17f958d2ee523a2206206994597c13d831ec7"];
}

const tvlVaults = async (timestamp, ethBlock, chainBlocks) => {
  let balances = {};
  for (let i = 0; i < vaults.length; i++) {
    sdk.util.sumSingleBalance(balances, usdtAddress, await getVaultTVL(vaults[i], chainBlocks));
  }
  
  return balances;
};

const tvlBalancer = async (timestamp, ethBlock, chainBlocks) => {
  return await getBalancerTVL(chainBlocks);
}

const masterchefTVL = async (timestamp, ethBlock, chainBlocks) => {
  const balances = {};
  const transformAddress = addr => `polygon:${addr}`;
  await addFundsInMasterChef(balances, masterchefs.apollo, chainBlocks.polygon, "polygon", transformAddress, undefined, ignoreAddr)
  
  return balances;
}

module.exports = {
  misrepresentedTokens: true,
  methodology: "Hermes TVL is calculated from our vaults, which are not native tokens. Pool 2 is based on the TVL of native tokens hosted in our masterchef.",
  pool2: {
    masterchefTVL,
    tvlBalancer
  },
  vault: {
    tvlVaults,
  },
  tvl: sdk.util.sumChainTvls([
    masterchefTVL,
    tvlBalancer,
    tvlVaults
  ])
};
