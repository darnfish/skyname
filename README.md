# Skyname
Register and own your own free, unique usernames for Bluesky

## Why?
Skyname is a username registrar for Bluesky.

Bluesky uses domains as usernames. Since I own the domain darn.fish, I can set it as my username on Bluesky, hence why I am @darn.fish.

DNS, specifically a TXT record, is used for verifying domain ownership. Skyname hijacks this process and lets users verify a subdomain on a set of domain names owned by whoever runs a Skyname instance.

The official Skyname instance is located at [skyna.me](https://skyna.me). You can find domains such as bsky.cool and bsky.lgbt among others. Anyone can sign up and claim their own <username>.bsky.cool username for free and forever.

If you'd like to add your own domain for anyone to use, email [domains@skyna.me](mailto:domains@skyna.me) to start the process. Alternatively, and more preferrably, you can host your own instances and email [instances@skyna.me](mailto:instances@skyna.me) to be added to a list coming in the not so distant future.

## Setup
Clone down the repo and install dependencies:
```
git clone git@github.com:darnfish/skyname.git
cd skyname
yarn
```

You will need to populate `SKYNAME_CONFIG` with a Base64 encoded JSON object to supply your owned domains and DNS providers. Here is a sample:
```json
{
    "domains": {
        "example.com": {
            "provider": "my-provider",
            "zoneId": "<cf_zone_id>",
            "disallowedSubdomains": [
                "skyname"
            ]
        }
    },
    "providers": {
        "my-provider": {
            "service": "cloudflare",
            "token": "<cf_token>",
            "attestation": {
                "verified": true
            }
        }
    }
}
```

Once you have this file, save it to `config.json` and run the following command to copy the encoded Base64 string to clipboard so you can set as your `SKYNAME_CONFIG` environment variable:
```
cat config.json | base64 | pbcopy -
```

You will also need to set `POSTGRES_URL` to a PostgreSQL database. The database must have read write permissions and a table called `registrations` which can be created using the following SQL query:
```sql
CREATE TABLE "public"."registrations" (
    "id" varchar NOT NULL,
    "created_at" text NOT NULL DEFAULT now(),
    "invalidated_at" text,
    "actor" varchar NOT NULL,
    "subdomain" varchar NOT NULL,
    "domain" varchar NOT NULL,
    "previous_username" varchar NOT NULL,
    "record_id" varchar NOT NULL,
    "server" varchar NOT NULL DEFAULT 'bsky.social'::character varying,
    PRIMARY KEY ("id")
);
```

You can optionally set a `TG_CHAT_ID` and `TG_BOT_TOKEN` which will log events out to a Telegram chat.

### Development
To run the server locally, make sure you have added the above environment variables to `.env.local` in the repository root. Then you can run the following:
```
yarn dev
```

## License
MIT
