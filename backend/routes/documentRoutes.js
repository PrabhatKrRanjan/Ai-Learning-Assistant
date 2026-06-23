import express from 'express';
import { uploadDocument, getDocuments, getDocument, deleteDocument } from '../controllers/documentControllers.js'
import protect from '../middleware/auth.js';
import upload from '../config/multer.js'

const router = express.Router();

// All routes will be protected
router.use(protect);

router.post('/upload', upload.single('file'), uploadDocument)
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);

export default router;