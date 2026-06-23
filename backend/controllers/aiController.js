import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import ChatHistory from '../models/ChatHistory.js';
import * as geminiService from '../utils/geminiService.js';
import { findRelevantChunks } from '../utils/textChunker.js';

/**
 * @desc    Flashcards from document
 * @route   POST /api/ai/generate-flashcards
 * @access  Private
 */
export const generateFlashcards = async (req, res, next) => {
  try {
    const { documentId, count = 10 } = req.body;

    if (!documentId) {
        return res.status(400).json({ 
            success: false,
            error: 'Please provide documentId',
            statusCode: 400,
        });
    }
    const document = await Document.findById({
        _id: documentId,
        userId: req.user._id,
        status: 'ready'
    });
 
     if (!documentId) {
        return res.status(404).json({ 
            success: false,
            error: 'Document not found',
            statusCode: 404,
        });
    }
        
    // Generate flashcards using Gemini
    const cards = await geminiService.generateFlashcards(document.extractedText, parseInt(count));

    // Save to database
    const flashcardSet = await Flashcard.create({
        userId: req.user._id,
        documentId: document._id,
        cards: cards.map(card => ({
            question: card.question,
            answer: card.answer,
            difficulty: card.difficulty,
            reviewCount: 0,
            isStarred: false,
        }))
    });

    res.status(201).json({
      success: true,
      message: "Flashcard created successfully",
      data: flashcardSet
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Quiz from document
 * @route   POST /api/ai/generate-quiz
 * @access  Private
 */
export const generateQuiz = async (req, res, next) => {
  try {
    const { documentId, numQuestions = 10, title } = req.body;

    if (!documentId) {
        return res.status(400).json({ 
            success: false,
            error: 'Please provide documentId',
            statusCode: 400,
        });
    }

    const document = await Document.findById(documentId);
    if (!document) {
        return res.status(404).json({ 
            success: false,
            error: 'Document not found',
            statusCode: 404
        });
    }

    // Generate quiz using Gemini
    const questions = await geminiService.generateQuiz(document.extractedText, parseInt(numQuestions));

    // Save to database
    const quiz = await Quiz.create({
        userId: req.user._id,
        documentId: document._id,
        title: title || `${document.title} - Quiz`,
        questions: questions,
        totalQuestions: questions.length,
        userAnswers: [],
        score: 0,
    });

    res.status(201).json({
      success: true,
      data: quiz,
      message: "Quiz generated successfully"
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate Document Summary
 * @route POST /api/ai/generate-summary
 * @access Private
 */
export const generateSummary = async (req, res, next) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
        return res.status(400).json({
            success: false,
            error: 'Please provide documentId',
            statusCode: 400
        });
    };

    const document = await Document.findOne({
        _id: documentId,
        userId: req.user._id,
        status: 'ready'
    });

    if (!document) {
        return res.status(404).json({
            success: false,
            error: 'Document not found or not ready',
            statusCode: 404
        });
    }

    // Generate summary using Gemini API
    const summary = await geminiService.generateSummary(document.extractedText || document.text);

    // Optionally update document with summary
    // await Document.findByIdAndUpdate(documentId, { summary });

    res.status(200).json({
        success: true,
        data: {
            documentId: document._id,
            title: document.title,
            summary
        },
        message: "Summary generated successfully"
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Chat with AI about document
 * @route POST /api/ai/chat
 * @access Private
 */
export const chat = async (req, res, next) => {
  try {
    const { documentId, question } = req.body;
    if (!documentId || !question) {
        return res.status(400).json({
            success: false,
            error: 'Please provide documentId and question',
            statusCode: 400
        });
    };

    const document = await Document.findOne({
        _id: documentId,
        userId: req.user._id,
        status: 'ready',
    });
    if (!document) {
        return res.status(404).json({
            success: false,
            error: 'Document not found',
            statusCode: 404,
        });
    }

    // Find relevant chunks for better context
    const relevantChunks = await findRelevantChunks(document.chunks, question, 3);
    const chunkIndices = relevantChunks.map(c => c.chunkIndices)

    // Get or create chat history
    let chatHistory = await ChatHistory.findOne({
        userId: req.user._id,
        documentId: document._id,
    });

    if (!chatHistory) {
        chatHistory = await ChatHistory.create({
            userId: req.user._id,
            documentId: document._id,
            messages: [],
        })
    }

    // Generate response using Gemini
    const answer = await geminiService.chatWithContext(question, relevantChunks);

    // Save conversation
    chatHistory.messages.push(
        {
            role: 'user',
            content: question,
            timestamp: new Date(),
            relevantChunks: [],
        },
        {
            role: 'assistant',
            content: answer,
            timestamp: new Date(),
            relevantChunks: chunkIndices
        }
    );

    await chatHistory.save()

    res.status(200).json({
      success: true,
      data: {
        question,
        answer,
        relevantChunks: chunkIndices,
        chatHistoryId: chatHistory._id
      },
      message: 'Response generated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Explain a concept from document
 * @route POST /api/ai/explain-concept
 * @access Private
 */
export const explainConcept = async (req, res, next) => {
  try {
    const { documentId, concept } = req.body;
    if (!documentId || !concept) {
        return res.status(400).json({
            success: false,
            error: 'Please provide documentId and concept',
            statusCode: 400
        });
    };

    const document = await Document.findOne({
        _id: documentId,
        userId: req.user._id,
        status: 'ready',
    });
    if (!document) {
        return res.status(404).json({
            success: false,
            error: 'Document not found',
            statusCode: 404,
        });
    }

    // Find relevent chunks for the concept
    const relevantChunks = findRelevantChunks(document.chunks, concept, 3);
    const context = relevantChunks.map(c => c.content).join('\n\n');

    // Generate explanation using Gemini
    const explanation = await geminiService.explainConcept(concept, context);

    res.status(200).json({
        success: true,
        data: {
            concept,
            explanation,
            relevantChunks: relevantChunks.map(c => c.chunkIndex),
        },
        message: "Explanation generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get chat history for a document
 * @route GET /api/ai/chat-history/:documentId
 * @access Private
 */
export const getChatHistory = async (req, res, next) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
        return res.status(400).json({
            success: false,
            error: 'Please provide documentId',
            statusCode: 400
        });
    };

    // Finding chat history and selecting meessages
    const chatHistory = await ChatHistory.findOne({
      userId: req.user._id,
      documentId: documentId,
    }).select('messages'); // Ony retrive the messages array

    console.log('chatHistory------>>>', chatHistory)

    if (!chatHistory) {
        return res.status(200).json({
            success: true,
            data: [], // Return an empty array if no chat history found
            message: "No chat history found for this documents"
        });
    }

    res.status(200).json({
      success: true,
      data: chatHistory.messages,
      message: "Chat history retrived successful"
    });
  } catch (error) {
    next(error);
  }
};