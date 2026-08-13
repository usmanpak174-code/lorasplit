import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';
import './index.css';

// 1000% PAKKA FIX: Replit ka link ignore kar diya. 
// Khali string ("") ka matlab hai yeh auto usi website (Vercel) ka link use karega.
setBaseUrl("");

createRoot(document.getElementById('root')!).render(<App />);