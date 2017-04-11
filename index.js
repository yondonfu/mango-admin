import { default as MangoAdminLib } from './lib/mango-admin-lib';
import Web3 from 'web3';
import contract from 'truffle-contract';

import MangoRepoArtifact from './build/contracts/MangoRepo.json';

export default function(host, port, repoAddress, fromAddress) {
  const provider = new Web3.providers.HttpProvider(`http:\/\/${host}:${port}`);
  const MangoRepo = contract(MangoRepoArtifact);

  return new MangoAdminLib(
    MangoRepo,
    repoAddress,
    provider,
    fromAddress
  );
}
