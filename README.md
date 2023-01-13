# Key Value Server

The server is self hosted and should be live at [keyvalue.ca](http://www.keyvalue.ca).

# Back End

The back end server is written in rust and interfaces with an sqlite database. It exposes four http endpoints:

- `/login` and `/create-account`  
  POST json:
  ```json
  {
    "username": "...",
    "password": "..."
  }
  ```
  Yields a session token in the form of a uuid, which is used when setting and getting values.
- `/set-value`  
  POST json:  
  ```json
  {
    "username": "...",
    "session_token": "79997094-a636-4220-87ae-7d42c1412ae7",
    "key": "...",
    "value": "value"
  }
  ```
- `/get-value`  
  POST json:  
  ```json  
  {
    "username": "...",
    "session_token": "79997094-a636-4220-87ae-7d42c1412ae7",
    "key": "...",
  }
  ```
  Yields the plaintext value.

The database stores the salted password hashes and sessions associated with each user. Since this is a demo, entries that have been inactive for an hour get purposefully dropped.

# Front End

The front end is JS, CSS, and HTML, statically served by nginx. It has three pages

- login page
- create account page
- set get page

nginx also provides a TLS terminating ingress using a tls certificate verified via [let's encrypt](https://letsencrypt.org/).

# Initialization Steps

## duckdns

I used [duckdns](https://www.duckdns.org/) as a dynamic dns service, to associate the ip of my server with the correct domain name. Even if the server moves location, then it will automatically update.

This update is run by a cron script, and follows the instructions provided by them:
```
*/20 * * * * /path/to/duck.sh >/dev/null 2>&1
```

## whc

I bought a domain via [web hosting canada](https://whc.ca/en) and used the following configs:

Domain forwarding: https://www.keyvalue.ca

This effectively redirects keyvalue.ca -> www.keyvalue.ca

Under Advanced DNS Manager, I have:

| NAME | TTL   | TYPE  | VALUE                |
|------|-------|-------|----------------------|
| @    | 14440 | A     | 149.56.225.6         |
| www  | 14440 | CNAME | keyvalue.duckdns.org |

the cname record creates an alias of www.keyvalue.ca -> keyvalue.duckdns.org  
the A record points to the whc parking area (since they are not hosting the domain for me)

### tls limitation

Due to the fact that I don't want to upgrade to whc's [hosted](https://whc.ca/canadian-web-hosting) plan, there is a tls error under some very specific circumstances, only when typing the url with https and without www, and only noticable when using curl, or a browser on an iPhone, specifically.  
e.g. `curl -vvv https://keyvalue.ca` will use whc's ssl certificate, which doesn't match keyvalue's name.  
It's not worth it for me to pay for this functionality.

## compose

There is a bit more of a complex startup process due to a circular dependency. The nginx configuration can't be used until the tls certificates are available. Yet the certs can't be issued by the cert authority if the server is not running. process inspired from [here](https://github.com/wmnnd/nginx-certbot/blob/master/init-letsencrypt.sh).

```bash
# get recommended TLS parameters. used in nginx config
curl https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > certbot/conf/options-ssl-nginx.conf
curl https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > certbot/conf/ssl-dhparams.pem

# creating temporary self signed certificate
# or else nginx 443 server will fail to launch from files not found
mkdir certbot/conf/live/www.keyvalue.ca/
docker compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:4096 -days 1\
    -keyout '/etc/letsencrypt/live/www.keyvalue.ca/privkey.pem' \
    -out '/etc/letsencrypt/live/www.keyvalue.ca/fullchain.pem' \
    -subj '/CN=localhost'" certbot

# --> comment out the certbot entrypoint of the compose file before running
# see if you can access the site via local ip
docker compose up

# leave compose running!
# delete the self signed certificate (or else cert bot will complain that the folder already exists)
rm -rf certbot/conf/live/www.keyvalue.ca/

# generate the correct certificates from the CA
docker compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot/ --dry-run -d www.keyvalue.ca
# if it is successful, then remove --dry-run and do it again

# now restart docker compose (and uncomment the certbot entrypoint) and the certificate will be used and renewed automatically
```

# systemd

compose is wrapped as a systemd service

```
# /etc/systemd/system/keyvalue-app.service

[Unit]
Description=keyvalue web app
PartOf=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=true
WorkingDirectory=/home/john/key_value
ExecStart=/snap/bin/docker compose up -d --remove-orphans
ExecStop=/snap/bin/docker compose down

[Install]
WantedBy=multi-user.target

```

```bash
systemctl enable keyvalue-app.service
systemctl start keyvalue-app.service
```
