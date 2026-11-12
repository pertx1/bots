-- La app no tiene usuarios con sesión: solo el rol anónimo (protegido por el secreto del cron) usa estas funciones.
revoke execute on function public.push_sync(jsonb, jsonb) from authenticated;
revoke execute on function public.push_claim_due(text) from authenticated;
revoke execute on function public.push_forget(text, text) from authenticated;
revoke execute on function public.push_vapid_public() from authenticated;
revoke execute on function public.push_vapid_keys(text) from authenticated;
revoke execute on function public.push_set_vapid(text, text, text) from authenticated;
