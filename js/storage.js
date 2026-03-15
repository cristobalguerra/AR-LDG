// Supabase storage for AR Gallery posters
import { supabase } from './supabase-config.js';

const BUCKET = 'posters';
const TABLE = 'posters';

async function addPoster(file, title = '') {
  // Upload image to Supabase Storage
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { contentType: file.type });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  // Get current count for ordering
  const { count } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact', head: true });

  // Insert record into database
  const { error: dbError } = await supabase
    .from(TABLE)
    .insert({
      title,
      image_url: urlData.publicUrl,
      file_path: fileName,
      display_order: count || 0
    });

  if (dbError) throw dbError;
}

async function getPosters() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data.map(p => ({
    id: p.id,
    title: p.title,
    image: p.image_url,
    order: p.display_order
  }));
}

async function deletePoster(id) {
  // Get file path first
  const { data: poster } = await supabase
    .from(TABLE)
    .select('file_path')
    .eq('id', id)
    .single();

  if (poster?.file_path) {
    await supabase.storage.from(BUCKET).remove([poster.file_path]);
  }

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);

  if (error) throw error;
}

async function clearAllPosters() {
  // Get all file paths
  const { data: posters } = await supabase
    .from(TABLE)
    .select('file_path');

  if (posters?.length) {
    const paths = posters.map(p => p.file_path).filter(Boolean);
    if (paths.length) {
      await supabase.storage.from(BUCKET).remove(paths);
    }
  }

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .neq('id', 0); // delete all rows

  if (error) throw error;
}

export { addPoster, getPosters, deletePoster, clearAllPosters };
