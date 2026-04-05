/**
 * Multi-Provider AI Service with Automatic Fallback
 * Tries multiple AI providers in order until one succeeds
 */

interface AIResponse {
  summary: string;
  success: boolean;
  provider: string;
}

/**
 * Generate lecture summary using Groq (Free & Fast)
 */
async function generateWithGroq(prompt: string): Promise<AIResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey || apiKey === 'your_groq_key_here') {
    throw new Error('Groq API key not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', // Fast and free
      messages: [
        {
          role: 'system',
          content: 'You are an educational assistant helping students catch up on missed lectures. Provide clear, concise summaries.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    summary: data.choices[0].message.content,
    success: true,
    provider: 'Groq',
  };
}

/**
 * Generate lecture summary using Hugging Face (Free)
 */
async function generateWithHuggingFace(prompt: string): Promise<AIResponse> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey || apiKey === 'your_hf_token_here') {
    throw new Error('Hugging Face API key not configured');
  }

  const response = await fetch(
    'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    summary: data[0].generated_text,
    success: true,
    provider: 'Hugging Face',
  };
}

/**
 * Fallback: Simple template-based summary (no API needed)
 */
function generateFallbackSummary(studentName: string, topic: string): AIResponse {
  return {
    summary: `Dear ${studentName},

You missed today's class on ${topic}.

Key Topics Covered:
- Introduction to ${topic}
- Core concepts and principles
- Practical applications and examples
- Important formulas and techniques

Please review your course materials and textbook for detailed information on these topics. 
Reach out to your instructor during office hours if you have any questions.

Study Tips:
- Review the lecture slides
- Complete the assigned readings
- Practice the example problems
- Form a study group with classmates

Best regards,
Recovery Engine Team`,
    success: true,
    provider: 'Fallback Template',
  };
}

/**
 * Main function: Try multiple providers with automatic fallback
 */
export async function generateLectureSummary(
  studentName: string,
  topic: string,
  content: string
): Promise<AIResponse> {
  const prompt = `Create a concise lecture summary for a student who missed class.

Student: ${studentName}
Topic: ${topic}

Lecture Content:
${content}

Please provide:
1. A brief overview of the main concepts
2. Key points and definitions
3. Important examples or formulas
4. Study recommendations

Keep it educational, clear, and around 300 words.`;

  // Try providers in order: Groq → Hugging Face → Fallback
  const providers = [
    { name: 'Groq', fn: () => generateWithGroq(prompt) },
    { name: 'Hugging Face', fn: () => generateWithHuggingFace(prompt) },
  ];

  for (const provider of providers) {
    try {
      console.log(`Trying ${provider.name}...`);
      const result = await provider.fn();
      console.log(`✓ ${provider.name} succeeded`);
      return result;
    } catch (error) {
      console.error(`✗ ${provider.name} failed:`, error instanceof Error ? error.message : error);
      continue;
    }
  }

  // All APIs failed, use fallback
  console.log('All AI providers failed, using fallback template');
  return generateFallbackSummary(studentName, topic);
}
