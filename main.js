'use strict';

// Native Modules
const path = require('path');

// NPM Modules
const bitcoinRPC = require('@jskitty/bitcoin-rpc');

// Local Modules
const colour = require('./colours');

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

// Start our eternal delegation scanning
async function checkAndWhitelistDelegations() {
    // Fetch any non-whitelisted delegations
    const arrDelegations = await RPC.call("listcoldutxos", true);

    // Loop and whitelist them
    for (const cDelegation of arrDelegations) {
        if (await RPC.call("delegatoradd", cDelegation["coin-owner"])) {
            console.log("New Delegation: " + colour.green("address '" + cDelegation["coin-owner"] + "' with '" + cDelegation.amount + "' initial PIV whitelisted!"));
        }
    }
}

checkAndWhitelistDelegations();
setInterval(checkAndWhitelistDelegations, 10000);