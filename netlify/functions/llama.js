const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    let message = "Say something intelligent.";
    if (event.body) {
      const body = JSON.parse(event.body);
      if (body.message) {
        message = body.message;
      }
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct',  // ✅ LLAMA TIME!
        messages: [
          { role: 'user', content: message }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    // ✅ FIXED JSON PARSING WITH ERROR HANDLING
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const textResponse = await response.text();
      console.log('Raw OpenRouter response (non-JSON):', textResponse);
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          error: `OpenRouter returned non-JSON response: ${textResponse}` 
        })
      };
    }

    console.log('OpenRouter Llama Response:', JSON.stringify(data, null, 2));

    if (!response.ok || data.error) {
      console.error('OpenRouter Llama API Error:', JSON.stringify(data, null, 2));
      return {
        statusCode: response.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: data })
      };
    }

    // ✅ STANDARD RESPONSE PARSING (Llama uses standard format)
    let finalText;
    if (data?.choices?.[0]?.message?.content && data.choices[0].message.content.trim() !== "") {
      finalText = data.choices[0].message.content;
      console.log('SUCCESS: Using content field');
    } else {
      finalText = `Response received - investigating format: ${JSON.stringify(data, null, 2)}`;
      console.log('DEBUG: Unknown format detected');
    }
    
    // ✅ FORMAT TEXT WITH PROPER LINE BREAKS
    finalText = finalText
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: [{
          type: "text",
          text: finalText
        }]
      })
    };

  } catch (error) {
    console.error('Llama Function Error:', error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: error.toString() })
    };
  }
};
