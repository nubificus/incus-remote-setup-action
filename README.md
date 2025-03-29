# incus-remote-setup-action

A simple Github Action to install Incus client and setup a remote server

## Usage

To use the Action, include it in your workflow file:

```yaml
jobs:
  setup_incus:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Incus and Connect to Remote Server
        uses: nubificus/incus-remote-setup-action@v1
        with:
          ssh_user: 'your-incus-server-username'
          ssh_key: ${{ secrets.INCUS_SSH_KEY }}
          remote_host: 'your-incus-server-ip-or-hostname'
          friendly_name: 'my-incus-server'
```
