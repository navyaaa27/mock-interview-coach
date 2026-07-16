import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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

async function callGemini(systemPrompt: string, userMessage: string, isRetry = false): Promise<string> {
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
      const err = new Error(`Gemini rate limited after 3 attempts`)
      ;(err as any).isRateLimit = true
      throw err
    }

    if (!response.ok) {
      if (attempt < 3 && response.status >= 500) {
        await new Promise(r => setTimeout(r, 1500 * attempt))
        continue
      }
      throw new Error(`Gemini ${response.status}`)
    }

    const result = await response.json()
    return result.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }
  throw new Error('Gemini: max retries exceeded')
}

function parseFeedback(raw: string) {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1) {
    return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1))
  }
  return JSON.parse(cleaned)
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { answer_id, metrics } = await req.json()
    if (!answer_id) throw new Error("Missing answer_id")

    // Fetch answer, question, session, and profile
    const { data: answer, error: ansErr } = await supabase
      .from('answers')
      .select('*, sessions(interview_type, experience_level, user_id), questions(question_text)')
      .eq('id', answer_id)
      .single()

    if (ansErr || !answer) throw new Error("Answer not found: " + (ansErr?.message || ''))

    const session = answer.sessions
    const questionText = answer.custom_question_text || answer.questions?.question_text || 'Unknown question'
    const answerText = answer.answer_text

    // Fetch user profile to get target companies
    const { data: profile } = await supabase
      .from('profiles')
      .select('target_companies')
      .eq('user_id', session.user_id)
      .single()

    let kvString = 'standard tech values'
    if (profile?.target_companies && profile.target_companies.length > 0) {
      // Find matching company profile
      const target = profile.target_companies[0]
      const { data: companyProfile } = await supabase
        .from('company_profiles')
        .select('key_values')
        .ilike('company_name', target)
        .maybeSingle()
      
      if (companyProfile?.key_values) {
        kvString = companyProfile.key_values.join(', ')
      }
    }

    const userMessage = `Question: ${questionText}\nAnswer: ${answerText || '(no answer provided)'}\nInterview type: ${session.interview_type || 'behavioral'}\nExperience level: ${session.experience_level || 'mid'}\nEvaluate the answer against these company key values for the company_fit object: ${kvString}`

    let feedbackData: any = null
    let isRateLimited = false

    try {
      const rawResponse = await callGemini(FEEDBACK_SYSTEM_PROMPT, userMessage)
      feedbackData = parseFeedback(rawResponse)
    } catch (firstErr: any) {
      if (firstErr.isRateLimit) {
        isRateLimited = true
      } else {
        console.warn(`First parse failed for answer ${answer_id}:`, firstErr.message)
        try {
          const retryMessage = `You must respond with ONLY a valid JSON object. No markdown. No explanation. Start your response with { and end with }. Here is the answer to evaluate:\n\n${userMessage}`
          const rawRetry = await callGemini(FEEDBACK_SYSTEM_PROMPT, retryMessage, true)
          feedbackData = parseFeedback(rawRetry)
        } catch (retryErr: any) {
          if (retryErr.isRateLimit) {
            isRateLimited = true
          } else {
            console.error(`Second parse failed. Using safe defaults.`)
          }
        }
      }
    }

    const metricsData = metrics ? {
      filler_word_count: metrics.filler_word_count,
      filler_words_found: metrics.filler_words_found,
      words_per_minute: metrics.words_per_minute,
      answer_duration_seconds: metrics.answer_duration_seconds,
      pace_rating: metrics.pace_rating,
      eye_contact_percent: metrics.eye_contact_percent,
      eye_contact_rating: metrics.eye_contact_rating
    } : {}

    if (isRateLimited) {
      const { error: pendingErr } = await supabase.from('feedback').insert({
        answer_id: answer_id,
        overall_score: null,
        clarity_score: null,
        depth_score: null,
        structure_score: null,
        feedback_text: 'Feedback is being generated — please check back in a few minutes.',
        model_answer: null,
        company_fit: {},
        generation_status: 'pending_retry',
        ...metricsData
      })
      if (pendingErr) console.error("pending_retry insert failed", pendingErr)
      
      return new Response(JSON.stringify({ status: 'pending_retry' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!feedbackData) feedbackData = {}
    const safeInt = (val: any) => (typeof val === 'number' && val >= 1 && val <= 10) ? val : 5
    const safeStr = (val: any, fallback: string) => (typeof val === 'string' && val.trim().length > 0) ? val : fallback
    
    const { error: feedbackErr } = await supabase.from('feedback').insert({
      answer_id: answer_id,
      overall_score: safeInt(feedbackData.overall_score),
      clarity_score: safeInt(feedbackData.clarity_score),
      depth_score: safeInt(feedbackData.depth_score),
      structure_score: safeInt(feedbackData.structure_score),
      feedback_text: safeStr(feedbackData.feedback_text, "Feedback could not be generated for this answer."),
      model_answer: safeStr(feedbackData.model_answer, "Model answer unavailable."),
      company_fit: feedbackData.company_fit || {},
      generation_status: 'complete',
      ...metricsData
    })

    if (feedbackErr) throw new Error("feedback insert failed: " + feedbackErr.message)

    return new Response(JSON.stringify({ status: 'complete', score: safeInt(feedbackData.overall_score) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('generate-feedback error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
