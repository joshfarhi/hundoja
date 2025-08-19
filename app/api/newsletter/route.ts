import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, phone, country } = await req.json();

    // At least one of email or phone must be provided
    if (!email && !phone) {
      return NextResponse.json({ error: 'Either email or phone number is required' }, { status: 400 });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
    }

    // Validate phone format if provided
    if (phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{7,20}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
      }
    }

    // Get client information
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';

    // Store newsletter subscription in database
    try {
      const subscriptionData = {
        ...(email && { email }),
        ...(phone && { phone }),
        ...(country && { country_code: country }),
        ip_address: clientIP,
        user_agent: userAgent,
        referrer_url: referer,
        status: 'active',
        source: 'web',
        confirmed_at: new Date().toISOString(),
        preferences: {
          email_notifications: email ? true : false,
          sms_notifications: phone ? true : false
        }
      };

      // Check for existing subscriber by email OR phone
      let existingSubscriber = null;
      let checkError = null;

      if (email) {
        const { data, error } = await supabase
          .from('newsletter_subscribers')
          .select('id, status, email, phone')
          .eq('email', email)
          .single();
        existingSubscriber = data;
        checkError = error;
      } else if (phone) {
        const { data, error } = await supabase
          .from('newsletter_subscribers')
          .select('id, status, email, phone')
          .eq('phone', phone)
          .single();
        existingSubscriber = data;
        checkError = error;
      }

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingSubscriber) {
        // Update existing subscriber
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({
            ...(email && { email }),
            ...(phone && { phone }),
            ...(country && { country_code: country }),
            status: 'active',
            preferences: subscriptionData.preferences,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscriber.id);

        if (updateError) throw updateError;
      } else {
        // Insert new subscriber
        const { error: insertError } = await supabase
          .from('newsletter_subscribers')
          .insert(subscriptionData);

        if (insertError) throw insertError;
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Check if this is an RLS policy violation
      if (dbError && typeof dbError === 'object' && 'code' in dbError) {
        if (dbError.code === '42501') {
          return NextResponse.json(
            { 
              error: 'Database configuration issue. Please contact support.',
              details: 'Newsletter table RLS policies need to be configured. Run the SQL setup scripts.'
            },
            { status: 500 }
          );
        }
        
        if (dbError.code === '42P01') {
          return NextResponse.json(
            { 
              error: 'Database not properly configured. Please contact support.',
              details: 'Newsletter subscribers table does not exist. Run the SQL setup scripts.'
            },
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to save subscription. Please try again.',
          details: dbError instanceof Error ? dbError.message : 'Database error'
        },
        { status: 500 }
      );
    }

    // Create notification for new newsletter subscription
    try {
      await supabase
        .from('notifications')
        .insert({
          type: 'new_customer',
          title: 'New Newsletter Subscription',
          message: `A new subscriber has joined the newsletter: ${email || phone}`,
          icon_name: 'UserPlus',
          icon_color: 'text-green-400',
          metadata: {
            email: email || null,
            phone: phone || null,
            country_code: country || null,
            subscription_date: new Date().toISOString()
          }
        });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the subscription if notification fails
    }

    return NextResponse.json({ 
      message: 'Successfully subscribed to newsletter!',
      success: true 
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to subscribe to newsletter. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}