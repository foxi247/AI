import { createClient } from './client'
import { Project, ProjectFile } from '@/lib/types'

// ─── Projects ───────────────────────────────────────────────────────────────

export async function getUserProjects(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, project_files(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data || []).map(rowToProject)
}

export async function getProject(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, project_files(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return rowToProject(data)
}

export async function createProject(
  userId: string,
  name: string,
  description: string,
  files: Omit<ProjectFile, 'id'>[]
) {
  const supabase = createClient()

  // Ensure profile exists — ignore recursion/RLS errors, trigger handles this on signup
  try {
    await supabase
      .from('profiles')
      .upsert({ id: userId, role: 'user' }, { onConflict: 'id', ignoreDuplicates: true })
  } catch { /* safe to continue */ }

  const { data: proj, error: projErr } = await supabase
    .from('projects')
    .insert({ user_id: userId, name, description })
    .select()
    .single()

  if (projErr) throw projErr

  if (files.length > 0) {
    const { error: filesErr } = await supabase.from('project_files').insert(
      files.map((f) => ({
        project_id: proj.id,
        name: f.name,
        path: f.path,
        content: f.content,
        language: f.language,
      }))
    )
    if (filesErr) throw filesErr
  }

  return getProject(proj.id)
}

export async function updateProject(id: string, updates: Partial<{ name: string; description: string; deploy_url: string }>) {
  const supabase = createClient()
  const { error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteProject(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

// ─── Files ───────────────────────────────────────────────────────────────────

export async function upsertFile(projectId: string, file: Omit<ProjectFile, 'id'> & { id?: string }) {
  const supabase = createClient()
  const { error } = await supabase.from('project_files').upsert({
    id: file.id,
    project_id: projectId,
    name: file.name,
    path: file.path,
    content: file.content,
    language: file.language,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error

  // bump project updated_at
  await supabase.from('projects').update({ updated_at: new Date().toISOString() }).eq('id', projectId)
}

export async function deleteFile(fileId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('project_files').delete().eq('id', fileId)
  if (error) throw error
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    isPublic: row.is_public || false,
    deployUrl: row.deploy_url || undefined,
    files: (row.project_files || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f: any): ProjectFile => ({
        id: f.id,
        name: f.name,
        path: f.path,
        content: f.content || '',
        language: f.language || 'plaintext',
      })
    ),
  }
}
