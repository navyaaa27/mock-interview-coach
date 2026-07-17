const testEmail = async () => {
  const url = 'https://oymtdxfzsccgczlqluud.supabase.co/functions/v1/send-email';
  const anonKey = 'sb_publishable_FiWYCPSJayBZgs1pSHJlRw_vNFlrujd';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: 'onboarding@resend.dev', // Default testing email
        subject: 'Test Email from Supabase Edge Function',
        html: '<p>If you are reading this, the edge function successfully reached Resend and dispatched the email!</p>',
        user_id: null,
        email_type: 'test_setup'
      })
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err);
  }
};

testEmail();
