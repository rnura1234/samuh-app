// app/api/register/route.js
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request) {
  const supabase = createAdminClient()

  try {
    const body = await request.json()
    console.log('Register API called with:', body)

    const {
      userId,
      name,
      phone,
      samuhName,
      description,
      monthly_deposit_amount,
      loan_interest_rate,
      late_fee_per_day,
      max_loan_multiplier,
    } = body

    if (!userId || !name || !phone || !samuhName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Auto confirm email
    await supabase.auth.admin.updateUserById(userId, { email_confirm: true })

    // Create Samuh
    const { data: samuh, error: samuhError } = await supabase
      .from('samuhs')
      .insert({
        name:                   samuhName,
        description:            description || null,
        created_by:             userId,
        monthly_deposit_amount: parseFloat(monthly_deposit_amount) || 1000,
        loan_interest_rate:     parseFloat(loan_interest_rate)     || 2,
        late_fee_per_day:       parseFloat(late_fee_per_day)       || 10,
        max_loan_multiplier:    parseFloat(max_loan_multiplier)    || 3,
      })
      .select()
      .single()

    if (samuhError) {
      console.error('Samuh error:', samuhError)
      return NextResponse.json({ error: samuhError.message }, { status: 500 })
    }

    // Add user as admin
    const { error: memberError } = await supabase
      .from('samuh_members')
      .insert({
        samuh_id: samuh.id,
        user_id:  userId,
        name,
        phone,
        role:   'admin',
        status: 'active',
      })

    if (memberError) {
      console.error('Member error:', memberError)
      await supabase.from('samuhs').delete().eq('id', samuh.id)
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, samuhId: samuh.id })

  } catch (err) {
    console.error('Register API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}