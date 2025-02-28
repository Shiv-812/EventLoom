import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent, clerkClient } from '@clerk/nextjs/server'
import { createUser, deleteUser, updateUser } from '@/lib/actions/user.actions'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
<<<<<<< HEAD
  try {
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
      console.error('Error: Missing WEBHOOK_SECRET in environment variables')
      return NextResponse.json(
        { error: 'Error: Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local' }, 
        { status: 500 }
      )
=======
  const SIGNING_SECRET = process.env.SIGNING_SECRET

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET)

  // Get headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    })
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
    return new Response('Error: Verification error', {
      status: 400,
    })
  }

  // Do something with payload
  // For this guide, log payload to console
  // const { id } = evt.data
  const eventType = evt.type
  
  if(eventType === 'user.created'){
    const {id, email_addresses, image_url, first_name, last_name, username} = evt.data;

    const user = {
        clerkId: id,
        email: email_addresses[0].email_address,
        username: username!,
        firstName: first_name!,
        lastName: last_name!,
        photo: image_url,
>>>>>>> ef2ce2b50e2d0c02e13ec3d7858c6cd6ae3f0aff
    }

    console.log("❤️route trigger for webhook")
    const headerPayload = headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: "Error occurred -- no svix headers" }, 
        { status: 400 }
      )
    }

    const payload = await req.json()
    const body = JSON.stringify(payload)

    const wh = new Webhook(WEBHOOK_SECRET)
    let evt: WebhookEvent

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent
    } catch (err) {
      console.error("Error verifying webhook:", err)
      return NextResponse.json(
        { error: "Error verifying webhook signature" }, 
        { status: 400 }
      )
    }

    console.log("Event type:", evt.type)
    
    // Get the event type
    const eventType = evt.type
    
    if (eventType === 'user.created') {
      try {
        // Access safely with optional chaining
        const emailAddress = evt.data.email_addresses?.[0]?.email_address || ''
        const firstName = evt.data.first_name || ''
        const lastName = evt.data.last_name || ''
        const imageUrl = evt.data.image_url || ''
        const username = evt.data.username || `user_${evt.data.id.substring(0, 8)}`
        const id = evt.data.id

        console.log("Creating user with data:", { 
          id, emailAddress, firstName, lastName, username 
        })

        const user = {
          clerkId: id,
          email: emailAddress,
          username: username,
          firstName: firstName,
          lastName: lastName,
          photo: imageUrl,
        }

        const newUser = await createUser(user)

        if (newUser) {
          try {
            await clerkClient.users.updateUserMetadata(id, {
              publicMetadata: {
                userId: newUser._id
              }
            })
          } catch (metadataError) {
            console.error("Failed to update metadata:", metadataError)
            // Continue since user is already created
          }
        }

        return NextResponse.json({ message: 'OK', user: newUser })
      } catch (error) {
        console.error("Error in user.created handler:", error)
        return NextResponse.json(
          { error: "Failed to create user", details: String(error) }, 
          { status: 500 }
        )
      }
    }

    if (eventType === 'user.updated') {
      try {
        const id = evt.data.id
        const image_url = evt.data.image_url || ''
        const first_name = evt.data.first_name || ''
        const last_name = evt.data.last_name || ''
        const username = evt.data.username || ''

        const user = {
          firstName: first_name,
          lastName: last_name,
          username: username,
          photo: image_url,
        }

        const updatedUser = await updateUser(id, user)
        return NextResponse.json({ message: 'OK', user: updatedUser })
      } catch (error) {
        console.error("Error in user.updated handler:", error)
        return NextResponse.json(
          { error: "Failed to update user", details: String(error) }, 
          { status: 500 }
        )
      }
    }

    if (eventType === 'user.deleted') {
      try {
        const id = evt.data.id

        if (!id) {
          return NextResponse.json(
            { error: "Missing user ID" }, 
            { status: 400 }
          )
        }

        const deletedUser = await deleteUser(id)
        return NextResponse.json({ message: 'OK', user: deletedUser })
      } catch (error) {
        console.error("Error in user.deleted handler:", error)
        return NextResponse.json(
          { error: "Failed to delete user", details: String(error) }, 
          { status: 500 }
        )
      }
    }

    // Default response for other event types
    return NextResponse.json(
      { message: 'Webhook received', type: eventType }, 
      { status: 200 }
    )
  } catch (error) {
    // Global error handler
    console.error("Unhandled error in webhook handler:", error)
    return NextResponse.json(
      { error: "Internal server error", details: String(error) }, 
      { status: 500 }
    )
  }
<<<<<<< HEAD
}
=======

  return new Response('Webhook received', { status: 200 })
}
>>>>>>> ef2ce2b50e2d0c02e13ec3d7858c6cd6ae3f0aff
