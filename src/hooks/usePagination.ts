import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
  itemsPerPage?: number;
}

export function usePagination<T>(items: T[], options: UsePaginationOptions = {}) {
  const { itemsPerPage = 10 } = options;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    handlePageChange,
    resetPage,
    totalItems: items.length,
    itemsPerPage,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, items.length),
  };
}
