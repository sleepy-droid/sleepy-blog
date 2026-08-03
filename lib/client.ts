/**
 * Re-export canónico: el cliente de browser vive en utils/supabase/client.
 * Evita tener dos implementaciones distintas.
 */
export { createClient } from '@/utils/supabase/client'
