const { execSync } = require('child_process');
const { getInput, setFailed } = require('@actions/core');

try {
    // remove incus fingerprints
    const ssh_user = getInput('ssh_user');
    const remote_host = getInput('remote_host');
    const incus_client_name = getInput('incus_client_name');
    const trust_fingerprints = execSync(`ssh -i ~/.ssh/id_rsa ${ssh_user}@${remote_host} "incus config trust list -f json"`, { encoding: 'utf-8', stdio: 'pipe' });
    const fingerprints = JSON.parse(trust_fingerprints).filter(t => t.name === incus_client_name).map(t => t.fingerprint);
    console.log(`fingerprints=${fingerprints}`);
    for (const fingerprint of fingerprints) {
        execSync(`ssh -i ~/.ssh/id_rsa ${ssh_user}@${remote_host} "incus config trust remove ${fingerprint}"`, { encoding: 'utf-8', stdio: 'inherit' });
    }

    const cleanup = getInput('cleanup');
    if (cleanup === 'true') {
        // uninstall incus
        execSync('sudo rm -f /usr/local/bin/incus', { encoding: 'utf-8', stdio: 'inherit' });
    }

} catch (error) {
    // log the error
    setFailed(error.message);
}
