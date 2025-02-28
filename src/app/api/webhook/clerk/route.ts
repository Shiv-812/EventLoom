import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent, clerkClient } from '@clerk/nextjs/server'
import { createUser, deleteUser, updateUser } from '@/lib/actions/user.actions'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // Make sure to use the correct environment variable name that matches your Clerk setup
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || process.env.SIGNING_SECRET

    if (!WEBHOOK_SECRET) {
      console.error('Error: Missing WEBHOOK_SECRET in environment variables')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    // Create new Svix instance with secret
    const wh = new Webhook(WEBHOOK_SECRET)

    // Get headers
    const headerPayload = headers() 
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 })
    }

    // Get body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    let evt: WebhookEvent

    // Verify payload with headers
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent
    } catch (err) {
      console.error('Error: Could not verify webhook:', err)
      return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 })
    }

    const eventType = evt.type

    if (eventType === 'user.created') {
      try {
        const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;

        const user = {
          clerkId: id,
          email: email_addresses && email_addresses[0] ? email_addresses[0].email_address : '',
          username: username || id.substring(0, 8), // Fallback username in case it's null
          firstName: first_name || '',
          lastName: last_name || '',
          photo: image_url || '',
        }

        const newUser = await createUser(user);

        if (newUser) {
          await clerkClient.users.updateUserMetadata(id, {
            publicMetadata: {
              userId: newUser._id
            }
          })
        }

        return NextResponse.json({ message: 'User created successfully', user: newUser })
      } catch (error) {
        console.error('Failed to create user:', error)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }
    }

    if (eventType === 'user.updated') {
      try {
        const { id, image_url, first_name, last_name, username } = evt.data

        const user = {
          firstName: first_name || '',
          lastName: last_name || '',
          username: username || '',
          photo: image_url || '',
        }

        const updatedUser = await updateUser(id, user)
        return NextResponse.json({ message: 'User updated successfully', user: updatedUser })
      } catch (error) {
        console.error('Failed to update user:', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
      }
    }

    if (eventType === 'user.deleted') {
      try {
        const { id } = evt.data

        if (!id) {
          return NextResponse.json({ error: 'Missing user ID' }, { status: 400 })
        }

        const deletedUser = await deleteUser(id)
        return NextResponse.json({ message: 'User deleted successfully', user: deletedUser })
      } catch (error) {
        console.error('Failed to delete user:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
      }
    }

    // For any other event type
    return NextResponse.json({ message: 'Webhook received', eventType }, { status: 200 })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}