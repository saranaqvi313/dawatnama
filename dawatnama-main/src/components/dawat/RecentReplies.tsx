import Link from 'next/link'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { ago, type ReplyItem } from '@/lib/myCards'
import { initialsOf } from '@/lib/viewer'

const word = (r: ReplyItem) => (r.attending === 'yes' ? `coming${r.guests ? ` (${r.guests})` : ''}` : r.attending === 'maybe' ? 'maybe' : "can't come")
const tone = (r: ReplyItem) => (r.attending === 'yes' ? 'label-green' : r.attending === 'maybe' ? 'label-yellow' : 'label-red')

/** Latest RSVP replies, in the kit's "Comments" list style. */
export default function RecentReplies({ replies, title = 'Latest replies', href }: { replies: ReplyItem[]; title?: string; href?: string }) {
  return (
    <Card classHead="!pl-3" title={title}>
      {replies.length === 0 ? (
        <div className="px-3 pb-5 text-body-2 text-t-secondary">No replies yet. Share your card and replies will show up here.</div>
      ) : (
        <div className="flex flex-col gap-1">
          {replies.map((r) => (
            <div className="group relative flex items-start px-3 py-5 transition-all" key={r.id}>
              <div className="box-hover"></div>
              <div className="relative z-2 flex shrink-0 items-center justify-center size-11 rounded-full bg-b-surface1 text-button">{initialsOf(r.name)}</div>
              <div className="relative z-2 grow min-w-0 pl-5">
                <div className="mb-1 text-sub-title-1">
                  <span dir="auto">{r.name}</span>&nbsp;<span className="text-t-secondary">on</span>&nbsp;
                  <Link className="transition-colors hover:text-shade-05 dark:hover:text-shade-08/90" href={`/dashboard/${r.invitationId}/rsvps`} dir="auto">{r.card}</Link>
                </div>
                <div className="mb-3 text-caption text-t-tertiary">{ago(r.createdAt)}{r.event ? ` · ${r.event}` : ''}</div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`label ${tone(r)}`}>{word(r)}</span>
                  {r.message && <span className="text-body-2" dir="auto">{r.message}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {href && (
        <div className="pt-6 px-3 pb-3">
          <Button className="w-full" href={href} as="link" isStroke>All guests and replies</Button>
        </div>
      )}
    </Card>
  )
}
