import { web3 } from '@project-serum/anchor';

export const WRAPPED_SOL_MINT = new web3.PublicKey(
  'So11111111111111111111111111111111111111112',
);

export const TOKEN_PROGRAM_ID = new web3.PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);

export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new web3.PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);

export const BPF_UPGRADE_LOADER_ID = new web3.PublicKey(
  'BPFLoaderUpgradeab1e11111111111111111111111',
);

export const MEMO_ID = new web3.PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
);

export const METADATA_PROGRAM_ID = new web3.PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
);

export const VAULT_ID = new web3.PublicKey(
  'vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn'
);

export const AUCTION_ID =  new web3.PublicKey(
  'auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8'
);

export const METAPLEX_ID = new web3.PublicKey(
  'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98'
);

export const PACK_CREATE_ID = new web3.PublicKey(
  'packFeFNZzMfD9aVWL7QbGz1WcU7R9zpf6pvNsw2BLu',
);

export const ORACLE_ID = new web3.PublicKey(
  'rndshKFf48HhGaPbaCd3WQYtgCNKzRgVQ3U2we4Cvf9',
);

export const SYSTEM = new web3.PublicKey('11111111111111111111111111111111');

export const programIds = () => {
  return {
    token: TOKEN_PROGRAM_ID,
    associatedToken: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    bpf_upgrade_loader: BPF_UPGRADE_LOADER_ID,
    system: SYSTEM,
    metadata: METADATA_PROGRAM_ID,
    memo: MEMO_ID,
    vault: VAULT_ID,
    auction: AUCTION_ID,
    metaplex: METAPLEX_ID,
    pack_create: PACK_CREATE_ID,
    oracle: ORACLE_ID,
  };
};
const PubKeysInternedMap = new Map();

export const toPublicKey = (key) => {
  if (typeof key !== 'string') {
    return key;
  }

  let result = PubKeysInternedMap.get(key);
  if (!result) {
    result = new web3.PublicKey(key);
    PubKeysInternedMap.set(key, result);
  }

  return result;
};
