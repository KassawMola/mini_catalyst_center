# Linux Server Installation Guide

This guide explains how to install `mini_catalyst_center` on a Linux server and start with a clean working demo.

The GitHub Pages version is a static browser demo. The Linux server version serves the same UI locally and prepares a place for persistent inventory data.

## What You Need

- Ubuntu Server 22.04 or newer.
- A user with `sudo` access.
- Internet access for package installation.
- Optional: network access from the server to your switches.

## 1. Install Packages

```bash
sudo apt update
sudo apt install -y git python3 python3-venv python3-pip nginx
```

## 2. Download The Project

```bash
cd /opt
sudo git clone https://github.com/KassawMola/mini_catalyst_center.git
sudo chown -R $USER:$USER /opt/mini_catalyst_center
cd /opt/mini_catalyst_center
```

## 3. Create Python Environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r server/requirements.txt
```

## 4. Start The Web Server

```bash
python server/app.py
```

Open:

```text
http://SERVER_IP:8080
```

Replace `SERVER_IP` with your Linux server address.

## 5. Create Your First User

1. Open the website.
2. Click `Create`.
3. Choose your own username and password.
4. Sign in.

The browser demo stores the first account in browser localStorage. Do not publish fixed passwords in repository files.

## 6. Start Clean

Inside the site:

1. Go to `Inventory`.
2. Click the reset button if you want to restore DEMO data.
3. Delete demo devices one by one if you want an empty workspace.
4. Add your own Sites from the `Sites` page.
5. Add your own switches from the `Inventory` page.

Recommended naming:

```text
SITE01
SITE02
SW-SITE01-CORE
SW-SITE01-ACCESS01
```

## 7. Add Your Real Equipment

Use private management IP addresses reachable from the Linux server.

Example:

```text
Hostname: SW-SITE01-CORE
IP Address: 192.168.1.1
Site: SITE01
Role: Core
```

Do not commit real passwords. For real command execution, store credentials as Linux environment variables or in a secure vault.

## 8. Enable Real Command Execution

By default, command execution is simulated so the site works immediately after installation.

To allow real SSH commands through Netmiko:

```bash
export MCC_REAL_COMMANDS=1
export MCC_DEVICE_USERNAME="your_device_username"
export MCC_DEVICE_SECRET="your_device_secret"
export MCC_DEVICE_TYPE="cisco_ios"
python server/app.py
```

Start with one test switch only:

```text
Target: 192.168.1.1
Command: show version
```

Only enable real command execution on a trusted internal server.

## 9. Run As A System Service

Create a systemd service:

```bash
sudo cp server/systemd/mini-catalyst-center.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mini-catalyst-center
sudo systemctl start mini-catalyst-center
sudo systemctl status mini-catalyst-center
```

For real command execution in systemd, add these lines under `[Service]`:

```ini
Environment=MCC_REAL_COMMANDS=1
Environment=MCC_DEVICE_USERNAME=your_device_username
Environment=MCC_DEVICE_SECRET=your_device_secret
Environment=MCC_DEVICE_TYPE=cisco_ios
```

## 10. Optional Nginx Reverse Proxy

Create:

```bash
sudo nano /etc/nginx/sites-available/mini-catalyst-center
```

Paste:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/mini-catalyst-center /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Open:

```text
http://SERVER_IP
```

## 11. Production Notes

- Use HTTPS before exposing the service outside a lab.
- Use named accounts for real operations.
- Keep real credentials outside Git.
- Back up inventory data.
- Test commands on one device before sending to many devices.
- Use maintenance windows for upgrade workflows.
- Treat image upgrades as a controlled production workflow. The included upgrade endpoint is a safe queue/demo placeholder until you add your approved image-copy and reload process.
