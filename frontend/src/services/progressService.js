import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

/**
 * Get user learning dashboard statistics
 */
const getDashboardData = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.PROGRESS.GET_DASHBOARD);
        return response.data.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch dashboard data. Please try again." };
    }
};

const progressService = {
    getDashboardData
};

export default progressService;
