// send-quote.js
// Fetches a random motivational quote and sends it via Meta's WhatsApp Cloud API,
// using an approved template with one variable for the quote text.
//
// Requires four environment variables:
//   WHATSAPP_TOKEN     - permanent System User access token
//   PHONE_NUMBER_ID    - from the API Setup page in your Meta app
//   MY_WHATSAPP_TO     - your number, e.g. "919812345678" (no + or spaces)
//   TEMPLATE_NAME      - the name you gave your approved template, e.g. "motivational_quote"

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const TO = process.env.MY_WHATSAPP_TO;
const TEMPLATE_NAME = process.env.TEMPLATE_NAME;
const LANGUAGE_CODE = "en_US"; // must match the language you set when creating the template

if (!TOKEN || !PHONE_NUMBER_ID || !TO || !TEMPLATE_NAME) {
  console.error("Missing one of: WHATSAPP_TOKEN, PHONE_NUMBER_ID, MY_WHATSAPP_TO, TEMPLATE_NAME");
  process.exit(1);
}

async function getQuote() {
  // Try ZenQuotes first
  try {
    const res = await fetch("https://zenquotes.io/api/random");
    const data = await res.json();
    const { q, a } = data[0];
    return `"${q}" — ${a}`;
  } catch (err) {
    console.error("ZenQuotes failed, trying DummyJSON.", err);
  }

  // Fallback: DummyJSON
  try {
    const res = await fetch("https://dummyjson.com/quotes/random");
    const data = await res.json();
    return `"${data.quote}" — ${data.author}`;
  } catch (err) {
    console.error("DummyJSON failed too, using hardcoded fallback.", err);
  }

  // Last-resort hardcoded fallback
  return "The best time to start was yesterday. The next best time is now.";
}

async function sendWhatsApp(quoteText) {
  const url = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to: TO,
    type: "template",
    template: {
      name: TEMPLATE_NAME,
      language: { code: LANGUAGE_CODE },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: quoteText }],
        },
      ],
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Meta API error:", JSON.stringify(data, null, 2));
    process.exit(1);
  }
  console.log("Sent. Message ID:", data.messages?.[0]?.id);
}

(async () => {
  const quote = await getQuote();
  console.log("Sending quote:", quote);
  await sendWhatsApp(quote);
})();
