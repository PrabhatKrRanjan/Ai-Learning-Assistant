import fs from 'fs/promises';
// Import CanvasFactory BEFORE pdf-parse (This fixes DOMMatrix error)
import { CanvasFactory } from 'pdf-parse/worker';
import { PDFParse } from 'pdf-parse';

/**
 * Extract text from PDF file
 * @params {String} filePath - Path to PDF file
 * @returns {Promise<{text: String, numPages: number}>}
 */

// export const extractTextFromPDF = async (filePath) => {
//     try {
//         const dataBuffer = await fs.readFile(filePath);
//         // pdf-parse expects a Unit*Arry, not a Buffer
//         const parser = new PDFParse(new Uint8Array(dataBuffer))
//         const data = await parser.getText();

//         return {
//             text: data.text,
//             numPages: data.numPages,
//             info: data.info,
//         };
//     } catch (error) {
//         console.error("PDF parsing error:", error);
//         throw new Error("Failed to extract text from PDF")
//     }
// };


/**
 * Extract text from PDF file
 * @param {string} filePath - Path to PDF file
 */
export const extractTextFromPDF = async (filePath) => {
    let parser = null;

    try {
        const dataBuffer = await fs.readFile(filePath);
        // Correct initialization with CanvasFactory
        parser = new PDFParse({ data: dataBuffer,  CanvasFactory});
        const result = await parser.getText();

        return {
            text: result.text,
            numPages: result.numPages ?? result.total ?? 0,
            info: result.info,
        };
    } catch (error) {
        console.error("PDF parsing error:", error);
        throw new Error("Failed to extract text from PDF: " + error.message);
    } finally {
        if (parser) {
            await parser.destroy().catch(() => {});
        }
    }
};

