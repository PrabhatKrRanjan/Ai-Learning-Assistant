import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

/**
 * Get all quizzes for a specific document
 */
const getQuizzesForDocument = async (documentId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.QUIZZES.GET_QUIZZES_FOR_DOC(documentId));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch quizzes for this document." };
    }
};

/**
 * Get a specific quiz by ID
 */
const getQuizById = async (id) => {
    try {
        const response = await axiosInstance.get(API_PATHS.QUIZZES.GET_QUIZ_BY_ID(id));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch quiz details." };
    }
};

/**
 * Submit a quiz with answers
 */
const submitQuiz = async (id, answers) => {
    try {
        const response = await axiosInstance.post(API_PATHS.QUIZZES.SUBMIT_QUIZ(id), { answers });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to submit quiz." };
    }
};

/**
 * Get quiz results
 */
const getQuizResults = async (quizId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.QUIZZES.GET_QUIZ_RESULTS(quizId));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch quiz results." };
    }
};

/**
 * Delete a quiz
 */
const deleteQuiz = async (id) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.QUIZZES.DELETE_QUIZ(id));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to delete quiz." };
    }
};

const quizService = {
    getQuizzesForDocument,
    getQuizById,
    submitQuiz,
    getQuizResults,
    deleteQuiz
};

export default quizService;