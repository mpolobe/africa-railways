# 🆘 Sentinel Troubleshooting Guide

## 1. Login Failures (zkLogin)
**Symptom:** Worker clicks "LOGIN" but nothing happens or "OAuth Error" appears.
- **Check:** Ensure the `CLIENT_ID` in `APP_CONFIG.json` matches your Google Cloud Console credentials.
- **Action:** Verify the redirect URI in Sui is set to `https://africa-railways.vercel.app/api/auth/callback`.

## 2. Report Sync Issues (Mobile to Go)
**Symptom:** Worker submits a report, but it doesn't appear in the Daily Manifest.
- **Check:** Tail the logs on the Go server: `journalctl -u sentinel-backend -f`.
- **Action:** Ensure the `/api/report` endpoint is returning a `200 OK`. If it returns `403`, the Digits AI production keys have expired.

## 3. Financial Discrepancies (Digits AI)
**Symptom:** Safety bonuses are not reflecting in the worker's ledger.
- **Check:** Verify the payload in `server/report_handler.go`.
- **Action:** Log into the [Digits Dashboard](https://digits.ai) and check the "Transaction Pipeline" for any "Pending Approval" flags.
