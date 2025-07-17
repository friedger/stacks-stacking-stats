import { getPrices } from './utils/price';
import { getRewards } from './utils/stacks-db';
import {
  getPoxInfo,
  getStacksBlockHeight,
  getThresholdFromParticipation,
} from './utils/stacks-node';
import { read, readFileSync, writeFileSync } from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

// fetch cycle data
const cycleData = async (cycle: number) => {
  // 1. calcualte start and end bitcoin block height
  // 2. get corresponding stacks blocks
  // 3. get price at end of cycle for btc and stx
  // 4. get btc rewards for fast pool, friedger pool and multi pool
  // 5. calculate APY

  // 1. calcualte start and end bitcoin block height
  const cycleStart = 666050 + cycle * 2100;
  const cycleRewardsEnd = 666050 + (cycle + 1) * 2100 - 100;

  // 2. get corresponding stacks blocks
  const stacksCycleStart = await getStacksBlockHeight(cycleStart, h => h + 1);
  const stacksCycleEnd = await getStacksBlockHeight(cycleRewardsEnd, h => h - 1);
  const cyclePoxInfo = await getPoxInfo(cycle);
  const totalStacked = cyclePoxInfo.total_stacked_amount;

  const { total: btcRewards, fastPoolV1, fastPoolV2 } = await getRewards(cycle);
  const priceAtEnd = await getPrices(stacksCycleEnd.block_time_iso);
  const rewardsUsd = btcRewards * priceAtEnd.btcPrice.usd;
  const stackedUsd = (Number(totalStacked) * priceAtEnd.stxPrice.usd) / 1_000_000;

  const cycleYield = rewardsUsd / Number(stackedUsd);
  const apy = (1.0 + cycleYield) ** 26 - 1;

  const threshold = await getThresholdFromParticipation(
    Number(totalStacked),
    stacksCycleEnd.height - 1 || stacksCycleStart.height + 1
  );
  const blockRewardsUsd = 2100 * 1000 * priceAtEnd.stxPrice.usd;
  return {
    cycle,
    cycleStart,
    cycleRewardsEnd,
    stacksCycleStart: stacksCycleStart.height,
    stacksCycleRewardsEnd: stacksCycleEnd.height,
    cycleStartDate: stacksCycleStart.block_time_iso,
    cycleRewardsEndDate: stacksCycleEnd.block_time_iso,
    stxPriceAtEnd: priceAtEnd.stxPrice.usd,
    btcPriceAtEnd: priceAtEnd.btcPrice.usd,
    btcRewards,
    fastPoolV1,
    fastPoolV2,
    totalStacked,
    rewardsUsd,
    blockRewardsUsd,
    stackedUsd,
    cycleYield,
    apy,
    threshold,
  };
};

const fetchData = async () => {
  const all = [];
  for (let i = 86; i <= 114; i++) {
    const r = await cycleData(i);
    console.log(r);
    writeFileSync(`data/cycle-${i}.json`, JSON.stringify(r, null, 2));
    all.push(r);
  }
  writeFileSync('data/all.json', JSON.stringify(all, null, 2));
};

const logData = async () => {
  const all = JSON.parse(readFileSync('data/all.json').toString());
  for (let i = 1; i < all.length; i++) {
    const dollarAtStart = 1e3;
    const stxAtStart = dollarAtStart / all[i - 1].stxPriceAtEnd;
    const dollarAtEnd = stxAtStart * (all[i].cycleYield + 1) * all[i].stxPriceAtEnd;
    const dollarYield = (dollarAtEnd / dollarAtStart) ** 26 - 1;
    console.log(dollarAtEnd, dollarYield);
  }
};

fetchData();
//logData();
