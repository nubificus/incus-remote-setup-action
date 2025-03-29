const os = require('os');
const { execSync } = require('child_process');
const { getInput, setFailed, setOutput } = require('@actions/core');
const fs = require('fs');
try {
    // install curl and ssh
    execSync('sudo apt-get update && sudo apt-get install -y curl ssh', { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`successfully installed curl and ssh`);

    // add incus repository
    execSync(`sudo mkdir -p /etc/apt/keyrings/`, { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`successfully created /etc/apt/keyrings/`);
    execSync(`sudo curl -fsSL https://pkgs.zabbly.com/key.asc -o /etc/apt/keyrings/zabbly.asc`, { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`successfully added zabbly key`);

    // add incus repository using nodejs

    const VERSION_CODENAME = execSync('lsb_release -cs', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    console.log(`VERSION_CODENAME=${VERSION_CODENAME}`);
    const Architectures = execSync('dpkg --print-architecture', { encoding: 'utf-8', stdio: 'pipe' }).trim();
    console.log(`Architectures=${Architectures}`);


    const sourcesContent = `Enabled: yes
Types: deb
URIs: https://pkgs.zabbly.com/incus/stable
Suites: $(. /etc/os-release && echo ${VERSION_CODENAME})
Components: main
Architectures: ${Architectures}
Signed-By: /etc/apt/keyrings/zabbly.asc`;
    execSync(`echo "${sourcesContent}" | sudo tee /etc/apt/sources.list.d/zabbly-incus-stable.sources`, { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`sourcesContent=${sourcesContent}`);
    console.log(`successfully added zabbly repository`);
    // install incus
    execSync('sudo apt-get update && sudo apt-get install -y incus-client', { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`successfully installed incus`);

    // configure ssh for incus
    const ssh_key = getInput('ssh_key');
    const remote_host = getInput('remote_host');
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
    const get_token = execSync(`ssh -i ~/.ssh/id_rsa ${ssh_user}@${remote_host} "incus config trust add gh-action" | grep -v 'Client gh-action certificate add token:'`, { encoding: 'utf-8', stdio: 'pipe' });

    let incus_token = get_token.trim();
    incus_token = incus_token.replace(/[\r\n]+/g, '');
    console.log(`incus_token=${incus_token}`);

    setOutput('incus_token', incus_token);

    // add remote
    const friendly_name = getInput('friendly_name');
    execSync(`sudo incus remote add ${friendly_name} https://${remote_host}:8443 --accept-certificate --auth-type tls --token ${incus_token}`, { encoding: 'utf-8', stdio: 'inherit' });
} catch (error) {
    setFailed(error.message);
}
