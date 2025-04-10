const os = require('os');
const { execSync } = require('child_process');
const { getInput, setFailed, setOutput } = require('@actions/core');
const fs = require('fs');
const { get } = require('https');
try {
    // install curl and ssh
    execSync('sudo apt-get update && sudo apt-get install -y curl ssh', { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`successfully installed curl and ssh`);

    // add incus repository
    const architecture = execSync('uname -m', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    const incus_version = getInput('incus_version');
    console.log(`incus_version=${incus_version}`);
    console.log(`architecture=${architecture}`);

    const releaseUrl =`https://github.com/lxc/incus/releases/download/${incus_version}/bin.linux.incus.${architecture}`;
    execSync(`sudo curl -Lo /usr/local/bin/incus ${releaseUrl}`, { encoding: 'utf-8', stdio: 'inherit' });
    execSync(`sudo chmod +x /usr/local/bin/incus`, { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`successfully installed incus executable`);
   
    // configure ssh for incus
    const ssh_key = getInput('ssh_key');
    const remote_host = getInput('remote_host');
    const incus_client_name = getInput('incus_client_name');
    console.log(`ssh_key=${ssh_key}`);

    // save SSH key to ~/.ssh using nodejs
    fs.mkdirSync(`${os.homedir()}/.ssh`, { recursive: true });
    fs.writeFileSync(`${os.homedir()}/.ssh/id_rsa`, ssh_key);
    // append new line to key file
    fs.appendFileSync(`${os.homedir()}/.ssh/id_rsa`, '\n');
    console.log(`successfully saved SSH key to ~/.ssh`);

    execSync(`chmod 600 ~/.ssh/id_rsa`, { encoding: 'utf-8', stdio: 'inherit' });
    execSync(`ssh-keyscan -H "${remote_host}" >> ~/.ssh/known_hosts`, { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`successfully configured ssh for incus`);

    // get incus token
    const ssh_user = getInput('ssh_user');
    const get_token = execSync(`ssh -i ~/.ssh/id_rsa ${ssh_user}@${remote_host} "incus config trust add ${incus_client_name}" | grep -v 'Client ${incus_client_name} certificate add token:'`, { encoding: 'utf-8', stdio: 'pipe' });

    let incus_token = get_token.trim();
    incus_token = incus_token.replace(/[\r\n]+/g, '');

    setOutput('incus_token', incus_token);

    // Create incus config directory
    const friendly_name = getInput('friendly_name');
    const user = execSync('whoami', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    execSync(`sudo mkdir -p /home/${user}/.config/incus`, { encoding: 'utf-8', stdio: 'inherit' });
    execSync(`sudo chown -R ${user}:${user} /home/${user}/.config/incus`, { encoding: 'utf-8', stdio: 'inherit' });
    execSync(`sudo chmod 700 /home/${user}/.config/incus`, { encoding: 'utf-8', stdio: 'inherit' });

    console.log(`successfully created /home/${user}/.config/incus`);

    // Add remote
    execSync(`incus remote add ${friendly_name} https://${remote_host}:8443 --accept-certificate --auth-type tls --token ${incus_token}`, { encoding: 'utf-8', stdio: 'inherit' });
} catch (error) {
    setFailed(error.message);
}
