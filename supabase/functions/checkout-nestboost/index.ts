// supabase/functions/checkout-nestboost/index.ts
import Stripe from 'https://esm.sh/stripe@14?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') as string, {
  apiVersion: '2024-11-20',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    // CORS preflight (por si algún día la llamas con fetch directo)
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type, authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json().catch((err) => {
      console.error('Error parseando JSON:', err);
      throw new Error('JSON inválido');
    });

    const { teamId, userId } = body as { teamId?: string; userId?: string };

    console.log('checkout-nestboost body:', body);

    if (!teamId || !userId) {
      return new Response('teamId y userId son obligatorios', { status: 400 });
    }

    // Leer el plan boost_10_mxn para obtener el stripe_price_id
    const { data: plan, error: planError } = await supabase
      .from('team_plans')
      .select('stripe_price_id')
      .eq('code', 'boost_10_mxn')
      .single();

    if (planError || !plan?.stripe_price_id) {
      console.error('Error plan:', planError, 'plan:', plan);
      return new Response('Plan no configurado', { status: 500 });
    }

    // Crear Checkout Session de Stripe
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // pago único de 10 MXN
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url:
        'https://example.com/codenest/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://example.com/codenest/cancel',
      metadata: {
        teamId,
        userId,
        planCode: 'boost_10_mxn',
      },
    }); // [web:126]

    console.log('Checkout session creada:', session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('Error create checkout session:', err);
    return new Response('Error interno', { status: 500 });
  }
});