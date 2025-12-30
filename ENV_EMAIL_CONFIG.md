# Email Configuration for .env File

Add the following SMTP configuration to your `.env` file:

```env
# Email/SMTP Configuration
ADMIN_EMAIL=boraborsaifuddinvaiya@gmail.com
SMTP_USER=boraborsaifuddinvaiya@gmail.com
SMTP_PASS=klkv iptl bvzn vtvc
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
ADMIN_PANEL_URL=http://localhost:8080/admin
```

## Alternative Variable Names (Also Supported)

The email service also supports `MAIL_*` variable names:

```env
# Alternative format (also works)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=boraborsaifuddinvaiya@gmail.com
MAIL_PASS=klkv iptl bvzn vtvc
ADMIN_EMAIL=boraborsaifuddinvaiya@gmail.com
ADMIN_PANEL_URL=http://localhost:8080/admin
```

## Important Notes

1. **Gmail App Password**: The `SMTP_PASS` value `klkv iptl bvzn vtvc` should be entered **without spaces** in the .env file:
   ```
   SMTP_PASS=klkviptlbvznvtvc
   ```

2. **Port 465**: Since you're using port 465, the connection will use SSL/TLS automatically.

3. **Admin Email**: Set `ADMIN_EMAIL` to the email address where you want to receive notifications.

4. **Admin Panel URL**: Update `ADMIN_PANEL_URL` to your production domain when deploying.

## Quick Setup

1. Open your `.env` file
2. Add the configuration above
3. Remove spaces from the App Password (if any)
4. Restart your server

The email service will automatically detect and use these variables.
