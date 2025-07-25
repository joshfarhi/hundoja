# Stripe Webhook Production Setup Guide (2025)

This guide covers setting up Stripe webhooks for **production deployment**. For local development setup, see the [Development Webhook Setup Guide](./stripe-webhook-development-setup.md).

## Production Requirements

- **HTTPS Required**: Stripe requires all production webhook endpoints to use HTTPS
- **Public Accessibility**: Your webhook endpoint must be publicly accessible from the internet
- **SSL Certificate**: Valid SSL certificate for your domain
- **Reliable Infrastructure**: Production-grade hosting (Vercel, AWS, etc.)

## Step 1: Deploy Your Application

Ensure your Next.js application is deployed to a production environment with:
- HTTPS enabled
- Your webhook route accessible at `https://yourdomain.com/api/webhooks/stripe`
- Production environment variables configured

## Step 2: Configure Webhook Endpoint in Stripe Dashboard

### Method 1: Using Stripe Dashboard (Standard)

1. **Access Stripe Dashboard**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/)
   - Switch to **Live mode** for production (toggle in top-left)
   - Navigate to **Developers** → **Webhooks**

2. **Add New Endpoint**
   - Click **"Add endpoint"**
   - Enter your production URL: `https://yourdomain.com/api/webhooks/stripe`
   - Add description: "Production order payment status updates"

3. **Select Events to Listen For**
   
   **Required Events for E-commerce:**
   - ✅ `payment_intent.succeeded` - Payment completed successfully
   - ✅ `payment_intent.payment_failed` - Payment failed
   
   **Recommended Additional Events:**
   - ✅ `payment_intent.canceled` - Payment canceled by customer
   - ✅ `checkout.session.completed` - Checkout session completed
   - ✅ `checkout.session.expired` - Checkout session expired
   - ✅ `invoice.payment_succeeded` - Subscription payment succeeded
   - ✅ `invoice.payment_failed` - Subscription payment failed

4. **Configure Endpoint Settings**
   - **API Version**: Use your account's default or latest version
   - **Filter events**: Select only the events you need
   - Click **"Add endpoint"**

### Method 2: Using Workbench (2025 Recommended)

1. **Access Workbench**
   - In Stripe Dashboard, go to **Workbench**
   - Navigate to **Webhooks** tab
   - Click **"Add destination"**

2. **Configure Destination**
   - **Destination Type**: Select "Webhook endpoint"
   - **URL**: `https://yourdomain.com/api/webhooks/stripe`
   - **Name**: "Production Webhook Endpoint"
   - **Description**: "Handles payment status updates for orders"

3. **Event Configuration**
   - **API Version**: Choose latest or specific version
   - **Events**: Select the same events as listed above
   - Click **"Create destination"**

## Step 3: Retrieve Webhook Signing Secret

After creating your webhook endpoint:

1. **Find Your Endpoint**
   - In Dashboard → Webhooks, click on your newly created endpoint
   - Or in Workbench → Webhooks, select your destination

2. **Get Signing Secret**
   - Look for **"Signing secret"** section
   - Click **"Reveal"** to show the secret
   - Copy the secret (starts with `whsec_`)

## Step 4: Configure Production Environment Variables

Add these environment variables to your production deployment:

### For Vercel
```bash
# Add via Vercel Dashboard or CLI
vercel env add STRIPE_WEBHOOK_SECRET
# Paste your production webhook secret when prompted

vercel env add STRIPE_SECRET_KEY
# Use your live secret key: sk_live_...
```

### Environment Variables List
```env
# Stripe Production Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_production_secret_here

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Clerk (if using)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

### Platform-Specific Instructions

#### Vercel
```bash
# Using Vercel CLI
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_SECRET_KEY production

# Or via Vercel Dashboard:
# Project Settings → Environment Variables
```

#### Netlify
```bash
# Using Netlify CLI
netlify env:set STRIPE_WEBHOOK_SECRET "whsec_..."
netlify env:set STRIPE_SECRET_KEY "sk_live_..."

# Or via Netlify Dashboard:
# Site Settings → Environment Variables
```

#### AWS/Railway/Other
Add environment variables through your platform's configuration interface.

## Step 5: Test Production Webhooks

### 1. Verify Endpoint Accessibility
Test that your webhook endpoint is publicly accessible:

```bash
curl -X POST https://yourdomain.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook_endpoint_test"}'
```

Expected response: Your webhook should return a 400 or similar error (not 404), indicating the endpoint exists.

### 2. Test with Stripe Dashboard

1. **Go to Your Webhook Endpoint**
   - Dashboard → Webhooks → Your endpoint
   - Click **"Send test webhook"**

2. **Select Test Event**
   - Choose `payment_intent.succeeded`
   - Click **"Send test webhook"**

3. **Verify Response**
   - Check that your endpoint returns `200 OK`
   - Verify the request shows as successful in Stripe Dashboard

### 3. Test with Real Transaction

1. **Create Test Order**
   - Use your production site with a test card
   - Test cards: `4242424242424242` (Visa), `4000002500003155` (requires authentication)

2. **Monitor Webhook Delivery**
   - Go to Dashboard → Webhooks → Your endpoint → Attempt logs
   - Verify webhooks are delivered successfully
   - Check response times and status codes

### 4. Verify Database Updates

Check that your production database reflects webhook processing:

```sql
-- Check recent orders and webhook processing
SELECT 
    order_number,
    status,
    payment_status,
    stripe_payment_intent_id,
    created_at,
    updated_at
FROM orders 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## Step 6: Production Monitoring

### Enable Webhook Logging

Add comprehensive logging to your production webhook handler:

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    // ... webhook processing logic
    
    console.log('✅ Webhook processed successfully', {
      type: event.type,
      id: event.id,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('❌ Webhook processing failed', {
      error: error.message,
      type: event?.type,
      id: event?.id,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    
    return new Response('Error', { status: 500 });
  }
}
```

### Monitor Webhook Health

1. **Stripe Dashboard Monitoring**
   - Go to Dashboard → Webhooks → Your endpoint
   - Monitor **Attempt logs** for delivery success rates
   - Watch **Response times** to ensure performance

2. **Set Up Alerts**
   - Configure alerts for failed webhook deliveries
   - Monitor response time degradation
   - Track error rates in your application logs

### Webhook Retry Logic

Stripe automatically retries failed webhooks:
- **Retry Schedule**: Exponential backoff over 3 days
- **Maximum Attempts**: Multiple attempts with increasing delays
- **Manual Retry**: Available in Dashboard for individual failed attempts

Handle retries properly by making your webhook handler **idempotent**:

```typescript
// Ensure idempotency - process each event only once
const existingWebhookLog = await supabase
  .from('webhook_logs')
  .select('id')
  .eq('stripe_event_id', event.id)
  .single();

if (existingWebhookLog.data) {
  return new Response('Already processed', { status: 200 });
}

// Process webhook and log
await processWebhookEvent(event);
await logWebhookEvent(event.id, 'processed');
```

## Step 7: Security Best Practices

### 1. Webhook Signature Verification
Always verify webhook signatures (already implemented in your webhook handler):

```typescript
const signature = headers().get('stripe-signature');
const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
```

### 2. HTTPS Only
- Ensure your production domain uses HTTPS
- Redirect all HTTP traffic to HTTPS
- Use valid SSL certificates (Let's Encrypt, commercial)

### 3. Rate Limiting
Implement rate limiting for your webhook endpoint:

```typescript
// Example using Redis or in-memory store
const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 4. Error Handling
Return appropriate HTTP status codes:
- `200`: Webhook processed successfully
- `400`: Bad request (malformed payload)
- `401`: Unauthorized (signature verification failed)
- `500`: Internal server error (temporary, will be retried)

## Step 8: Multiple Environments

### Staging Environment
Set up a separate webhook endpoint for staging:

```
Production: https://yourdomain.com/api/webhooks/stripe
Staging: https://staging.yourdomain.com/api/webhooks/stripe
Development: Use Stripe CLI forwarding
```

### Environment-Specific Configuration

```env
# Production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...

# Staging  
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_staging_...
```

## Troubleshooting Production Issues

### Common Production Problems

#### 1. "Webhook signature verification failed"
**Causes:**
- Using development webhook secret in production
- Incorrect environment variable configuration
- Request body modification by middleware

**Solutions:**
- Verify `STRIPE_WEBHOOK_SECRET` matches Dashboard secret
- Check deployment environment variables
- Ensure raw request body is used for signature verification

#### 2. "Webhook endpoint returned non-2xx response"
**Causes:**
- Application errors in webhook handler
- Database connection issues
- Timeout errors

**Solutions:**
- Check application logs for errors
- Verify database connectivity
- Optimize webhook processing time

#### 3. "Connection timeout"
**Causes:**
- Slow webhook processing
- Infrastructure issues
- Database query performance

**Solutions:**
- Optimize webhook handler performance
- Add database indexes for order lookups
- Consider async processing for complex operations

### Debug Production Webhooks

1. **Check Delivery Logs**
   - Dashboard → Webhooks → Endpoint → Attempt logs
   - Look for 4xx/5xx response codes
   - Check response times

2. **Application Logs**
   - Monitor your application's webhook handler logs
   - Look for errors and processing times
   - Track database query performance

3. **Test Specific Events**
   - Use Dashboard "Send test webhook" feature
   - Test with real payment events
   - Verify end-to-end processing

## Performance Optimization

### 1. Fast Response Times
Keep webhook processing under 10 seconds:

```typescript
// Process critical updates immediately
await updateOrderStatus(paymentIntentId, 'processing');

// Queue non-critical tasks
await addToQueue('send-confirmation-email', { orderId });
await addToQueue('update-analytics', { eventData });

return new Response('OK', { status: 200 });
```

### 2. Database Optimization
- Add indexes on frequently queried fields
- Use database connection pooling
- Consider read replicas for analytics

### 3. Async Processing
For complex operations, use background job queues:

```typescript
// Immediate webhook response
const response = await processPaymentStatus(event);

// Background processing
if (response.success) {
  await queue.add('post-payment-processing', {
    orderId: response.orderId,
    customerId: response.customerId
  });
}
```

## Compliance and Monitoring

### 1. PCI Compliance
- Never log credit card data in webhooks
- Ensure your infrastructure meets PCI requirements
- Use Stripe's secure webhook forwarding

### 2. GDPR/Privacy
- Handle customer data appropriately in webhook logs
- Implement data retention policies
- Provide webhook data access/deletion capabilities

### 3. Monitoring Dashboard
Set up monitoring for:
- Webhook delivery success rates
- Response times
- Error rates
- Payment processing volumes

## Deployment Checklist

Before going live with production webhooks:

- [ ] ✅ Webhook endpoint accessible via HTTPS
- [ ] ✅ Valid SSL certificate installed
- [ ] ✅ Production webhook created in Stripe Dashboard
- [ ] ✅ Correct webhook secret configured in production environment
- [ ] ✅ Live Stripe API keys configured
- [ ] ✅ Database production environment ready
- [ ] ✅ Webhook signature verification working
- [ ] ✅ Test webhook delivery successful
- [ ] ✅ End-to-end payment flow tested
- [ ] ✅ Error handling and logging configured
- [ ] ✅ Monitoring and alerting set up
- [ ] ✅ Backup and recovery procedures in place

Your production webhook setup is now complete! Your e-commerce application will reliably receive and process payment events from Stripe, ensuring order statuses are updated in real-time as payments succeed or fail.