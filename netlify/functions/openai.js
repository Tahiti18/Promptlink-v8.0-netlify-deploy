const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  try {
    let message = "Say something intelligent.";
    if (event.body) {
      const body = JSON.parse(event.body);
      if (body.message) {
        message = body.message;
      }
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4-turbo", // Update to gpt-4o when available
        messages: [
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 4096 // Higher limit for better responses
      })
    });

    const data = await response.json();
    console.log("ChatGPT 4.1 Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("OpenAI API Error:", JSON.stringify(data, null, 2));
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

    // ✅ FORMAT TEXT WITH PROPER LINE BREAKS (matching Claude/MiniMax)
    let finalText = data?.choices?.[0]?.message?.content || "No response received";
    
    finalText = finalText
      .replace(/\n\n/g, '</p><p>')  // Double line breaks = new paragraphs
      .replace(/\n/g, '<br>')       // Single line breaks = <br>
      .replace(/^/, '<p>')          // Start with paragraph
      .replace(/$/, '</p>');        // End with paragraph

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

  } catch (err) {
    console.error("OpenAI Function Error:", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: err.toString() })
    };
  }
};
