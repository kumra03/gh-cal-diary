import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { method, date, data } = await req.json();

    if (method === 'GET') {
      // Retrieve diary entry for a specific date
      const { data: entry, error } = await supabaseClient
        .from('diary_entries')
        .select('*')
        .eq('date', date)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return new Response(
        JSON.stringify({ entry: entry || null }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else if (method === 'POST') {
      // Save or update diary entry
      const { data: existingEntry } = await supabaseClient
        .from('diary_entries')
        .select('id')
        .eq('date', date)
        .single();

      let result;
      if (existingEntry) {
        // Update existing entry
        result = await supabaseClient
          .from('diary_entries')
          .update({ data })
          .eq('date', date);
      } else {
        // Insert new entry
        result = await supabaseClient
          .from('diary_entries')
          .insert([{ date, data }]);
      }

      if (result.error) {
        throw result.error;
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
