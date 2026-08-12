import { supabase } from "@/integrations/supabase/client";

export async function up() {
  const { error } = await supabase.rpc("exec_sql", {
    sql: `
      ALTER TABLE public.categories 
      ADD COLUMN IF NOT EXISTS seo_title TEXT,
      ADD COLUMN IF NOT EXISTS seo_description TEXT,
      ADD COLUMN IF NOT EXISTS seo_keyword TEXT,
      ADD COLUMN IF NOT EXISTS seo_footer_text TEXT,
      ADD COLUMN IF NOT EXISTS cover_alt TEXT;
    `
  });
  
  // if rpc exec_sql doesn't exist, we'll try a different approach or rely on the user to apply it via SQL editor
  // However, I should try to use the migration tool if available.
  return error;
}
