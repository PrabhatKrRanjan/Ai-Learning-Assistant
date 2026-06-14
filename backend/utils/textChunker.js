/**
 * Split text into chunks for better processing
 * @params {String} text - Full text to be chunked
 * @params {Number} chunkSize - Target size per chunk (in words)
 * @params {Number} overlap - Number of words to overlap between chunks
 * @returns {Array<{content: string, chunkIndex: number, pageNumber: number}>} - An array of text chunks
 */
export const chunkText = (text, chunkSize = 500, overlap = 50) => {
    if (!text || typeof text !== 'string') {
        return [];
    }

    // Clean text while preserving paragraphs structure
    const cleanedText = text
    .replace(/\r\n/g, '\n') // Normalize newlines
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .replace(/\n /g, '\n') // Remove spaces at the start of lines
    .replace(/ \n/g, '\n') // Remove spaces at the end of lines
    .trim();

    // Try to split by paragraphs (single or double newlines)
    const paragraphs = cleanedText.split('\n\n').filter(p => p.trim());

    const chunks = [];
    let currentChunk = [];
    let currentWordCount = 0;
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
        const paragraphWords = paragraph.trim().split(/\s+/);
        const paragraphWordCount = paragraphWords.length;

        // If adding this paragraph exceeds the chunk size, finalize the current chunk
        if (paragraphWordCount > chunkSize) {
            if (currentChunk.length > 0) {
                chunks.push({
                    content: currentChunk.join('\n\n'),
                    chunkIndex: chunkIndex++,
                    pageNumber: 0,
                });
                currentChunk = [];
                currentWordCount = 0;
            }

            // Split large paragraph inot word-based chunks
            for (let i = 0; i < paragraphWordCount; i += chunkSize - overlap) {
                const chunkWords = paragraphWords.slice(i, i + chunkSize);
                chunks.push({
                    content: chunkWords.join(' '),
                    chunkIndex: chunkIndex++,
                    pageNumber: 0,
                });

                if (i + chunkSize >= paragraphWords.length) break;
            }
            continue;
        } 

        // if adding this paragraph exceeds the chunk size, save current chunk
        if (currentWordCount + paragraphWordCount > chunkSize && currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.join('\n\n'),
                chunkIndex: chunkIndex++,
                pageNumber: 0,
            });

            // Create orlap from previous chunk
            const prevChunkText = currentChunk.join(' ');
            const prevWords = prevChunkText.split(/\s+/);
            const overlapText = prevWords.slice(-Math.min(overlap, prevWords.length)).join(' ');
            currentChunk = [overlapText, paragraph.trim()];
            currentWordCount = overlapText.split(/\s+/).length + paragraphWordCount;
        } else {
            // Add paragraph to current chunk
            currentChunk.push(paragraph.trim());
            currentWordCount += paragraphWordCount;
        }
    }

    // Add the last chunk if it has content
    if (currentChunk.length > 0) {
        chunks.push({
            content: currentChunk.join('\n\n'),
            chunkIndex,
            pageNumber: 0,
        });
    }

    // Fallback: If no chunks created, split by words
    if (chunks.length === 0 && cleanedText.length > 0) {
        const allWords = cleanedText.split(/\s+/);
        for (let i = 0; i < allWords.length; i += chunkSize - overlap) {
            const chunkWords = allWords.slice(i, i + chunkSize);
            chunks.push({
                content: chunkWords.join(' '),
                chunkIndex: chunkIndex++,
                pageNumber: 0,
            });

            if (i + chunkSize >= allWords.length) break;
        }
    }

    return chunks;
};

/**
 *  Find relevant chunks based on keywords matching
 * @param {Array<Object>} chunks - Array of text chunks
 * @params {String} query - The search query
 * @params {number} maxChunks - Maximum chunks to return
 * @returns {Array<{Object}>}
 */
export const findRelevantChunks = (chunks, query, maxChunks = 3) => {
    if (!chunks || chunks.length === 0 || !query ) {
        return [];
    };

    // Common stop words to exclude
    const stopWords = new Set([
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
        'in', 'with', 'to', 'for', 'of', 'as', 'by', 'this', 'that', 'it',
    ]);

    // Extract keywords from query
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

    if (queryWords.length === 0) {
        // Return clean chunk objects without mongoose metadata
        return chunks.slice(0, maxChunks).map(chunk => ({
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber,
            _id: chunk._id || undefined,
        }));
    }

    const scoreChunk = chunks.map((chunk, index) => {
        const content = chunk.content.toLowerCase();
        const contentWords = content.split(/\s+/).length;
        let score = 0;
    
        // Score each query word
        for (const word of queryWords) {
            // Exact word match (higher score)
            const exactMatches = (content.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length
            score += exactMatches * 3;
    
            // Partical match (lower score)
            const partialMatches = (content.match(new RegExp(word, 'g')) || []).length
            score += Math.max(0, partialMatches - exactMatches) * 1.5;
        }
    
        // Bonus: Multiple query words found
        const uniqueWordsFound = queryWords.filter(word => content.includes(word)).length;
        if(uniqueWordsFound > 1) {
            score += uniqueWordsFound * 2;
        }
    
        // Normalize by content length
        const normalizedScore = score / Math.sqrt(contentWords)
    
        // Small bonus for eqaelier chunks
        const positionBonus = 1 - (index / chunks.length) * 0.1;
    
        // Return clean object without Mongoose matadata
        return {
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber,
            _id: chunk._id,
            score: normalizedScore * positionBonus,
            rawScore: score,
            matchedWords: uniqueWordsFound
        };
    });
    
    return scoreChunk
    .filter(chunk => chunk.score > 0)
    .sort((a, b) => {
        if (b.score - a.score) {
            return b.score - a.score;
        }
        if (b.matchedWords !== a.matchedWords) {
            return b.matchedWords - a.matchedWords;
        }
        return a.chunkIndex - b.chunkIndex;
    })
    .slice(0, maxChunks);
};
