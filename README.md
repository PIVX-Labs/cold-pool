# cold-pool
A small RPC-based PIVX side daemon which automatically whitelists cold delegations.

## Usage:
Note: it is **required** you have a fulled synchronised PIVX Core, with RPC server enabled, for the Cold Pool daemon to do it's job.

- `git clone https://github.com/PIVX-Labs/cold-pool.git`
- `cd cold-pool && npm i`
- `node main <host> <port> <user> <pass>`

Example: `node main localhost 51473 user pass`

PIVX Core (`pivx.conf`) example configuration:
```
server=1
rpcuser=user
rpcpassword=pass
```

There are no formal commandline options (`-` or `--`), just simple stdin input to collect RPC information and immediately start running.

To keep it running for eternity, use a unix application like `screen`, or `pm2` designed for Node processes.
