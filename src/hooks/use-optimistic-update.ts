import { useState, useCallback, useRef } from 'react';

interface OptimisticUpdate<T> {
  data: T;
  isOptimistic: boolean;
  rollback?: () => void;
}

export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>
) {
  const [state, setState] = useState<OptimisticUpdate<T>>({
    data: initialData,
    isOptimistic: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Swiggy 2025: Use ref for previous data to avoid useCallback dependency on state
  const previousDataRef = useRef<T>(initialData);
  const currentDataRef = useRef<T>(initialData);

  // Swiggy 2025: Update ref when state changes (for rollback)
  useEffect(() => {
    currentDataRef.current = state.data;
  }, [state.data]);

  const update = useCallback(async (optimisticData: T) => {
    // Store previous data for rollback
    previousDataRef.current = currentDataRef.current;
    
    // Apply optimistic update immediately using functional update
    setState(prev => ({
      data: optimisticData,
      isOptimistic: true,
      rollback: () => setState({
        data: previousDataRef.current,
        isOptimistic: false
      })
    }));

    setIsLoading(true);
    setError(null);

    try {
      // Perform actual update
      const result = await updateFn(optimisticData);
      
      // Replace optimistic data with server response using functional update
      setState(prev => ({
        data: result,
        isOptimistic: false
      }));
      
      return result;
    } catch (err) {
      // Rollback on error
      const error = err instanceof Error ? err : new Error('Update failed');
      setError(error);
      
      setState(prev => ({
        data: previousDataRef.current,
        isOptimistic: false
      }));
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateFn]);

  const rollback = useCallback(() => {
    if (state.rollback) {
      state.rollback();
    }
  }, [state.rollback]);

  return {
    data: state.data,
    isOptimistic: state.isOptimistic,
    isLoading,
    error,
    update,
    rollback
  };
}

// Hook for optimistic list operations
export function useOptimisticList<T extends { id: string | number }>(
  initialItems: T[],
  {
    create,
    update,
    remove
  }: {
    create?: (item: T) => Promise<T>;
    update?: (item: T) => Promise<T>;
    remove?: (id: string | number) => Promise<void>;
  }
) {
  const [items, setItems] = useState(initialItems);
  const [optimisticOperations, setOptimisticOperations] = useState<Set<string | number>>(new Set());

  const addOptimistic = useCallback(async (newItem: T) => {
    if (!create) throw new Error('Create function not provided');

    // Add optimistically
    setItems(prev => [newItem, ...prev]);
    setOptimisticOperations(prev => new Set(prev).add(newItem.id));

    try {
      const result = await create(newItem);
      
      // Replace optimistic item with server response
      setItems(prev => prev.map(item => 
        item.id === newItem.id ? result : item
      ));
    } catch (error) {
      // Remove on error
      setItems(prev => prev.filter(item => item.id !== newItem.id));
      throw error;
    } finally {
      setOptimisticOperations(prev => {
        const next = new Set(prev);
        next.delete(newItem.id);
        return next;
      });
    }
  }, [create]);

  const updateOptimistic = useCallback(async (updatedItem: T) => {
    if (!update) throw new Error('Update function not provided');

    const previousItem = items.find(item => item.id === updatedItem.id);
    if (!previousItem) return;

    // Update optimistically
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
    setOptimisticOperations(prev => new Set(prev).add(updatedItem.id));

    try {
      const result = await update(updatedItem);
      
      // Replace with server response
      setItems(prev => prev.map(item => 
        item.id === updatedItem.id ? result : item
      ));
    } catch (error) {
      // Rollback on error
      setItems(prev => prev.map(item => 
        item.id === updatedItem.id ? previousItem : item
      ));
      throw error;
    } finally {
      setOptimisticOperations(prev => {
        const next = new Set(prev);
        next.delete(updatedItem.id);
        return next;
      });
    }
  }, [items, update]);

  const removeOptimistic = useCallback(async (id: string | number) => {
    if (!remove) throw new Error('Remove function not provided');

    const itemToRemove = items.find(item => item.id === id);
    if (!itemToRemove) return;

    // Remove optimistically
    setItems(prev => prev.filter(item => item.id !== id));
    setOptimisticOperations(prev => new Set(prev).add(id));

    try {
      await remove(id);
    } catch (error) {
      // Restore on error
      setItems(prev => [itemToRemove, ...prev]);
      throw error;
    } finally {
      setOptimisticOperations(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [items, remove]);

  return {
    items,
    optimisticOperations,
    addOptimistic,
    updateOptimistic,
    removeOptimistic,
    isOptimistic: (id: string | number) => optimisticOperations.has(id)
  };
}