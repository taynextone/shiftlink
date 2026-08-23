# HTTPS / Domain Setup für Shiftlink (Stufe 2.3)

Der Stack ist für HTTPS vorbereitet: Port 443 ist gemappt, nginx hat ein
SSL-Verzeichnis, und die Security-Header aktivieren sich automatisch, sobald
`APP_ORIGIN` auf `https://` zeigt (CSP-Upgrade, COEP/COOP, HSTS).

## Voraussetzungen

1. Eine öffentliche Domain (z. B. `shiftlink.deinedomain.de`)
2. DNS-A-Record zeigt auf die öffentliche IP dieses Servers
3. Router: Port-Forwarding 80 + 443 → 192.168.0.42

## Let's Encrypt Zertifikat holen (einmalig)

```bash
# 1. Certbot-Werkzeug (auf dem Host)
sudo apt install certbot

# 2. Zertifikat über den laufenden nginx holen (webroot-Modus,
#    /.well-known/acme-challenge/ ist bereits in der nginx-Config geroutet)
sudo certbot certonly --webroot -w /home/jurica/.openclaw/workspace/projects/shiftlink/certbot-www \
  -d shiftlink.deinedomain.de

# 3. Zertifikate für nginx verfügbar machen
sudo cp /etc/letsencrypt/live/shiftlink.deinedomain.de/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/shiftlink.deinedomain.de/privkey.pem  nginx/ssl/
```

## nginx SSL-Server-Block aktivieren

In `nginx/nginx.conf` den auskommentierten 443-Server-Block (unten in der
Datei) ent-kommentieren, Servernamen eintragen, dann:

```bash
docker compose restart nginx
```

## APP_ORIGIN umstellen (aktiviert die HTTPS-Security-Header)

In `.env`:
```
APP_ORIGIN=https://shiftlink.deinedomain.de
```
Dann `docker compose up -d app` — CSP `upgrade-insecure-requests`, COEP/COOP
und HSTS schalten sich damit automatisch scharf (Code-seitig an
`APP_ORIGIN.startsWith('https')` gekoppelt).

## Zertifikats-Erneuerung

Certbot-Timer läuft auf dem Host (`systemctl list-timers | grep certbot`).
Für die nginx-Kopie monatlich erneuern:
```cron
0 5 1 * * cp /etc/letsencrypt/live/shiftlink.deinedomain.de/*.pem /home/jurica/.openclaw/workspace/projects/shiftlink/nginx/ssl/ && docker exec shiftlink-nginx nginx -s reload
```
