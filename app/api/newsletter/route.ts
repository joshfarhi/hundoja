import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSettingValue } from '@/lib/email-settings';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Get Gmail credentials from database
    const gmailUser = await getSettingValue('gmail_user') || process.env.GMAIL_USER;
    const gmailAppPassword = await getSettingValue('gmail_app_password') || process.env.GMAIL_APP_PASSWORD;
    const fromName = await getSettingValue('newsletter_from_name') || 'Hundoja';
    const adminNotificationEnabled = (await getSettingValue('admin_notification_enabled')) === 'true';

    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json(
        { error: 'Email service not configured. Please configure Gmail settings in admin dashboard.' },
        { status: 500 }
      );
    }

    // Gmail configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    // Email to admin (you)
    const adminMailOptions = {
      from: gmailUser,
      to: gmailUser, // Send to yourself
      subject: `🔥 New Newsletter Subscription - ${fromName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #000; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; font-size: 24px; margin: 0;">${fromName.toUpperCase()}</h1>
            <p style="color: #999; margin: 5px 0;">New Newsletter Subscription</p>
          </div>
          
          <div style="background: #111; padding: 20px; border-radius: 8px; border-left: 4px solid #00d4ff;">
            <h2 style="color: #00d4ff; margin-top: 0;">New Subscriber!</h2>
            <p style="color: #fff; font-size: 16px; margin: 10px 0;">
              <strong>Email:</strong> ${email}
            </p>
            <p style="color: #999; font-size: 14px; margin: 10px 0;">
              <strong>Subscribed:</strong> ${new Date().toLocaleString()}
            </p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #0a0a0a; border-radius: 8px;">
            <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
              This email was sent from your ${fromName} website newsletter signup form.
            </p>
          </div>
        </div>
      `,
    };

    // Welcome email to subscriber
    const subscriberMailOptions = {
      from: gmailUser,
      to: email,
      subject: `🔥 Welcome to ${fromName} - You're In!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #000; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #fff; font-size: 28px; margin: 0;">${fromName.toUpperCase()}</h1>
            <p style="color: #00d4ff; margin: 5px 0; font-size: 16px;">Welcome to the Family</p>
          </div>
          
          <div style="background: #111; padding: 30px; border-radius: 12px; text-align: center;">
            <h2 style="color: #fff; margin-top: 0;">🎉 You're officially part of the ${fromName} community!</h2>
            <p style="color: #ccc; font-size: 16px; line-height: 1.6;">
              Get ready for exclusive drops, behind-the-scenes content, and early access to our latest streetwear collections.
            </p>
          </div>
          
          <div style="margin: 20px 0; padding: 20px; background: #0a0a0a; border-radius: 8px;">
            <h3 style="color: #00d4ff; margin-top: 0;">What's Next?</h3>
            <ul style="color: #ccc; padding-left: 20px;">
              <li>🔥 Early access to new drops</li>
              <li>💰 Exclusive subscriber discounts</li>
              <li>👕 Style guides and lookbooks</li>
              <li>📦 First dibs on limited releases</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'}/products" 
               style="display: inline-block; background: #00d4ff; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Shop Latest Drops
            </a>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background: #0a0a0a; border-radius: 8px; text-align: center;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              You're receiving this because you signed up for our newsletter at ${fromName.toLowerCase()}.com<br>
              Don't want these emails? <a href="#" style="color: #00d4ff;">Unsubscribe</a>
            </p>
          </div>
        </div>
      `,
    };

    // Send emails (conditionally send admin notification)
    const emailPromises = [transporter.sendMail(subscriberMailOptions)];
    
    if (adminNotificationEnabled) {
      emailPromises.push(transporter.sendMail(adminMailOptions));
    }

    await Promise.all(emailPromises);

    // Create notification for new newsletter subscription
    try {
      await supabase
        .from('notifications')
        .insert({
          type: 'new_customer',
          title: 'New Newsletter Subscription',
          message: `A new subscriber, ${fromName}, has joined the newsletter`,
          icon_name: 'UserPlus',
          icon_color: 'text-green-400',
          metadata: {
            email: email,
            subscriber_name: fromName,
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