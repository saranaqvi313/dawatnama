'use client'
import { useState, type ReactNode } from 'react'
import { Element, Link as ScrollLink } from 'react-scroll'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Field from '@/components/Field'
import Button from '@/components/Button'
import Icon from '@/components/Icon'
import { changePassword, updateName } from '@/app/settings/actions'
import { PASSWORD_RULES } from '@/lib/password'
import { PRODUCTS, rupees } from '@/lib/pricing'
import type { Viewer } from '@/lib/viewer'

const ElementWithOffset = ({ className, name, children }: { className?: string; name: string; children: ReactNode }) => (
  <div className="relative">
    <Element className={`absolute -top-21 left-0 right-0 ${className || ''}`} name={name}></Element>
    {children}
  </div>
)

const Msg = ({ m }: { m: { ok: boolean; text: string } | null }) =>
  m ? <div className={`label ${m.ok ? 'label-green' : 'label-red'} !h-auto py-1.5 !leading-normal self-start`} role={m.ok ? 'status' : 'alert'}>{m.text}</div> : null

const navigation = [
  { title: 'Your plan', icon: 'wallet', description: 'Premium and guest links', to: 'plan' },
  { title: 'Security', icon: 'lock', description: 'Change password', to: 'security' },
  { title: 'Help', icon: 'help', description: 'Contact us, terms and refunds', to: 'help' },
]

/** Profile settings in the kit's settings layout: menu on the left, sections on the right. */
export default function SettingsView({ viewer, legacyPassword }: { viewer: Viewer; legacyPassword: boolean }) {
  const router = useRouter()
  const [name, setName] = useState(viewer.name === viewer.phone ? '' : viewer.name)
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [savingName, setSavingName] = useState(false)
  const [current, setCurrent] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [savingPw, setSavingPw] = useState(false)

  async function saveName() {
    setSavingName(true); setNameMsg(null)
    const res = await updateName(name)
    setSavingName(false)
    setNameMsg(res.ok ? { ok: true, text: 'Saved.' } : { ok: false, text: res.error ?? 'Could not save.' })
    if (res.ok) router.refresh()
  }
  async function savePassword() {
    if (pw !== pw2) return setPwMsg({ ok: false, text: 'The new passwords do not match.' })
    setSavingPw(true); setPwMsg(null)
    const res = await changePassword(current, pw)
    setSavingPw(false)
    if (res.ok) { setCurrent(''); setPw(''); setPw2('') }
    setPwMsg(res.ok ? { ok: true, text: 'Password changed. Use the new one next time you sign in.' } : { ok: false, text: res.error ?? 'Could not change the password.' })
  }

  return (
    <div className="flex items-start max-lg:block">
      <div className="card sticky top-22 shrink-0 w-120 max-3xl:w-100 max-2xl:w-74 max-lg:hidden">
        <div className="flex flex-col gap-1">
          <ScrollLink className="group relative flex items-center h-18 px-3 cursor-pointer" activeClass="[&_.box-hover]:!visible [&_.box-hover]:!opacity-100"
            to="profile-information" smooth={true} duration={500} isDynamic={true} spy={true}>
            <div className="box-hover"></div>
            <div className="relative z-2 flex justify-center items-center shrink-0 w-11 h-11 rounded-full bg-b-surface1 text-button">
              {viewer.initials}
              <div className="absolute right-0 bottom-0 w-[13px] h-[13px] bg-primary-02 border-2 border-b-surface2 rounded-full"></div>
            </div>
            <div className="relative z-2 grow min-w-0 pl-4">
              <div className="text-button truncate">{viewer.name}</div>
              <div className="mt-1 text-caption text-t-secondary" dir="ltr">{viewer.phone}</div>
            </div>
          </ScrollLink>
          {navigation.map((item) => (
            <ScrollLink key={item.to} className="group relative flex items-center h-18 px-3 cursor-pointer" activeClass="[&_.box-hover]:!visible [&_.box-hover]:!opacity-100"
              to={item.to} smooth={true} duration={500} isDynamic={true} spy={true} offset={-5.5}>
              <div className="box-hover"></div>
              <div className="relative z-2 flex justify-center items-center shrink-0 !size-11 rounded-full bg-b-surface1">
                <Icon className="fill-t-secondary" name={item.icon} />
              </div>
              <div className="relative z-2 w-[calc(100%-2.75rem)] pl-4">
                <div className="text-button">{item.title}</div>
                <div className="mt-1 truncate text-caption text-t-secondary">{item.description}</div>
              </div>
            </ScrollLink>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 w-[calc(100%-30rem)] pl-3 max-3xl:w-[calc(100%-25rem)] max-2xl:w-[calc(100%-18.5rem)] max-lg:w-full max-lg:pl-0">
        <ElementWithOffset className="-top-22" name="profile-information">
          <Card title="Profile information">
            <div className="flex flex-col gap-8 p-5 pt-0 max-lg:px-3">
              <div className="flex items-center">
                <div className="flex justify-center items-center shrink-0 w-20 h-20 rounded-full bg-b-surface1 text-h5">{viewer.initials}</div>
                <div className="grow max-w-88 pl-4 text-caption text-t-secondary">Your initials are shown at the top of every page. Change your display name below.</div>
              </div>
              <Field label="Display name" placeholder="Enter display name" tooltip="Shown in your dashboard. Guests do not see it." maxLength={60}
                value={name} onChange={(e) => { setName(e.target.value); setNameMsg(null) }} validated={Boolean(nameMsg?.ok)} />
              <Field label="Mobile number" tooltip="You sign in with this number. Contact us to change it." value={viewer.phone} readOnly dir="ltr" classInput="text-t-secondary" />
              <div className="flex flex-wrap items-center gap-3">
                <Button isBlack onClick={saveName} disabled={savingName} aria-busy={savingName || undefined}>Save profile</Button>
                <Msg m={nameMsg} />
              </div>
            </div>
          </Card>
        </ElementWithOffset>

        <ElementWithOffset name="plan">
          <Card title="Your plan" headContent={<span className={`mr-3 label ${viewer.premium ? 'label-green' : 'label-gray'}`}>{viewer.premium ? 'Premium' : 'Free'}</span>}>
            <div className="px-5 max-lg:px-3">
              {[
                ['Premium design', viewer.premium ? 'Active on all your cards' : `Not active · ${rupees(PRODUCTS.premium.price)} one time`],
                ['Guest links left', `${viewer.credits} · use them on any card`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center gap-6 py-6 border-b border-s-subtle">
                  <div className="text-button">{k}</div>
                  <div className="text-body-2 text-t-secondary text-right">{v}</div>
                </div>
              ))}
              <div className="flex flex-wrap gap-3 py-6">
                <Button isBlack as="link" href="/premium?return=/settings">Buy links</Button>
                {!viewer.premium && <Button isStroke as="link" href="/premium?return=/settings">Get Premium</Button>}
              </div>
            </div>
          </Card>
        </ElementWithOffset>

        <ElementWithOffset name="security">
          <Card title="Password">
            <div className="flex flex-col gap-8 p-5 pt-0 max-lg:px-3 max-md:gap-4">
              {legacyPassword && <div className="label label-yellow !h-auto py-1.5 !leading-normal self-start">Your account does not have a password yet. Sign out and sign in once with your number to set one.</div>}
              <Field innerLabel="Current password" placeholder="Enter current password" type="password" autoComplete="current-password" dir="ltr"
                value={current} onChange={(e) => setCurrent(e.target.value)} required />
              <div className="flex gap-4 max-md:flex-col">
                <Field className="flex-1" innerLabel="New password" placeholder="Enter new password" type="password" autoComplete="new-password" dir="ltr"
                  value={pw} onChange={(e) => setPw(e.target.value)} required />
                <Field className="flex-1" innerLabel="Confirm new password" placeholder="Confirm new password" type="password" autoComplete="new-password" dir="ltr"
                  value={pw2} onChange={(e) => setPw2(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 -mt-4 max-md:grid-cols-1 max-md:mt-0">
                {PASSWORD_RULES.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-caption text-t-secondary">
                    <Icon className={`!size-4 shrink-0 ${r.test(pw) ? 'fill-primary-02' : 'fill-t-secondary/50'}`} name="check-circle-fill" />{r.label}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button isBlack onClick={savePassword} disabled={savingPw || !current || !pw} aria-busy={savingPw || undefined}>Update password</Button>
                <Msg m={pwMsg} />
              </div>
            </div>
          </Card>
        </ElementWithOffset>

        <ElementWithOffset name="help">
          <Card title="Help">
            <div className="px-5 max-lg:px-3">
              {[
                ['Contact us', 'Questions about a card, a payment or a refund', '/contact'],
                ['Terms of service', 'The rules for using Dawatnama', '/terms'],
                ['Privacy policy', 'What we keep and why', '/privacy'],
                ['Refund policy', 'When you can get your money back', '/refund-policy'],
              ].map(([t, d, href]) => (
                <a key={href} href={href} className="group flex justify-between items-center gap-6 py-6 border-b border-s-subtle last:border-b-0">
                  <div>
                    <div className="text-button">{t}</div>
                    <div className="mt-1 text-caption text-t-secondary">{d}</div>
                  </div>
                  <Icon className="shrink-0 fill-t-secondary transition-colors group-hover:fill-t-primary" name="arrow" />
                </a>
              ))}
            </div>
          </Card>
        </ElementWithOffset>
      </div>
    </div>
  )
}
