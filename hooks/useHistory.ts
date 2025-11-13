
import { useState, useCallback } from 'react';

// A custom hook to manage state with undo/redo capabilities.
export const useHistory = <T>(initialState: T) => {
  const [history, setHistory] = useState<{
    past: T[];
    present: T;
    future: T[];
  }>({
    past: [],
    present: initialState,
    future: [],
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  /**
   * Updates the state and adds the previous state to the history.
   * This is for actions that should be undoable.
   */
  const set = useCallback((newStateFn: (currentState: T) => T) => {
    setHistory(currentHistory => {
      const newPresent = newStateFn(currentHistory.present);
      // Avoid adding to history if state is identical
      if (JSON.stringify(newPresent) === JSON.stringify(currentHistory.present)) {
          return currentHistory;
      }
      return {
        past: [...currentHistory.past, currentHistory.present],
        present: newPresent,
        future: [],
      };
    });
  }, []);
  
  /**
   * Updates the present state without creating a new history entry.
   * This accepts a partial state and merges it into the current present state.
   * Useful for background updates that shouldn't be undoable actions.
   */
  const updatePresent = useCallback((newPresentPartial: Partial<T>) => {
    setHistory(currentHistory => {
        const newPresent = { ...currentHistory.present, ...newPresentPartial };
         if (JSON.stringify(newPresent) === JSON.stringify(currentHistory.present)) {
          return currentHistory;
        }
        return { ...currentHistory, present: newPresent };
    });
  }, []);


  const undo = useCallback(() => {
    if (!canUndo) return;
    setHistory(currentHistory => {
      const previous = currentHistory.past[currentHistory.past.length - 1];
      const newPast = currentHistory.past.slice(0, currentHistory.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [currentHistory.present, ...currentHistory.future],
      };
    });
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    setHistory(currentHistory => {
      const next = currentHistory.future[0];
      const newFuture = currentHistory.future.slice(1);
      return {
        past: [...currentHistory.past, currentHistory.present],
        present: next,
        future: newFuture,
      };
    });
  }, [canRedo]);
  
  /**
   * Resets the history to a new initial state.
   */
  const reset = useCallback((newInitialState: T) => {
    setHistory({
        past: [],
        present: newInitialState,
        future: [],
    });
  }, []);

  return { state: history.present, set, updatePresent, undo, redo, canUndo, canRedo, reset };
};
