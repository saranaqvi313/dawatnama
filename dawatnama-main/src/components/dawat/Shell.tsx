import type { ReactNode } from 'react'
import Layout from '@/components/Layout'
import { getViewer, type Viewer } from '@/lib/viewer'
import { ViewerProvider } from './ViewerContext'

type Props = { title?: string; hideSidebar?: boolean; viewer?: Viewer | null; children: ReactNode }

/** The kit's dashboard layout (sidebar + header) with the signed-in person filled in. */
export default async function Shell({ title, hideSidebar, viewer, children }: Props) {
  const v = viewer === undefined ? await getViewer() : viewer
  return (
    <ViewerProvider viewer={v}>
      <Layout title={title} hideSidebar={hideSidebar}>{children}</Layout>
    </ViewerProvider>
  )
}
