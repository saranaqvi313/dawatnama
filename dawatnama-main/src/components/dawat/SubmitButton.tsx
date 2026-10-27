'use client'
import { useEffect, useRef, useState, type ButtonHTMLAttributes } from 'react'
import { useFormStatus } from 'react-dom'
import Icon from '@/components/Icon'
import { buttonClasses, type ButtonLook } from '@/components/Button'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & ButtonLook & { icon?: string; plain?: boolean }

/**
 * A kit-style submit button that shows a spinner from the moment its form is submitted until
 * the action finishes (server actions) or the next page loads (normal form posts).
 * `plain` keeps only the given className (for small text-style actions).
 */
export default function SubmitButton({ children, icon, plain, className, isWhite, isBlack, isGray, isCircle, isStroke, ...props }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const { pending } = useFormStatus()
  const [clicked, setClicked] = useState(false)
  const wasPending = useRef(false)

  useEffect(() => {
    const form = ref.current?.form
    if (!form) return
    const onSubmit = (e: SubmitEvent) => {
      if (e.submitter ? e.submitter === ref.current : form.querySelector('button') === ref.current) setClicked(true)
    }
    // Back/forward cache restores the old page with the spinner still on; clear it.
    const onShow = () => setClicked(false)
    form.addEventListener('submit', onSubmit)
    window.addEventListener('pageshow', onShow)
    return () => { form.removeEventListener('submit', onSubmit); window.removeEventListener('pageshow', onShow) }
  }, [])

  // Server action finished without leaving the page: stop spinning.
  useEffect(() => {
    if (pending) wasPending.current = true
    else if (wasPending.current) { wasPending.current = false; setClicked(false) }
  }, [pending])

  // Safety net (e.g. a file download keeps the page open).
  useEffect(() => {
    if (!clicked) return
    const t = window.setTimeout(() => setClicked(false), 20000)
    return () => window.clearTimeout(t)
  }, [clicked])

  const cls = plain ? className ?? '' : buttonClasses({ className, isWhite, isBlack, isGray, isCircle, isStroke })
  return (
    <button ref={ref} type="submit" aria-busy={clicked || undefined} className={cls} {...props}>
      {icon && <Icon className="fill-inherit" name={icon} />}
      {children}
    </button>
  )
}
