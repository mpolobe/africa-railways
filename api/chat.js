// AI Chat endpoint for Vercel serverless functions

const AI_SYSTEM_PROMPT = `You are the Africa Railways AI Assistant, a helpful and knowledgeable guide for the Africa Railways platform.

You help users with:
- Booking train tickets across African railway networks (TAZARA, Zambia Railways, PRASA, Kenya Railways)
- Understanding ticket classes (First Class, Second Class, Economy)
- Tracking their journeys and checking train schedules
- Managing their digital wallet (AFC tokens, SENT tokens, AFRC tokens)
- Understanding NFT ticket souvenirs and how to collect them
- Navigating the dashboard and platform features
- General questions about African railways and travel tips

Key information:
- AFC (Africa Coin) is on the SUI blockchain - addresses are auto-generated
- SENT and AFRC tokens are on Polygon and require manual wallet connection
- Users can book tickets, view their journey history, and collect NFT souvenirs
- The platform supports phone login (OTP), Google, and Facebook authentication

Be friendly, concise, and helpful. If you don't know something specific about a user's account, guide them to the appropriate section of the dashboard or suggest contacting support.`;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { messages } = req.body;
  
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: 'AI service not configured' });
  }
  
  try {
    // Convert messages to OpenAI format
    const openaiMessages = [
      { role: 'system', content: AI_SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role,
        content: m.parts ? m.parts.map(p => p.text).join('') : m.content
      }))
    ];
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        stream: true
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', response.status, errorText);
      return res.status(500).json({ 
        error: 'AI service error', 
        status: response.status,
        details: process.env.NODE_ENV === 'development' ? errorText : undefined
      });
    }
    
    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              res.write(`data: ${JSON.stringify({ type: 'text-delta', delta })}\n\n`);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
    
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
}
