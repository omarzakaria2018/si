// Netlify Function for health check
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    },
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'نظام إدارة العقارات يعمل بشكل طبيعي',
      version: '2.0.0',
      features: {
        supabase: true,
        realtime: true,
        storage: true,
        arabic_support: true
      }
    })
  };
};
