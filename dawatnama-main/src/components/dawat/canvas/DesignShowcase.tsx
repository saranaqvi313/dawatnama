import Link from 'next/link'
import Icon from '@/components/Icon'
import { createCanvasInvitation } from '@/app/actions'
import { CANVAS_TEMPLATES } from '@/lib/canvasTemplates'
import CanvasCard from './CanvasCard'
import GridCard, { Grid } from '../GridCard'
import SubmitButton from '../SubmitButton'

/** The drag-and-drop design templates, as a kit-style grid. */
export default function DesignShowcase({ premium, limit }: { premium: boolean; limit?: number }) {
  return (
    <Grid>
      {CANVAS_TEMPLATES.slice(0, limit).map((t) => (
        <GridCard key={t.id}
          title={t.name}
          thumbClass="aspect-[9/16]"
          badge={<div className="label label-yellow">Premium</div>}
          details={t.tag}
          thumb={
            <Link href={`/preview/${t.id}`} className="block size-full transition-transform duration-300 group-hover:scale-[1.03]" aria-label={`Preview ${t.name}`}>
              <CanvasCard doc={t.doc} />
            </Link>
          }
          actions={
            <>
              <Link className="action" href={`/preview/${t.id}`}><Icon name="desktop" />Preview</Link>
              <form action={createCanvasInvitation}>
                <input type="hidden" name="template" value={t.id} />
                <SubmitButton plain className="action"><Icon name="magic-pencil" />{premium ? 'Customise' : 'Customise (Premium)'}</SubmitButton>
              </form>
            </>
          }
        />
      ))}
    </Grid>
  )
}
