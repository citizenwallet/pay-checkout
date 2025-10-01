# CORS Implementation for Partners API

## Overview

CORS (Cross-Origin Resource Sharing) has been implemented for the partners API endpoints to allow requests from any web page. This enables external websites and applications to make API calls to the self-checkout system.

## Implementation Details

### CORS Utility (`src/lib/cors.ts`)

A centralized CORS utility has been created with the following features:

- **Headers**: Allows requests from any origin (`*`)
- **Methods**: Supports GET, POST, PUT, DELETE, OPTIONS, PATCH
- **Headers**: Allows Content-Type, Authorization, and x-api-key headers
- **Cache**: Preflight requests are cached for 24 hours

### Updated Endpoints

The following partners API endpoints now support CORS:

1. **POST** `/api/v1/partners/orders` - Create a new order
2. **GET** `/api/v1/partners/orders/[orderId]` - Get order details
3. **OPTIONS** - Both endpoints support preflight requests

### CORS Headers

All responses now include these headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key
Access-Control-Max-Age: 86400
```

## Usage Example

### JavaScript Fetch API
```javascript
// Create an order
const response = await fetch('https://your-domain.com/api/v1/partners/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
  },
  body: JSON.stringify({
    placeId: 123,
    total: 1000,
    items: [{ id: 1, quantity: 2 }],
    description: 'Test order'
  })
});

const result = await response.json();
console.log(result);
```

### cURL Example
```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: x-api-key,content-type" \
  https://your-domain.com/api/v1/partners/orders

# Create an order
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"placeId": 123, "total": 1000}' \
  https://your-domain.com/api/v1/partners/orders
```

## Security Considerations

- CORS is configured to allow requests from any origin (`*`)
- API key authentication is still required for all requests
- The implementation maintains all existing security measures
- Only the partners endpoints have CORS enabled

## Testing

To test CORS functionality:

1. Start the development server: `npm run dev`
2. Use a browser's developer tools to make a cross-origin request
3. Verify that preflight OPTIONS requests return the correct CORS headers
4. Confirm that actual API requests work from external domains

## Notes

- The favicon endpoint already had CORS headers implemented
- Other API endpoints (app, pos, webhooks) do not have CORS enabled as they are not intended for external access
- The CORS implementation is specifically designed for the partners API integration use case
