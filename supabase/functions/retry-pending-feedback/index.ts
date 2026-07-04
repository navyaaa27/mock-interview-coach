import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || ''
const GEMINI_MODEL = 'gemini-2.5-flash'

const FEEDBACK_SYSTEM_PROMPT = `You are an expert interview coach evaluating candidate answers.
Return ONLY a valid JSON object with no markdown fences. The object must have:
{
  "overall_score": <1-10 integer>,
  "clarity_score": <1-10 integer>,
  "depth_score": <1-10 integer>,
  "structure_score": <1-10 integer>,
  "feedback_text": "<2-3 sentence coaching paragraph>",
  "model_answer": "<ideal answer in 2-3 sentences>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area 1>", "<area 2>"],
  "company_fit": {}
}`

async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
      })
    })

    if (response.status === 429) {
      if (attempt < 3) {
        const delay = 3000 * attempt
        console.log(`Gemini 429, waiting ${delay}ms before attempt ${attempt + 1}`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      throw new Error(`Gemini rate limited after 3 attempts`)
    }

    if (!response.ok) throw new Error(`Gemini ${response.status}`)

    const result = await response.json()
    return result.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }
  throw new Error('Gemini: max retries exceeded')
}

function parseFeedback(raw: string) {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1) throw new Error('No JSON object found')
  return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1))
}

const safeInt = (val: unknown) =>
  typeof val === 'number' && val >= 1 && val <= 10 ? val : 5

const safeStr = (val: unknown, fallback: string) =>
  typeof val === 'string' && (val as string).trim().length > 0 ? val as string : fallback

Deno.serve(async (req) => {
  // Only allow POST (pg_cron will POST to this)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  console.log('🔄 retry-pending-feedback: Starting...')

  try {
    // Find all pending feedback rows created in the last 2 hours
    const { data: pendingRows, error: fetchErr } = await supabase
      .from('feedback')
      .select(`
        id,
        answer_id,
        generation_status,
        created_at,
        answers!inner (
          id,
          question_text,
          answer_text,
          session_id,
          sessions!inner (
            interview_type,
            difficulty,
            job_role
          )
        )
      `)
      .eq('generation_status', 'pending_retry')
      .gt('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .limit(20)

    if (fetchErr) throw fetchErr

    if (!pendingRows || pendingRows.length === 0) {
      console.log('✅ No pending feedback rows found.')
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${pendingRows.length} pending feedback rows`)
    let successCount = 0
    let failCount = 0

    for (const row of pendingRows) {
      try {
        const answer = row.answers as any
        const session = answer?.sessions as any

        const questionText = answer?.question_text || 'Interview question'
        const answerText = answer?.answer_text || '(no answer provided)'
        const interviewType = session?.interview_type || 'behavioral'
        const experienceLevel = session?.difficulty || 'medium'

        const userMessage = `Question: ${questionText}\nAnswer: ${answerText}\nInterview type: ${interviewType}\nExperience level: ${experienceLevel}\nEvaluate the answer and return only a JSON object.`

        const rawResponse = await callGemini(FEEDBACK_SYSTEM_PROMPT, userMessage)
        let feedbackData: any = {}

        try {
          feedbackData = parseFeedback(rawResponse)
        } catch {
          // Try with simpler prompt
          const retryMsg = `Respond ONLY with a JSON object starting with { and ending with }. No markdown.\n\n${userMessage}`
          const rawRetry = await callGemini(FEEDBACK_SYSTEM_PROMPT, retryMsg)
          feedbackData = parseFeedback(rawRetry)
        }

        // Update the feedback row with real scores
        const { error: updateErr } = await supabase
          .from('feedback')
          .update({
            overall_score: safeInt(feedbackData.overall_score),
            clarity_score: safeInt(feedbackData.clarity_score),
            depth_score: safeInt(feedbackData.depth_score),
            structure_score: safeInt(feedbackData.structure_score),
            feedback_text: safeStr(feedbackData.feedback_text, 'Feedback generated by retry.'),
            model_answer: safeStr(feedbackData.model_answer, 'Model answer generated by retry.'),
            strengths: feedbackData.strengths || [],
            improvements: feedbackData.improvements || [],
            company_fit: feedbackData.company_fit || {},
            generation_status: 'complete'
          })
          .eq('id', row.id)

        if (updateErr) {
          console.error(`Failed to update feedback ${row.id}:`, updateErr.message)
          failCount++
        } else {
          console.log(`✅ Retried feedback ${row.id} — score: ${feedbackData.overall_score}/10`)
          successCount++
        }

        // Small delay between calls to avoid rate limits
        await new Promise(r => setTimeout(r, 1500))

      } catch (err) {
        console.error(`Failed to retry feedback ${row.id}:`, err)
        failCount++
      }
    }

    return new Response(
      JSON.stringify({ processed: pendingRows.length, success: successCount, failed: failCount }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('retry-pending-feedback error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
