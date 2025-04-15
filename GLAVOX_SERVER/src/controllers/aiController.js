require("dotenv").config();
const express = require("express");
const router = express.Router();
const { SpeechClient } = require('@google-cloud/speech');
const { textToSpeech, speakWithPolly } = require("./speechController");
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

// Validate and initialize Gemini API
let genAI;
let model;
try {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
    });
} catch (error) {
    console.error('❌ Gemini API initialization error:', error.message);
    // Continue without Gemini API - the app will use alternative methods
}

const generationConfig = {
    temperature: 0.7,
    topP: 0.85,
    topK: 40,
    maxOutputTokens: 2048,
};

const speechClient = new SpeechClient();

// 🎙 Speech-to-text (Local Mic Mode)
const transcribeAudio = async (audioBuffer) => {
    try {
        const request = {
            audio: {
                content: audioBuffer.toString('base64'),
            },
            config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: 'en-US',
            },
        };

        const [response] = await speechClient.recognize(request);
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        return transcription;
    } catch (error) {
        console.error('Speech recognition error:', error);
        throw error;
    }
};

// 🤖 Updated Gemini-based AI Chat Function with Enhanced Context Handling
const chatWithAI = async (userText, conversationHistory = []) => {
    try {
        // Format conversation history for Gemini with enhanced context
        const formattedHistory = conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const chatSession = model.startChat({
            generationConfig: {
                ...generationConfig,
                temperature: 0.7, // Reduced for more consistent responses
                topP: 0.85, // Adjusted for better context retention
            },
            history: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `You are an advanced talkative response generator, your name is "FRIDAY", who is best in talking  about real worldproblems and many more thing don't say you are an assistant, with excellent memory and context understanding. Always remember you giving the response like you are giving reply in voice and do not use any special characters or emojis in your response it should be humanised. Follow these guidelines:

1. CONVERSATION CONTEXT:
- Actively maintain and reference the conversation history
- Use previous messages to understand the current context
- If a user refers to something mentioned earlier, acknowledge and build upon it
- Track topics and themes across the conversation
- If context is unclear, reference specific earlier points in the conversation

2. RESPONSE STYLE:
- Respond in a natural,humanised conversational tone
- Keep responses concise but contextually relevant
- Maintain consistent personality throughout the conversation
- Use appropriate emotion and empathy based on context
- Speak in first person ("I remember you mentioned..." or "As we discussed...")

3. MEMORY MANAGEMENT:
- Remember key details from earlier in the conversation
- Reference specific points from previous messages when relevant
- If user contradicts earlier statements, politely note the change
- Track user preferences and adapt responses accordingly
- Maintain topic continuity unless user clearly changes subject

4. LANGUAGE HANDLING:
- Respond only in English but if anyone speaks in any other language you should respond in english and also you should remember the previous conversation and respond to the user in the English language.
- Also If someone uses hinglish you should respond in english but make sure you sould tell the user that this is the way you can pronounce the sentence in english what you said in hinglish. or anyother language.
- Try to solve the problems like Grammar, Spelling, Punctuation, etc in a way that is not obvious.
- If user sends non-English text, reply: "Sorry, I can only respond in English"
- For unclear messages, ask for clarification while referencing context
- Fix grammar/spelling internally without mentioning corrections
- Handle profanity by responding: "Let's keep our conversation respectful"

5. RESPONSE FORMAT:
- Keep responses under 100 characters
- Be direct and specific
- Don't use labels or prefixes
- Include relevant context from previous messages
- Format: [contextual response incorporating previous knowledge]

Remember: You're having a continuous conversation, not isolated exchanges. Each response should flow naturally from previous context.`,
                        },
                    ],
                },
                {
                    role: "model",
                    parts: [
                        {
                            text: `Understood. I'll maintain conversation context and provide contextually relevant, concise responses.`,
                        },
                    ],
                },
                ...formattedHistory
            ],
        });

        const result = await chatSession.sendMessage(userText);
        const reply = result.response.text();

        return reply || "No response from Gemini";
    } catch (error) {
        console.error("❌ Gemini Error:", error.message);
        return "AI response error";
    }
};

// 🚀 Route: POST /process-speech
router.post("/process-speech", async (req, res) => {
    const userSpeech = req.body.text;
    console.log("🎤 Received:", userSpeech);

    const aiReply = await chatWithAI(userSpeech);
    console.log("🤖 AI:", aiReply);

    if (!aiReply) return res.status(500).json({ error: "AI response not received" });

    const audioUrl = await speakWithPolly(aiReply);

    res.json({
        response: aiReply,
        audioUrl: audioUrl,
    });
});

// 🎧 Optional Route for Local Testing
const startConversation = async (req, res) => {
    try {
        const userSpeech = await transcribeAudio(Buffer.from(req.body.audio));
        if (!userSpeech) return res.status(400).send("No speech detected.");

        const aiResponse = await chatWithAI(userSpeech);
        const audioStream = await textToSpeech(aiResponse);

        res.set({
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store, no-cache, must-revalidate, private",
        });
        res.send(audioStream);
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).send("Error processing request");
    }
};

module.exports = {
    router,
    startConversation,
    chatWithAI,
    transcribeAudio,
};