# Render Free Tier Cost Information

## Keep-Alive Service Cost Analysis

### ✅ Internal Keep-Alive (localhost) - **100% FREE**

The internal keep-alive service pings your own service via `127.0.0.1` (localhost). 

**Why it's free:**
- Render only charges for **outbound bandwidth** over the public Internet
- Internal requests (localhost/127.0.0.1) stay within the same server/container
- No traffic goes over the public Internet, so no bandwidth charges
- **Zero cost, zero Render credits used**

### ✅ External Keep-Alive Services - **100% FREE**

Services like UptimeRobot, Cronitor, or Pingdom making requests TO your Render service:

**Why it's free:**
- These are **inbound requests** (coming TO your service)
- Render charges for **outbound bandwidth**, not inbound
- Inbound traffic is completely free
- **Zero cost, zero Render credits used**

### ❌ What DOES Cost Money

Render charges for:
1. **Outbound bandwidth**: $15 per 100 GB
   - Your service making HTTP requests to external APIs
   - Your service uploading files to cloud storage
   - Your service calling external databases
   - Any traffic your service initiates over the public Internet

2. **Paid plans**: $7/month (Starter plan) to keep services always awake
   - Not needed if using free keep-alive

## Render Free Tier Limits

- **Sleep after**: 15 minutes of inactivity
- **Included bandwidth**: Varies by plan (check Render dashboard)
- **Outbound bandwidth**: $15 per 100 GB over included amount
- **Inbound bandwidth**: Unlimited and free

## Recommendation

**Use the internal keep-alive service** - it's:
- ✅ Completely free
- ✅ No bandwidth charges
- ✅ No Render credits used
- ✅ Prevents sleep on free tier
- ✅ Simple to enable with `KEEP_ALIVE_ENABLED=true`

**Or use external service** (UptimeRobot) - also:
- ✅ Completely free
- ✅ More reliable
- ✅ Better monitoring
- ✅ No bandwidth charges (inbound is free)

## How to Verify

1. Enable keep-alive: `KEEP_ALIVE_ENABLED=true`
2. Monitor bandwidth in Render dashboard
3. You'll see NO increase in outbound bandwidth
4. Service stays awake without any charges

## References

- Render Bandwidth Pricing: https://render.com/blog/new-bandwidth-pricing-on-render
- Render Free Tier: https://render.com/docs/free
- Render charges only for **outbound** traffic over public Internet

