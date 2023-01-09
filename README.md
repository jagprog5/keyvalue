# Key Value Server

The server is self hosted and should be live at [keyvalue.duckdns.org](https://keyvalue.duckdns.org).

## Back End

The back end server is written in rust and interfaces with a sqlite database. It exposes four http endpoints:

- `/login` and `/create-account`  
  POST json: `{ "username": "...", "password", "..." }`  
  Yields a session token in the form of a uuid, which is used when setting and getting values.
- `/set-value`  
  POST json:  
  `{ "username": "...", "session_token": "79997094-a636-4220-87ae-7d42c1412ae7", "key": "...", "value": "value" }`
- `/get-value`  
  POST json:  
  `{ "username": "...", "session_token": "79997094-a636-4220-87ae-7d42c1412ae7", "key": "..." }`  
  Yields the plaintext value.

The database stores the salted password hashes and sessions associated with each user. Since this is a code demo, entries that have been inactive for an hour get purposefully dropped.

## Front End

The front end is JS, CSS, and HTML, statically served by nginx. It has three pages

- login page
- create account page
- set get page

nginx also provides a TLS terminating ingress using an tls certificate verified via [let's encrypt](https://letsencrypt.org/).

## Initialization Steps

inspired from [here](https://github.com/wmnnd/nginx-certbot/blob/master/init-letsencrypt.sh).

```bash
# get recommended TLS parameters. used in nginx config
curl https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > certbot/conf/options-ssl-nginx.conf
curl https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > certbot/conf/ssl-dhparams.pem

# creating temporary self signed certificate
# or else nginx 443 server will fail to launch from files not found
mkdir certbot/conf/live/keyvalue.duckdns.org/
docker compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:4096 -days 1\
    -keyout '/etc/letsencrypt/live/keyvalue.duckdns.org/privkey.pem' \
    -out '/etc/letsencrypt/live/keyvalue.duckdns.org/fullchain.pem' \
    -subj '/CN=localhost'" certbot

# see if you can access the site, and are redirected from http to https
docker compose up

# leave compose running!
# delete the self signed certificate (or else cert bot will complain that the folder already exists)
rm -rf certbot/conf/live/keyvalue.duckdns.org/

# generate the correct certificates from the CA
docker compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot/ --dry-run -d keyvalue.duckdns.org
# if it is successful, then remove --dry-run and do it again

# now restart docker compose and the certificate will be used!

# also, remember to get cron to run the duckdns script:
*/20 * * * * /path/to/duck.sh >/dev/null 2>&1 # script handles writing logs
# renewing the certificate is already done in the certbot container entrypoint

```
