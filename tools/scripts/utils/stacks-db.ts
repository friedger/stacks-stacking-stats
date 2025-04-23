import * as pg from 'pg';

async function createPgClient() {
  const client = new pg.Client({
    host: '192.168.129.114',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
  });
  await client.connect();
  return client;
}

const totalRewards = (cycle: number) => `
select
	(burn_block_height - 666050)/ 2100 as cycle,
	sum(reward_amount) as rewards
from
	burnchain_rewards br
where
	canonical
    and (burn_block_height - 666050)/ 2100 = '${cycle}'
group by
	1
order by
	1 desc`;

const fastPoolRewardsV1 = (cycle: number) => `
select
	(burn_block_height - 666050)/ 2100 as cycle,
	sum(reward_amount) as rewards
from
	burnchain_rewards br
where
	canonical
    and (burn_block_height - 666050)/ 2100 = '${cycle}'
    and reward_recipient = 'bc1qs0kkdpsrzh3ngqgth7mkavlwlzr7lms2zv3wxe'
group by
	1
order by
	1 desc`;

const fastPoolRewardsV2 = (cycle: number) => `
select
	(burn_block_height - 666050)/ 2100 as cycle,
	sum(reward_amount) as rewards
from
	burnchain_rewards br
where
	canonical
    and (burn_block_height - 666050)/ 2100 = '${cycle}'
    and reward_recipient = 'bc1q7w0jpwwjyq48qhyecnuwazfqv56880q67pmtfc'
group by
	1
order by
	1 desc`;

export const getRewards = async (cycle: number) => {
  // create pg client
  const client = await createPgClient();
  const rewardsTotal = await client.query(totalRewards(cycle));
  const rewardsFastPoolV1 = await client.query(fastPoolRewardsV1(cycle));
  const rewardsFastPoolV2 = await client.query(fastPoolRewardsV2(cycle));
  const fastPoolV1 = Number(rewardsFastPoolV1.rows[0]?.rewards || '0') / 1e8;
  const fastPoolV2 = Number(rewardsFastPoolV2.rows[0]?.rewards || '0') / 1e8;

  await client.end();
  return {
    total: Number(rewardsTotal.rows[0].rewards) / 1e8,
    fastPool: fastPoolV1 + fastPoolV2,
    fastPoolV1,
    fastPoolV2,
  };
};
