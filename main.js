'use strict';

// Native Modules
const path = require('path');
const http = require('http');

// NPM Modules
const bitcoinRPC = require('@jskitty/bitcoin-rpc');

// Local Modules
const colour = require('./colours');

// Constants
/** The refresh rate of Cold Pool updates (too low will overload the RPC!) */
const REFRESH_TIME = 10000;
/** The public-facing API port for generic stats */
const API_PORT = 5000;
/** The host interface to open the API on */
const HOSTNAME = '127.0.0.1';

// Initialize market
const args = process.argv.slice(2);
if (args.length !== 4) {
    const exec_name = process.argv[0].split(path.sep).pop();
    const app_name = process.argv[1].split(path.sep).pop();

    return console.log('%s (Bad Arguments)\nInstead try:\n- %s',
                        colour.red('Invalid Usage'),
                        colour.yellow(exec_name + ' ' + app_name + ' localhost 51473 user pass')
    );
}

// Pretty-fy our params
const host = args[0];
const port = args[1];
const user = args[2];
const pass = args[3];

// Setup RPC daemon
const RPC = new bitcoinRPC(user, pass, host, port);

// Keep track of some numbers, like total Cold Staking, total Delegations, etc
const stats = {
    totalPool: 0,
    totalDelegations: 0
};

// Boot up the API
const server = http.createServer((req, res) => {
    // Serve public stats
    if (req.method === 'GET' && req.url === '/api/v1/stats') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(stats));
    } else {
        res.statusCode = 404;
        res.end('Not Found');
    }
});
server.listen(API_PORT, HOSTNAME, () => {
    console.log(`${colour.yellow('Server')}: stats hosted at ${colour.green(`http://${HOSTNAME}:${API_PORT}/api/v1/stats`)}`);
});

// Start our eternal delegation scanning
async function checkAndWhitelistDelegations() {
    try {
        // Fetch any non-whitelisted delegations
        const arrDelegations = await RPC.call("listcoldutxos", true);

        // Whitelist and compute stats
        let nTempPool = 0;
        for (const cDelegation of arrDelegations) {
            // Add new delegators to the whitelist
            if (cDelegation.whitelisted === "false" && await RPC.call("delegatoradd", cDelegation["coin-owner"])) {
                console.log("New Delegation: " + colour.green("address '" + cDelegation["coin-owner"] + "' with '" + cDelegation.amount + "' initial PIV whitelisted!"));
            }
            // Aggregate pool amount
            nTempPool += cDelegation.amount;
        }

        // Update total pool size
        stats.totalPool = nTempPool;

        // Update total delegations
        stats.totalDelegations = arrDelegations.length;
    } catch (e) {
        console.log('%s - Retrying in %s...',
                    colour.red('RPC Failure'),
                    colour.yellow((REFRESH_TIME / 1000) + 's')
        );
    }
}

checkAndWhitelistDelegations();
setInterval(checkAndWhitelistDelegations, REFRESH_TIME);