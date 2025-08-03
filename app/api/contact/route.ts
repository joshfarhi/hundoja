import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { createContactNotification } from '@/lib/notifications';

// Validation schema for contact form
const ContactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Subject is required').max(500, 'Subject too long'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  category: z.enum(['general', 'product_inquiry', 'order_support', 'returns', 'business', 'feedback', 'technical']).default('general'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = ContactFormSchema.parse(body);
    
    // Generate a unique ticket number
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Get user agent and IP for tracking (for future use)
    // const userAgent = request.headers.get('user-agent') || '';
    // const forwardedFor = request.headers.get('x-forwarded-for');
    // const realIp = request.headers.get('x-real-ip');
    // const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';
    
    // Insert contact request into database
    const { data: contactRequest, error } = await supabase
      .from('contact_requests')
      .insert({
        ticket_number: ticketNumber,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        subject: validatedData.subject,
        message: validatedData.message,
        category: validatedData.category,
        priority: validatedData.priority,
        status: 'new',
        // Note: created_at and updated_at are automatically set by database
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to submit contact request', details: error.message },
        { status: 500 }
      );
    }

    // Create notification for new contact request
    try {
      await createContactNotification({
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        contactId: contactRequest.id
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the contact submission if notification fails
    }

    // Send confirmation email to customer (optional)
    // You can implement email sending here similar to the newsletter route

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
      ticketNumber: ticketNumber,
      contactId: contactRequest.id
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid form data',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit contact request' },
      { status: 500 }
    );
  }
} 