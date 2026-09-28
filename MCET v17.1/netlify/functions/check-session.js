const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
  const sessionId = event.queryStringParameters?.session_id;

  if (!sessionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing session_id' }),
    };
  }

  const { data, error } = await supabase
    .from('paid_sessions')
    .select('paid')
    .eq('session_id', sessionId)
    .single();

  if (error || !data) {
    return {
      statusCode: 200,
      body: JSON.stringify({ paid: false }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ paid: !!data.paid }),
  };
};