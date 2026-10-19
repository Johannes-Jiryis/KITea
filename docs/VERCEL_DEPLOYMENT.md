# Deploy KITea to Vercel

The repository includes `vercel.json` for a Git-based Vercel deployment using the existing Supabase database. This guide does not create a Vercel project or change the database automatically.

## 1. Prepare the database

Use Supabase's **Connect → Transaction pooler** URI for Vercel's `DATABASE_URL` (port 6543). Copy the actual hostname and username from the dashboard; do not infer them from the region or use the Supabase HTTPS API URL. Replace the password placeholder and URL-encode any special password characters. Require verified TLS using the provider's recommended connection options/certificate. Never disable certificate verification to make a connection pass.

In Supabase **Database → Settings → SSL Configuration**, download the server root CA certificate. Open the certificate as text and copy the entire PEM, including `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`, into Vercel's `DATABASE_CA_CERT` variable. Real newlines or literal `\n` separators are supported. This is a public CA certificate, not a private key. Shared pooler certificates may not chain to the system trust store; a local verification reproduced that certificate error without this CA. The app enforces verified TLS on Vercel and uses the configured CA. Conflicting URL SSL flags cannot turn verification off. Do not put a local `sslrootcert=C:\...` file path in Vercel's connection string.

The application uses Prisma's PostgreSQL driver adapter with unnamed statements, compatible with transaction pooling. Pool settings are driver options; Prisma engine URL parameters such as `connection_limit` do not control this pool. On Vercel, the app uses one connection per instance and releases idle connections after five seconds. No query pipelining or session-scoped advisory locks are used by application mutations. Existing transactions use row locks, which are held through commit.

Keep your local `.env.local` on the **Session pooler** URI (port 5432) for migrations. Back up the intended database, then run from the project folder:

```powershell
npm.cmd run db:deploy
```

This applies committed migrations to the configured database. Do not use `migrate dev`, `db push`, resets, seed scripts, or module cleanup scripts during deployment. If the database is already current, `db:deploy` reports no pending migrations. Existing imported modules stay in Supabase; they do not need importing again when the same database is used.

## 2. Import the GitHub repository

1. Sign in at [Vercel](https://vercel.com/new) using GitHub.
2. Import `Johannes-Jiryis/KITea`, granting repository access if requested.
3. Select an available project name and note its stable production domain, such as `your-project.vercel.app`.
4. Framework: **Next.js**. Root directory: the repository root (`./`). Node.js: **22.x**, matching `package.json`.
5. Keep automatic system environment variables enabled. Leave the Output Directory override disabled. `vercel.json` supplies `npm ci --include=dev` (the build needs Prisma/TypeScript) and `npm run prisma:generate && npm run build`; no Docker command or custom Start Command is required.

`vercel.json` selects **Dublin (`dub1`)**, matching the previously configured Supabase `eu-west-1` location. Confirm the actual database region in Supabase; if different, change `regions` to the nearest supported Vercel region before deploying. Static assets still use Vercel's CDN. Next.js standalone output remains enabled for Docker/local builds, and is omitted on Vercel.

## 3. Add production environment variables

Add the following in Vercel's environment settings **before deploying**. Enter values without surrounding quotation marks. Do not use the `NEXT_PUBLIC_` prefix for secrets.

| Variable               | Value                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Supabase transaction pooler URI, with password and verified TLS                       |
| `DATABASE_CA_CERT`     | Entire server root CA certificate PEM downloaded from Supabase                        |
| `NEXTAUTH_URL`         | Exact stable HTTPS origin, e.g. `https://your-project.vercel.app` (no trailing slash) |
| `NEXTAUTH_SECRET`      | A new random secret, at least 32 characters                                           |
| `GOOGLE_CLIENT_ID`     | Your Google OAuth web application's Client ID                                         |
| `GOOGLE_CLIENT_SECRET` | That application's Client secret                                                      |
| `TRUST_PROXY`          | `false`                                                                               |

Generate a deployment secret locally:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Save it directly in Vercel. Keep the same secret across deployments unless deliberately rotating sessions. Vercel supplies `NODE_ENV=production`; the application validates production configuration. Missing credentials, an HTTP canonical URL, or a development session secret can prevent startup. Never bypass validation.

Scope the real database URL and OAuth secrets to **Production**. Preview deployments need a separate test database, a stable test domain/URL, test secret, and matching Google client configuration. Do not copy production settings blindly into previews: real users could otherwise mutate the production database. If preview settings are absent, the app will fail configuration validation there; that is expected until configured.

## 4. Configure Google sign-in

In [Google Auth platform → Clients](https://console.cloud.google.com/auth/clients), edit the OAuth **Web application**:

- Authorized JavaScript origin: `https://your-project.vercel.app`
- Authorized redirect URI: `https://your-project.vercel.app/api/auth/callback/google`

Use the real production domain exactly. Keep the localhost entries if you still develop locally. This application uses Auth.js with Google directly; the callback is not Supabase's authentication callback.

If the Google app is in Testing mode, add permitted users under **Audience → Test users**. Configure/publish the appropriate Google audience separately when making sign-in available to more students. Preview URLs cannot use wildcard Google OAuth callbacks. A future custom domain requires updating both `NEXTAUTH_URL` and the Google authorized origins/redirects, then redeploying.

## 5. Deploy and verify

Click **Deploy**. Once Vercel assigns the production domain, confirm it matches `NEXTAUTH_URL` and Google's callback. If it differs, update both and redeploy. Changes to Vercel environment variables apply to new deployments.

Verify:

1. `/api/health/live` returns `{"status":"ok"}`.
2. `/api/health/ready` returns `{"status":"ready"}`. A 503 indicates a configuration or database problem; inspect Vercel runtime logs without posting credentials.
3. Search shows multiple matching choices where available and opens a module.
4. Google login and logout work on the final domain.
5. With a dedicated test account, create/edit/delete a review, check anonymous author display, and test helpful voting. Account deletion is permanent; test it only on the dedicated account.

Subsequent pushes to `main` trigger production deployments when the Vercel Git integration is enabled. Apply any future database migrations as a separate reviewed release step before the dependent app version receives traffic. An application rollback does not undo database changes.

## Troubleshooting

- **Prisma Client missing/stale:** restore the configured Build Command, then redeploy without the build cache.
- **Database timeouts:** confirm Transaction pooler port 6543, the exact copied hostname/username, password encoding, TLS, project availability, connection limits, and function/database region alignment.
- **Self-signed certificate / P1011:** set `DATABASE_CA_CERT` to the complete server root CA PEM downloaded from Supabase Database Settings, then redeploy. Do not disable verification. The certificate file's path on your PC is not its PEM content.
- **`redirect_uri_mismatch`:** the Google callback must exactly match the deployed origin plus `/api/auth/callback/google`.
- **Missing environment variables:** set them for Production before deploying, then redeploy. `.env.local` is intentionally not in Git.
- **Build succeeds but app fails:** check runtime logs and `/api/health/ready`. A successful build does not verify OAuth or connectivity in Vercel's environment.

Sources: [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build), [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [function regions](https://vercel.com/docs/functions/configuring-functions/region), [environment variables](https://vercel.com/docs/environment-variables), [Supabase connections and transaction-mode limitations](https://supabase.com/docs/guides/database/connecting-to-postgres), and [driver-specific prepared statement settings](https://supabase.com/docs/guides/troubleshooting/disabling-prepared-statements-qL8lEL).
