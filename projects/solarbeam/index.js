const {calculateUsdUniTvl} = require('../helper/getUsdUniTvl')

const wMOVR = "0x98878B06940aE243284CA214f92Bb71a2b032B8A" // their own barely used version

module.exports={
    misrepresentedTokens: true,
    tvl: calculateUsdUniTvl("0x049581aEB6Fe262727f290165C29BDAB065a1B68", "moonriver", wMOVR, 
    [
        '0x6bD193Ee6D2104F14F94E2cA6efefae561A4334B', // SOLAR
        '0xbD90A6125a84E5C512129D622a75CDDE176aDE5E', // RIB
        '0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d', // USDC
        '0xb44a9b6905af7c801311e8f4e76932ee959c663c', // USDT
        '0x639a647fbe20b6c8ac19e48e2de44ea792c62c5c', // WETH
        '0x5d9ab5522c64e1f6ef5e3627eccc093f56167818', // BUSD
    ], "moonriver"),
}