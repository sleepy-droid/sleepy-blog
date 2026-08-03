/**
 * Re-export canónico: el cliente de servidor vive en utils/supabase/server.
 * Evita tener dos implementaciones distintas.
 */
export { createClient } from '@/utils/supabase/server'
