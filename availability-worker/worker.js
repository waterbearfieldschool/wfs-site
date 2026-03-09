export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const url = new URL(request.url);
    const ids = url.searchParams.get('ids');
    if (!ids) {
      return jsonResponse({ error: 'Missing ids parameter' }, 400);
    }

    const requestedIds = ids.split(',').map(id => id.trim()).filter(Boolean);
    const result = {};

    try {
      const apiKey = env.SNIPCART_SECRET_KEY;
      const response = await fetch('https://app.snipcart.com/api/products', {
        headers: {
          'Authorization': 'Basic ' + btoa(apiKey + ':'),
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return jsonResponse({ error: 'Snipcart API error' }, 502);
      }

      const data = await response.json();
      const products = data.items || data;

      for (const id of requestedIds) {
        const product = (Array.isArray(products) ? products : []).find(
          p => p.userDefinedId === id
        );
        if (product && product.totalStock != null) {
          result[id] = { stock: product.stock, totalStock: product.totalStock };
        } else {
          result[id] = { stock: null };
        }
      }
    } catch (err) {
      return jsonResponse({ error: 'Failed to fetch availability' }, 500);
    }

    return jsonResponse(result, 200);
  },
};

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'max-age=30',
    },
  });
}
