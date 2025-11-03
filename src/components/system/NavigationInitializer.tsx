/**
 * Navigation Initializer Component
 * Initializes pwaNavigationService with React Router's navigate function
 * Must be rendered inside BrowserRouter
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pwaNavigationService } from '@/services/pwaNavigationService';

export const NavigationInitializer = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize pwaNavigationService with React Router's navigate function
    pwaNavigationService.setNavigate(navigate);
  }, [navigate]);

  return null; // This component doesn't render anything
};


