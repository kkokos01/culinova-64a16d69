// @ts-nocheck
// This file runs in Deno runtime, not Node.js
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationEmail {
  to: string
  spaceName: string
  inviterName: string
  role: string
  invitationId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invitation }: { invitation: InvitationEmail } = await req.json()

    // Initialize Resend with API key from environment
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

    // Create the invitation URL
    const invitationUrl = `${req.headers.get('origin') || 'https://culinova.com'}/invitations?id=${invitation.invitationId}`

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Culinova <invitations@culinova.com>',
      to: [invitation.to],
      subject: `Invitation to join "${invitation.spaceName}" on Culinova`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You're invited!</h2>
          <p>Hi there,</p>
          <p><strong>${invitation.inviterName}</strong> has invited you to join their collection "<strong>${invitation.spaceName}</strong>" on Culinova.</p>
          <p>You've been invited as a <strong>${invitation.role}</strong>.</p>
          <div style="margin: 30px 0;">
            <a href="${invitationUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you don't have a Culinova account yet, you'll be able to create one after clicking the link above.
            <br>
            This invitation will expire in 7 days.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending email:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-invitation-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
