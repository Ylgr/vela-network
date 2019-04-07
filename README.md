# vela-network

A system blockchain working for marketing

How to using this?
Prepare:
Install Composer development tools
https://hyperledger.github.io/composer/latest/installing/development-tools.html

Start project:
Fist create blockchain servers:

```
cd ~/fabric-dev-servers
export FABRIC_VERSION=hlfv12
./startFabric.sh
./createPeerAdminCard.sh
```

Make command path to this clone project: 
```
composer network install --card PeerAdmin@hlfv1 --archiveFile vela-network@0.0.7-fix.bna

composer network start --networkName vela-network --networkVersion 0.0.7-fix --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file networkadmin.card
```

If card cannot use, create a new card:
```
composer archive create -t dir -n .
```

Then start REST API server:
```
composer-rest-server
```
