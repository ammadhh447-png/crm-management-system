import { useMemo, useState, useCallback } from 'react';

export const useBulkSelection = (items, getId = (item) => item._id) => {
  const [selectedIds, setSelectedIds] = useState([]);

  const itemIds = useMemo(() => items.map(getId), [items, getId]);

  const allSelected = items.length > 0 && selectedIds.length === items.length;

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(allSelected ? [] : itemIds);
  }, [allSelected, itemIds]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const pruneSelection = useCallback((validIds) => {
    setSelectedIds((prev) => prev.filter((id) => validIds.includes(id)));
  }, []);

  return {
    selectedIds,
    selectedCount: selectedIds.length,
    allSelected,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
    pruneSelection,
    setSelectedIds,
  };
};
