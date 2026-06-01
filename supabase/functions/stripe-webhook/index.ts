// supabase/functions/stripe-webhook/index.ts
import Stripe from 'https://esm.sh/stripe@14?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') as string, {
  apiVersion: '2024-11-20',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error('❌ Error verificando webhook:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`🔔 Evento Stripe recibido: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const teamId = session.metadata?.teamId;
    const userId = session.metadata?.userId;
    const planCode = session.metadata?.planCode ?? 'boost_10_mxn';

    if (!teamId || !userId) {
      console.error('Faltan teamId o userId en metadata');
      return new Response(JSON.stringify({ ok: false }), { status: 200 });
    }

    // Leer plan para obtener id
    const { data: plan, error: planError } = await supabase
      .from('team_plans')
      .select('id')
      .eq('code', planCode)
      .single();

    if (planError || !plan?.id) {
      console.error('Error plan en webhook:', planError);
      return new Response(JSON.stringify({ ok: false }), { status: 200 });
    }

    // Calcular fecha de expiración (30 días)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Opcional: podrías buscar el nombre del usuario en tu tabla users
    const boostedByName = 'Miembro del equipo';

    const { error: updateError } = await supabase
      .from('teams')
      .update({
        is_boosted: true,
        boosted_by_user_id: userId,
        boosted_by_name: boostedByName,
        boost_expires_at: expiresAt.toISOString(),
        active_plan_id: plan.id,
      })
      .eq('id_team', teamId);

    if (updateError) {
      console.error('Error actualizando team:', updateError);
    } else {
      console.log('✅ Equipo mejorado correctamente:', teamId);
    }
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});