# Email Setup: Resend + Zoho Forwarding

## 1. Resend Setup (sends notification emails)

1. Sign up at https://resend.com
2. Go to **Domains** > **Add Domain** > enter `endall.ai`
3. Resend will give you DNS records to add:
   - One **TXT** record for domain verification
   - One **TXT** record for SPF (`v=spf1 include:resend.dev ~all`)
   - Three **CNAME** records for DKIM
4. Add these records in your domain registrar's DNS panel
5. Wait for verification (usually 5-30 minutes)
6. Go to **API Keys** > **Create API Key**
7. Copy the key and add it to:
   - `.env.local` locally: `RESEND_API_KEY=re_your_key_here`
   - Vercel dashboard: Settings > Environment Variables > add `RESEND_API_KEY`

The notification emails are sent FROM `notifications@endall.ai` TO `jake@endall.ai`.

## 2. Zoho Mail Forwarding (jake@endall.ai > levison1995@gmail.com)

Jake's business email is on Zoho Mail (endall.ai domain).

### Steps:
1. Log in to Zoho Mail at https://mail.zoho.com with jake@endall.ai
2. Click the **gear icon** (Settings) in the top right
3. Go to **Mail** > **Email forwarding**
4. Click **Add email address**
5. Enter: `levison1995@gmail.com`
6. Zoho will send a verification email to levison1995@gmail.com
7. Click the verification link in that email
8. Once verified, choose:
   - **Forward a copy** (recommended) - keeps the email in Zoho AND sends to Gmail
   - OR **Forward and delete** - only in Gmail
9. Save

### Alternative: Gmail "Check mail from other accounts"
If you'd rather pull Zoho into Gmail instead of pushing:
1. In Gmail: Settings > Accounts > Check mail from other accounts > Add
2. Enter jake@endall.ai
3. Use Zoho IMAP: `imappro.zoho.com`, port 993, SSL
4. Enter Zoho credentials or app-specific password

## 3. Vercel Environment Variable

Make sure `RESEND_API_KEY` is set in Vercel for the production deployment:
```
vercel env add RESEND_API_KEY production
```
Or add it via the Vercel dashboard: Project Settings > Environment Variables.
