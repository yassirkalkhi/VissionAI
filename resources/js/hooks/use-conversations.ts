import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create a cache outside the hook to persist across renders
let conversationsCache: any[] = [];
let isLoading = false;

const useConversations = () => {
  const [conversations, setConversations] = useState(conversationsCache);
  const [loading, setLoading] = useState(isLoading);

  const fetchConversations = async () => {
    // If we already have cached data and we're not loading, return early
    if (conversationsCache.length > 0 && !isLoading) {
      setConversations(conversationsCache);
      return;
    }

    try {
      isLoading = true;
      setLoading(true);
      const response = await axios.get('/api/conversations');
      conversationsCache = response.data;
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to fetch conversations');
    } finally {
      isLoading = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return { conversations, loading, fetchConversations };
};

export default useConversations; 