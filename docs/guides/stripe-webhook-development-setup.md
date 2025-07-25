# Stripe Webhook Development Setup Guide (2025)

This guide covers setting up Stripe webhooks for **local development** using the Stripe CLI. For production setup, see the [Production Webhook Setup Guide](./stripe-webhook-production-setup.md).

## Why Use Stripe CLI for Development

Stripe webhooks require publicly accessible HTTPS endpoints. Since `localhost` URLs aren't accessible from Stripe's servers, the Stripe CLI creates a secure tunnel to forward webhook events to your local development environment.

**Key Benefits:**
- No need to configure webhook endpoints in Stripe Dashboard for development
- Real-time webhook testing with your local server
- Automatic webhook signing secret generation
- Event filtering and debugging capabilities

## Prerequisites

- Node.js development environment running
- Stripe account (test mode)
- Your Next.js app running on `localhost:3000`

## Step 1: Install Stripe CLI

### macOS (Recommended)
```bash
brew install stripe/stripe-cli/stripe
```

### Linux (Debian/Ubuntu)
```bash
# Add Stripe's GPG key and repository
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/publish | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg >/dev/null
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

### Windows (using Scoop)
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

### Alternative: Docker
```bash
docker run --rm -it stripe/stripe-cli:latest
```

### Manual Download
Download the latest release from [GitHub](https://github.com/stripe/stripe-cli/releases) for your platform.

## Step 2: Authenticate with Stripe

### Option 1: Browser Login (Recommended)
```bash
stripe login
```
This opens your browser to authenticate with your Stripe account.

### Option 2: API Key Authentication
```bash
stripe login --api-key sk_test_your_secret_key_here
```

### Verify Authentication
```bash
stripe config --list
```

## Step 3: Start Webhook Forwarding

### Basic Forwarding
Forward all webhook events to your local endpoint:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Event-Specific Forwarding (Recommended)
Forward only the events your application handles:

```bash
stripe listen --events payment_intent.succeeded,payment_intent.payment_failed --forward-to localhost:3000/api/webhooks/stripe
```

### Complete Event List for E-commerce
For a full e-commerce setup, you might want these events:

```bash
stripe listen --events payment_intent.succeeded,payment_intent.payment_failed,payment_intent.canceled,checkout.session.completed,checkout.session.expired,invoice.payment_succeeded,invoice.payment_failed --forward-to localhost:3000/api/webhooks/stripe
```

## Step 4: Configure Environment Variables

When you run `stripe listen`, it outputs a webhook signing secret. Copy this secret:

```bash
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

Add it to your `.env.local` file:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Development Webhook Secret (from Stripe CLI)
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...

# Optional: For reference
STRIPE_WEBHOOK_URL=http://localhost:3000/api/webhooks/stripe
```

## Step 5: Test Your Webhook Setup

### 1. Start Your Development Server
In one terminal:
```bash
npm run dev
```

### 2. Start Stripe CLI Forwarding
In another terminal:
```bash
stripe listen --events payment_intent.succeeded,payment_intent.payment_failed --forward-to localhost:3000/api/webhooks/stripe
```

### 3. Trigger Test Events
In a third terminal, trigger webhook events:

```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed

# Test checkout session completion
stripe trigger checkout.session.completed
```

### 4. Monitor Webhook Reception
Watch your development server console and Stripe CLI output for webhook events being received and processed.

## Step 6: Verify Database Updates

After triggering test events, check your database to ensure orders are being updated:

```sql
-- Check recent orders and their status
SELECT 
    order_number, 
    status, 
    payment_status, 
    stripe_payment_intent_id,
    created_at,
    updated_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;
```

Expected behavior:
- `payment_intent.succeeded` → `status: "processing"`, `payment_status: "paid"`
- `payment_intent.payment_failed` → `status: "failed"`, `payment_status: "failed"`

## Advanced CLI Options

### Debug Mode with JSON Output
```bash
stripe listen --print-json --forward-to localhost:3000/api/webhooks/stripe
```

### Skip HTTPS Verification (if needed)
```bash
stripe listen --skip-verify --forward-to localhost:3000/api/webhooks/stripe
```

### Forward from Registered Dashboard Webhooks
If you have webhooks configured in your Dashboard:
```bash
stripe listen --load-from-webhooks-api --forward-to localhost:3000
```

## Troubleshooting

### Common Issues

#### 1. "Command not found: stripe"
**Solution**: Ensure Stripe CLI is properly installed and in your PATH.

#### 2. "You need to login first"
**Solution**: Run `stripe login` or `stripe login --api-key sk_test_...`

#### 3. "Webhook signature verification failed"
**Solution**: Ensure you're using the webhook secret from the Stripe CLI output, not from the Dashboard.

#### 4. "Connection refused" to localhost:3000
**Solution**: Ensure your Next.js development server is running.

### Debug Your Webhook Handler

Add logging to your webhook route (`app/api/webhooks/stripe/route.ts`):

```typescript
console.log('🎣 Webhook received:', {
  type: event.type,
  id: event.id,
  payment_intent_id: event.data.object?.id,
  timestamp: new Date().toISOString()
});
```

### Verify Event Processing

Check webhook delivery logs in real-time:
```bash
stripe listen --events payment_intent.succeeded --forward-to localhost:3000/api/webhooks/stripe --print-json
```

## Development Workflow

### Daily Development Setup
1. Start your Next.js server: `npm run dev`
2. Start Stripe CLI forwarding: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Test payments through your checkout flow
4. Monitor webhook events in both terminals

### Testing Different Scenarios
```bash
# Test successful payment flow
stripe trigger payment_intent.succeeded --override payment_intent:amount=2000

# Test failed payment
stripe trigger payment_intent.payment_failed

# Test canceled payment
stripe trigger payment_intent.canceled

# Test completed checkout session
stripe trigger checkout.session.completed
```

## Security Notes

1. **Development Only**: The webhook secret from Stripe CLI is for development only
2. **No Dashboard Config Needed**: You don't need to configure webhook endpoints in your Stripe Dashboard for development
3. **Test Mode Only**: Stripe CLI forwards test mode events only
4. **Local Network Only**: Events are forwarded only to your local development environment

## Next Steps

Once your development setup is working:

1. ✅ Test all payment scenarios (success, failure, cancellation)
2. ✅ Verify database updates for each event type
3. ✅ Test your checkout flow end-to-end
4. ✅ Add comprehensive logging for debugging
5. 🔄 Set up production webhooks using the [Production Setup Guide](./stripe-webhook-production-setup.md)

## Performance Tips

### Event Filtering
Only listen for events you actually handle to reduce noise:
```bash
stripe listen --events payment_intent.succeeded,payment_intent.payment_failed --forward-to localhost:3000/api/webhooks/stripe
```

### Multiple Development Environments
Use different ports for different projects:
```bash
# Project A
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Project B  
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

Your development webhook setup is now complete! The Stripe CLI will forward all relevant webhook events to your local development environment, allowing you to test your integration thoroughly before deploying to production.