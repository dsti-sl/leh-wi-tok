import { useEffect, useState } from 'react';

interface UseSearchParams<T> {
  data: T[];
  searchKey: keyof T; // The key in the data object to filter by
  debounceDelay?: number; // Optional debounce delay
}

const useSearch = <T>({
  data,
  searchKey,
  debounceDelay = 300,
}: UseSearchParams<T>) => {
  const [query, setQuery] = useState(''); // State for the search query
  const [filteredData, setFilteredData] = useState<T[]>(data); // State for the filtered data

  /**
   * Fuzzy search logic.
   * @param query - The search input string.
   * @param data - The dataset to filter.
   * @returns {T[]} - The filtered dataset.
   */
  const performFuzzySearch = (query: string, data: T[]): T[] => {
    const lowerQuery = query.toLowerCase();
    return data
      .filter((item) =>
        String(item[searchKey]).toLowerCase().includes(lowerQuery),
      ) // Filter by substring match
      .sort((a, b) => {
        const aMatch = String(a[searchKey])
          .toLowerCase()
          .startsWith(lowerQuery);
        const bMatch = String(b[searchKey])
          .toLowerCase()
          .startsWith(lowerQuery);
        return aMatch === bMatch ? 0 : aMatch ? -1 : 1; // Prioritize exact matches
      });
  };

  useEffect(() => {
    if (!Array.isArray(data)) {
      console.error('useSearch: Expected "data" to be an array.');
      setFilteredData([]);
      return;
    }

    const debounce = setTimeout(() => {
      if (query === '') {
        setFilteredData(data); // Reset to full dataset if query is empty
      } else {
        setFilteredData(performFuzzySearch(query, data)); // Perform the search
      }
    }, debounceDelay);

    return () => clearTimeout(debounce); // Cleanup on unmount or query change
  }, [query, data, debounceDelay]);

  return {
    query,
    setQuery,
    filteredData,
  };
};

export default useSearch;
