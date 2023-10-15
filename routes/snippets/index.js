import { createSnippet, createSnippetWithAI, deleteSnippet, getAllSnippets, getMySnippets, getSnippetById } from "../../controllers/snippet/snippetController.js";
import { isAuthenticated } from '../../middleware/auth/protected.js';
import { Router } from 'express';

const router = Router();

router.post('/create', isAuthenticated, createSnippet);
router.post('/create-ai', isAuthenticated, createSnippetWithAI);
router.get('/all', getAllSnippets);
router.get('/me', isAuthenticated, getMySnippets);
router.get('/:id', getSnippetById);

router.delete('/delete/:shortcut', isAuthenticated, deleteSnippet);

export default router;
