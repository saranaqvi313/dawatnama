import { NextResponse, type NextRequest } from 'next/server'
import { confirmUrl, easypaisaConfig } from '@/lib/easypaisa'
import { autoPostResponse } from '@/lib/autopost'
import { siteUrl } from '@/lib/payments'

export const runtime = 'nodejs'

/**
 * Easypaisa step 1 callback: the customer filled in their card and Easypaisa sends back an
 * auth_token. We post it to Confirm.jsf, which finishes the charge and returns to /done.
 */
async function handle(request: NextRequest) {
  const site = siteUrl(request.nextUrl.origin)
  const url = request.nextUrl
  let token = url.searchParams.get('auth_token')
  if (!token && request.method === 'POST') token = String((await request.formData()).get('auth_token') ?? '')
  const order = url.searchParams.get('order') ?? ''
  const config = easypaisaConfig()
  if (!config || !token || !/^[A-Za-z0-9]{6,30}$/.test(order)) return NextResponse.redirect(`${site}/premium?result=failed`, 303)
  return autoPostResponse(confirmUrl(config), {
    auth_token: token,
    postBackURL: `${site}/api/pay/card/done?order=${order}`,
  }, 'Finish payment')
}

export const GET = handle
export const POST = handle
