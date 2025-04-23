import { createClient } from '@stacks/blockchain-api-client';
import {
  cvToString,
  hexToCV,
  ResponseOkCV,
  serializeCV,
  TupleCV,
  UIntCV,
  uintCV,
} from '@stacks/transactions';

const baseUrl = 'http://192.168.129.114:3999';
const client = createClient({ baseUrl });

const getBlockByBurnBlockHeight = async (bitcoinBlockHeight: number) => {
  return await client.GET('/extended/v1/block/by_burn_block_height/{burn_block_height}', {
    params: { path: { burn_block_height: bitcoinBlockHeight } },
  });
};
export const getStacksBlockHeight = async (
  bitcoinBlockHeight: number,
  adapt: (h: number) => number
): Promise<Awaited<ReturnType<typeof getBlockByBurnBlockHeight>>['data']> => {
  const response = await getBlockByBurnBlockHeight(bitcoinBlockHeight);
  const data = response.data;
  if (!data) {
    return await getStacksBlockHeight(adapt(bitcoinBlockHeight), adapt);
  }
  return data;
};

export const getPoxInfo = async (cycle: number) => {
  const response = await client.GET('/extended/v2/pox/cycles/{cycle_number}', {
    params: { path: { cycle_number: cycle } },
  });

  const data = response.data;
  if (!data) {
    throw new Error('No data');
  }
  return data;
};

export const getThresholdFromParticipation = async (
  totalUstxStacked: number,
  stacksBlock: number
) => {
  const response = await client.GET('/extended/v2/blocks/{height_or_hash}', {
    params: { path: { height_or_hash: stacksBlock } },
  });
  const tip = response.data?.index_block_hash;
  const poxResponse = await fetch(
    `${baseUrl}/v2/contracts/call-read/SP000000000000000000002Q6VF78/pox-4/get-pox-info?tip=${tip?.substring(2)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: 'SP000000000000000000002Q6VF78',
        arguments: [],
      }),
    }
  ).then(r => r.json());
  const poxInfo = hexToCV(poxResponse.result) as ResponseOkCV<
    TupleCV<{ 'total-liquid-supply-ustx': UIntCV }>
  >;
  console.log(cvToString(poxInfo));
  const liquidUstx = Number(poxInfo.value.value['total-liquid-supply-ustx'].value);
  const thresholdResponse = await fetch(
    `${baseUrl}/v2/contracts/call-read/SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9/pox3-info-helper-v2/get-threshold-from-participation`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
        arguments: [
          serializeCV(uintCV(liquidUstx)),
          serializeCV(uintCV(totalUstxStacked)),
          serializeCV(uintCV(4200)),
        ],
      }),
    }
  ).then(r => r.json());
  if (thresholdResponse.result) {
    const threshold = hexToCV(thresholdResponse.result) as UIntCV;
    return Number(threshold.value);
  } else {
    return 0;
  }
};
