import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (!process.env.GEMINI_API_KEY) {
    console.error('FATAL ERROR: GEMINI_API_KEY is not set in the environment variable');
    process.exit(1);
}

/**
 * Generate flashcards from text
 * @params {string} text - Document text
 * @params {number} count - Number of flashcards to generate 
 * @returns {Promise<Array<{question: string, answer: string, difficulty: string}>>}
 */
export const generateFlashcards = async (text, count = 10) => {
    const prompt = `Generate exactly ${count} educational flashcards from the following text.
    Format each flashcard as:
    Q: [Clear, specific question]
    A: [Concise, accurate answer]
    D: [Difficulty level: easy, medium, or hard]

    Separate each flashcards with "---"

    Text:
    ${text.substring(0, 15000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",           // Changed to stable model
            contents: prompt,
        });

        const generatedText = response.text || "";

        const flashcards = [];
        const cards = generatedText.split("---").filter((c) => c.trim().length > 0);

        for (const card of cards) {
            const lines = card.trim().split("\n");
            let question = "",
                answer = "",
                difficulty = "medium";

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith("Q:")) {
                    question = trimmed.substring(2).trim();
                } else if (trimmed.startsWith("A:")) {
                    answer = trimmed.substring(2).trim();
                } else if (trimmed.startsWith("D:")) {
                    const diff = trimmed.substring(2).trim().toLowerCase();
                    if (["easy", "medium", "hard"].includes(diff)) {
                        difficulty = diff;
                    }
                }
            }

            if (question && answer) {
                flashcards.push({ question, answer, difficulty });
            }
        }

        return flashcards.slice(0, count);
    } catch (error) {
        console.error("Gemini API error (generateFlashcards):", error);
        throw new Error("Failed to generate flashcards");
    }
}

/**
 * Generate quiz questions
 * @params {string} text - Document text
 * @params {number} numQuestions - Number of questions
 * @returns {Promise<Array<{question: string, options: Array, correctAnswers: string, explanation: string, difficulty: string }>>}
 */
export const generateQuiz = async (text, numQuestions = 5) => {
    const prompt = `Generate exactly ${numQuestions} multiple choice questions from the following text.
    Format each question as:
    Q: [Question]
    Q1: [Option 1]
    Q2: [Option 2]
    Q3: [Option 3]
    Q4: [Option 4]
    C: [Correct option, exactly written above]
    E: [Brief explanation]
    D: [Difficulty level: easy, medium, or hard]

    Separate each question with "---"

    Text:
    ${text.substring(0, 15000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const generatedText = response.text || "";

        const questions = [];
        const questionBlocks = generatedText.split("---").filter(c => c.trim().length > 0);

        for (const block of questionBlocks) {
            const lines = block.trim().split('\n');
            let question = '', options = [], correctAnswer = '', explanation = '', difficulty = 'medium';

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('Q:')) {
                    question = trimmed.substring(2).trim();
                } else if (trimmed.match(/^Q[1-4]:/)) {
                    options.push(trimmed.substring(3).trim());
                } else if (trimmed.startsWith('C:')) {
                    correctAnswer = trimmed.substring(2).trim();
                } else if (trimmed.startsWith('E:')) {
                    explanation = trimmed.substring(2).trim();
                } else if (trimmed.startsWith('D:')) {
                    const diff = trimmed.substring(2).trim().toLowerCase();
                    if (['easy', 'medium', 'hard'].includes(diff)) {
                        difficulty = diff;
                    }
                }
            }

            if (question && options.length >= 2 && correctAnswer) {
                questions.push({ question, options, correctAnswer, explanation, difficulty });
            }
        }

        return questions.slice(0, numQuestions);
    } catch (error) {
        console.error('Gemini API error (generateQuiz):', error);
        throw new Error('Failed to generate quiz');
    }
}

/**
 * Generate document summary
 * @params {string} text - Document text
 * @returns {Promise<string>}
 */
export const generateSummary = async (text) => {
    const prompt = `Provide a concise summary of the following text highlighted the key concepts, main idea, and important points.
    Keep the summary clear and structured.

    Text:
    ${text.substring(0, 20000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const generatedResponse = response.text || "";
        return generatedResponse;
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to generate summary');
    }
}

/**
 * Chat with document context
 * @params {string} question - User question
 * @params {Array<Object>} chunks - Relevant document chunks
 * @returns {Promise<string>}
 */
export const chatWithContext = async (question, chunks) => {
    const content = chunks.map((c, i) => `[Chunk ${i + 1}]\n${c.content || c}`).join('\n\n');
    const prompt = `Based on the following context from a document, analyse the context and answer the user's question.
    If the answer is not in the context, say so.

    Context:
    ${content}

    Question: ${question}

    Answer:`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        console.log('response-------->>>>>>>>>', response);
        const generatedText = response.text || "";
        return generatedText;
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to process chat request');
    }
}

/**
 * Explain a specific concept
 * @params {string} concept - Concept to explain
 * @params {string} context - Relevant context
 * @returns {Promise<string>}
 */
export const explainConcept = async (concept, context) => {
    const prompt = `Explain the concept of "${concept}" based on the following context.
    Provide a clear, educational explanation that's easy to understand.
    Include example if relevant.

    Context:
    ${context.substring(0, 10000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const generatedText = response.text || "";
        return generatedText;
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to explain concept');
    }
};