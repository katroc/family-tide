import {  useState,
  useEffect,
  useCallback,
  useRef,
  RefObject
} from 'react';
import { uiLogger } from '../utils/logger';

import { AddressSuggestion } from '../utils/addressUtils';

export interface AddressAutocompleteConfig {
  minQueryLength?: number;
  debounceMs?: number;
  fetchSuggestions?: (query: string) => Promise<AddressSuggestion[]>;
}

export interface UseAddressAutocompleteReturn {
  suggestions: AddressSuggestion[];
  isLoading: boolean;
  showSuggestions: boolean;
  currentAddressInput: string;
  suggestionsContainerRef: RefObject<HTMLDivElement>;
  addressInputRef: RefObject<HTMLInputElement>;
  handleAddressInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSuggestionClick: (suggestion: AddressSuggestion, formatter?: (suggestion: AddressSuggestion, userInput: string) => string) => string;
  setShowSuggestions: (value: boolean) => void;
  setCurrentAddressInput: (value: string) => void;
  clearSuggestions: () => void;
}

const defaultFetchSuggestions = async (query: string): Promise<AddressSuggestion[]> => {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`);
  if (!response.ok) {
    throw new Error('Failed to fetch address suggestions');
  }
  return response.json() as Promise<AddressSuggestion[]>;
};

export function useAddressAutocomplete(
  initialValue: string = '',
  config: AddressAutocompleteConfig = {}
): UseAddressAutocompleteReturn {
  const {
    minQueryLength = 3,
    debounceMs = 750,
    fetchSuggestions = defaultFetchSuggestions
  } = config;

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentAddressInput, setCurrentAddressInput] = useState(initialValue);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  const requestSuggestions = useCallback(async (query: string) => {
    if (query.length < minQueryLength) {
      clearSuggestions();
      return;
    }
    setIsLoading(true);
    try {
      const results = await fetchSuggestions(query);
      const validSuggestions = results.filter(s => s.address);
      setSuggestions(validSuggestions);
      setShowSuggestions(validSuggestions.length > 0);
    } catch (error) {
      uiLogger.error('Failed to fetch address suggestions:', error);
      clearSuggestions();
    } finally {
      setIsLoading(false);
    }
  }, [fetchSuggestions, minQueryLength, clearSuggestions]);

  const handleAddressInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setCurrentAddressInput(newValue);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (newValue.trim() === '') {
      clearSuggestions();
      return;
    }

    debounceTimeoutRef.current = window.setTimeout(() => requestSuggestions(newValue), debounceMs);
  }, [debounceMs, requestSuggestions, clearSuggestions]);

  const handleSuggestionClick = useCallback((suggestion: AddressSuggestion, formatter?: (suggestion: AddressSuggestion, userInput: string) => string) => {
    const value = formatter ? formatter(suggestion, currentAddressInput) : suggestion.display_name;
    setCurrentAddressInput(value);
    clearSuggestions();
    return value;
  }, [currentAddressInput, clearSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsContainerRef.current &&
        !suggestionsContainerRef.current.contains(event.target as Node) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  return {
    suggestions,
    isLoading,
    showSuggestions,
    currentAddressInput,
    suggestionsContainerRef,
    addressInputRef,
    handleAddressInputChange,
    handleSuggestionClick,
    setShowSuggestions,
    setCurrentAddressInput,
    clearSuggestions
  };
}
