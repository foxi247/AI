import WorkspaceLayout from '@/components/workspace/WorkspaceLayout'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ prompt?: string }>
}

export default async function WorkspacePage({ params, searchParams }: Props) {
  const { id } = await params
  const { prompt } = await searchParams
  return <WorkspaceLayout projectId={id} initialPrompt={prompt} />
}
