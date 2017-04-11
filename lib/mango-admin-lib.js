const Web3 = require('web3');

export default class {
  constructor(MangoRepo, repoAddress, provider, fromAddress) {
    this.provider = provider;
    this.web3 = new Web3(this.provider);
    this.fromAddress = fromAddress;

    MangoRepo.setProvider(this.provider);

    this.mangoRepoArtifact = MangoRepo;

    if (repoAddress) {
      this.mangoRepo = this.mangoRepoArtifact.at(repoAddress);
    }
  }

  create() {
    return this.mangoRepoArtifact.new({from: this.fromAddress, gas: 10000000}).then(instance => {
      this.mangoRepo = instance;
      return this.mangoRepo.address;
    }, err => err);
  }

  refNames() {
    return this.mangoRepo.refCount().then(count => {
      let names = [...Array(count.toNumber()).keys()].map(i => {
        return this.mangoRepo.refName(i);
      });

      return Promise.all(names);
    });
  }

  refs() {
    this.refNames().then(names => {
      let refs = names.map(name => {
        return this.mangoRepo.ref(name);
      });

      return Promise.all(refs).then(refs => {
        return names.map((name, i) => {
          return {
            name,
            ref: refs[i]
          };
        });
      });
    });
  }

  snapshots() {
    return this.mangoRepo.snapshotCount().then(count => {
      let snapshots = [...Array(count.toNumber()).keys()].map(i => {
        return this.mangoRepo.getSnapshot(i);
      });

      return Promise.all(snapshots);
    });
  }
}
