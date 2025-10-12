# Email Verification Setup Guide

## Gmail Configuration

To enable email verification, you need to set up Gmail with an App Password:

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Factor Authentication if not already enabled

### Step 2: Generate App Password

1. In Google Account Security settings
2. Go to "App passwords"
3. Select "Mail" as the app
4. Generate a new app password
5. Copy the 16-character password

### Step 3: Update Environment Variables

Update your `.env` file with:

```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
```

### Step 4: Alternative Email Services

If you prefer other email services, update the transporter configuration in `index.js`:

#### For Outlook/Hotmail:

```javascript
const transporter = nodemailer.createTransporter({
  service: "hotmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

#### For Custom SMTP:

```javascript
const transporter = nodemailer.createTransporter({
  host: "smtp.your-provider.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

## Testing

After setup, test the email verification by:

1. Creating a new account
2. Check if verification email is received
3. Use the 6-digit code to verify

## Troubleshooting

- **"Invalid login"**: Check if 2FA is enabled and app password is correct
- **"Connection timeout"**: Check firewall/network settings
- **"Email not received"**: Check spam folder, verify email address
