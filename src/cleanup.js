const { execSync } = require('child_process');
const { getInput, setFailed } = require('@actions/core');

try {
    // remove incus fingerprints
    const ssh_user = getInput('ssh_user');
    const remote_host = getInput('remote_host');
    const trust_fingerprints = execSync(`ssh -i ~/.ssh/id_rsa ${ssh_user}@${remote_host} "incus config trust list -f json"`, { encoding: 'utf-8', stdio: 'pipe' });
    const fingerprints = JSON.parse(trust_fingerprints).filter(t => t.name === 'gh-action').map(t => t.fingerprint);
    console.log(`fingerprints=${fingerprints}`);
    for (const fingerprint of fingerprints) {
        execSync(`ssh -i ~/.ssh/id_rsa ${ssh_user}@${remote_host} "incus config trust remove ${fingerprint}"`, { encoding: 'utf-8', stdio: 'inherit' });
    }

    // uninstall incus
    execSync('sudo apt-get remove --auto-remove -y incus-client', { encoding: 'utf-8', stdio: 'inherit' });

    // remove apt repository
    execSync('sudo rm -f /etc/apt/sources.list.d/zabbly-incus-stable.sources', { encoding: 'utf-8', stdio: 'inherit' });
    execSync('sudo rm -f /etc/apt/keyrings/zabbly.asc', { encoding: 'utf-8', stdio: 'inherit' });

} catch (error) {
    // log the error
    setFailed(error.message);
}
