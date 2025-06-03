export async function onRequest(context) {
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS request for CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  // Only allow POST requests
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }

  try {
    const body = await context.request.json();
    const { userId, email, product_id, request_id, metadata, success_url } = body;
    const CREEM_API_KEY = context.env.CREEM_API_KEY;

    // Basic validation (optional but recommended)
    if (!email) {
        return new Response(JSON.stringify({ error: 'Email is required' }), {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
        });
    }

    // Use a default product_id if not provided
    const PRODUCT_ID = product_id || context.env.CREEM_PRODUCT_ID || 'prod_7BFwqeQGeKekfu9nPj8h9m'; // Use env variable or default
    if (!PRODUCT_ID || PRODUCT_ID === 'prod_7BFwqeQGeKekfu9nPj8h9m') {
         console.warn('Using default product ID. Ensure CREEM_PRODUCT_ID env variable is set or product_id is provided in the request body.');
    }

    // Build the payload for Creem
    const payload = {
      product_id: PRODUCT_ID,
      customer: { email }, // pre-fill email
    };
    if (userId) payload.metadata = { userId, ...(metadata || {}) };
    if (request_id) payload.request_id = request_id;
    if (success_url) payload.success_url = success_url;

    console.log('Calling Creem API with payload:', JSON.stringify(payload)); // Log payload

    const res = await fetch('https://api.creem.io/v1/checkouts', {
      method: 'POST',
      headers: {
        'x-api-key': CREEM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Check if the response from Creem was successful
    if (!res.ok) {
      const errorBody = await res.text(); // Read response body for error details
      console.error('Error from Creem API:', res.status, res.statusText, errorBody);
      return new Response(JSON.stringify({ error: `Creem API error: ${res.status} - ${errorBody}` }), {
        status: res.status, // Forward the status code from Creem
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const data = await res.json();

    // Check if Creem returned the expected URL
    if (data.checkout_url) {
        console.log('Successfully created checkout session:', data.checkout_url);
        return new Response(JSON.stringify({ url: data.checkout_url }), {
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
    } else {
        console.error('Creem API did not return checkout_url:', data);
         return new Response(JSON.stringify({ error: 'Creem API response missing checkout_url.', creemResponse: data }), {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
    }

  } catch (error) {
    // Catch any unexpected errors during execution
    console.error('Caught error in checkout function:', error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
} 