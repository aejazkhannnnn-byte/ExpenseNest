import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function respond(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getDefaultKey(jsonEnvironmentName: string, legacyEnvironmentName: string) {
  const keyMap = Deno.env.get(jsonEnvironmentName);
  if (keyMap) {
    try {
      const parsed = JSON.parse(keyMap);
      if (typeof parsed?.default === 'string') return parsed.default;
    } catch {
      console.error(`Could not read ${jsonEnvironmentName}.`);
    }
  }
  return Deno.env.get(legacyEnvironmentName);
}

const isUuid = (value: unknown): value is string => (
  typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
);

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond(405, { success: false, message: 'Use POST for this action.' });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const publishableKey = getDefaultKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
    const serviceKey = getDefaultKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');
    const authorization = request.headers.get('Authorization');

    if (!supabaseUrl || !publishableKey || !serviceKey) {
      console.error('Required Supabase Edge Function secrets are missing.');
      return respond(500, { success: false, message: 'The account action service is not configured yet.' });
    }
    if (!authorization?.startsWith('Bearer ')) {
      return respond(401, { success: false, message: 'Sign in as an administrator and try again.' });
    }

    const body = await request.json();
    const userId = body?.user_id;
    const action = body?.action;
    if (!isUuid(userId) || (action !== 'suspend' && action !== 'reactivate')) {
      return respond(400, { success: false, message: 'Choose a valid account and action.' });
    }

    const callerClient = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { headers: { Authorization: authorization } },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    const actor = callerData.user;
    if (callerError || !actor) {
      return respond(401, { success: false, message: 'Your session is invalid. Sign in again.' });
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });

    const { data: actorAdmin, error: actorAdminError } = await adminClient
      .from('admin_users')
      .select('user_id')
      .eq('user_id', actor.id)
      .maybeSingle();
    if (actorAdminError) {
      console.error('Could not verify admin membership.', actorAdminError);
      return respond(500, { success: false, message: 'Administrator access could not be verified.' });
    }
    if (!actorAdmin) return respond(403, { success: false, message: 'Administrator access required.' });
    if (actor.id === userId) return respond(400, { success: false, message: 'You cannot change sign-in access for your own admin account.' });

    const { data: targetAdmin, error: targetAdminError } = await adminClient
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (targetAdminError) {
      console.error('Could not verify target account role.', targetAdminError);
      return respond(500, { success: false, message: 'The account role could not be verified.' });
    }
    if (targetAdmin) return respond(403, { success: false, message: 'Admin accounts cannot be changed from this screen.' });

    let userDisplayId: string | null = null;
    const { data: displayRecord, error: displayIdError } = await adminClient
      .from('user_display_ids')
      .select('display_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (!displayIdError) userDisplayId = displayRecord?.display_id || null;

    const { data: auditRecord, error: auditInsertError } = await adminClient
      .from('admin_activity_logs')
      .insert({
        actor_id: actor.id,
        actor_email: actor.email || null,
        action: 'user_account_action',
        target_type: 'user',
        target_id: userId,
        details: {
          requested_action: action,
          result: 'processing',
          user_display_id: userDisplayId,
        },
      })
      .select('id')
      .single();
    if (auditInsertError || !auditRecord) {
      console.error('Could not start account action audit record.', auditInsertError);
      return respond(503, { success: false, message: 'Run supabase/admin_user_actions.sql before changing account access.' });
    }

    const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: action === 'suspend' ? '876000h' : 'none',
    });

    if (updateError) {
      console.error('Could not apply account sign-in action.', updateError);
      const { error: auditUpdateError } = await adminClient
        .from('admin_activity_logs')
        .update({ details: { requested_action: action, result: 'failed', reason: 'auth_update_failed', user_display_id: userDisplayId } })
        .eq('id', auditRecord.id);
      if (auditUpdateError) console.error('Could not finalize failed account action audit record.', auditUpdateError);
      return respond(400, { success: false, message: 'Supabase could not change sign-in access for this account.' });
    }

    const { error: auditFinalizeError } = await adminClient
      .from('admin_activity_logs')
      .update({ details: { requested_action: action, result: 'completed', user_display_id: userDisplayId } })
      .eq('id', auditRecord.id);
    if (auditFinalizeError) console.error('Account action completed, but its audit record could not be finalized.', auditFinalizeError);

    return respond(200, {
      success: true,
      action,
      status: action === 'suspend' ? 'suspended' : 'registered',
      banned_until: updateData.user?.banned_until || null,
      audit_warning: Boolean(auditFinalizeError),
    });
  } catch (error) {
    console.error('Unexpected account action failure.', error);
    return respond(500, { success: false, message: 'The account action could not be completed.' });
  }
});
