import { useQuery } from '@tanstack/react-query';

export const useCategories = (searchTerm: string) => {
  return useQuery({
    queryKey: ['frontend-categories', searchTerm],
    queryFn: async () => {
      const response = await fetch(`/api/categories?search=${searchTerm}`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const result = await response.json();
      // Adjust based on your API response structure (e.g., result.data)
      return result.data || result; 
    },
  });
};