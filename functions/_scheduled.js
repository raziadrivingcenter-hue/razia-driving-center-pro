/* ------------------------------------------------------------------ */
/*  Cloudflare Pages scheduled function (cron).                        */
/*                                                                    */
/*  Configure a cron in the Pages dashboard (Workers & Pages → your     */
/*  project → Settings → Cron Triggers), e.g. every 5 minutes. Without   */
/*  the binding this file is inert; the status endpoint still expires    */
/*  holds lazily, so nothing depends on it being set up.                */
/*                                                                    */
/*  Route: functions/_scheduled.js → scheduled(event, env, ctx)         */
/* ------------------------------------------------------------------ */

import { getServiceRoleClient } from "../lib/supabaseRest.js";

export async function scheduled(event, env, ctx) {
  const client = getServiceRoleClient(env);
  if (!client) {
    console.error("Scheduled expiry skipped: SUPABASE_SERVICE_ROLE_KEY not configured");
    return;
  }

  try {
    const released = await client.rpc("expire_stale_card_bookings", {});
    console.log("Expired stale card bookings:", released);
  } catch (error) {
    console.error("Scheduled expiry failed:", error?.message || error);
  }
}
