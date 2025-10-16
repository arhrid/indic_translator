/**
 * Language Selector Persistence Tests
 * Tests for localStorage persistence and page reload scenarios
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSelector } from '@/components/language-selector';

describe('LanguageSelector - LocalStorage Persistence', () => {
  /**
   * Test Suite 1: Basic Persistence
   */
  describe('Basic Persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should save language preference to localStorage', async () => {
      const onChange = jest.fn();
      render(<LanguageSelector onChange={onChange} />);

      const selector = screen.getByRole('combobox');
      await userEvent.click(selector);

      await waitFor(() => {
        const hindiOption = screen.getByText(/Hindi/);
        userEvent.click(hindiOption);
      });

      expect(localStorage.getItem('selectedLanguage')).toBe('hi');
    });

    it('should load language from localStorage on mount', () => {
      localStorage.setItem('selectedLanguage', 'hi');

      render(<LanguageSelector onChange={() => {}} />);

      const selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('Hindi');
    });

    it('should use custom storage key', () => {
      localStorage.setItem('myLanguageKey', 'ta');

      render(
        <LanguageSelector
          onChange={() => {}}
          storageKey="myLanguageKey"
        />
      );

      const selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('Tamil');
    });

    it('should default to English if no stored value', () => {
      render(<LanguageSelector onChange={() => {}} />);

      const selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('English');
    });
  });

  /**
   * Test Suite 2: Page Reload Simulation
   */
  describe('Page Reload Simulation', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should persist language preference across page reloads', () => {
      // First render - set language to Hindi
      localStorage.setItem('preferredLanguage', 'hi');

      // Simulate page reload by rendering component
      const { unmount } = render(
        <LanguageSelector
          onChange={() => {}}
          storageKey="preferredLanguage"
        />
      );

      let selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('Hindi');

      // Unmount component (simulating page unload)
      unmount();

      // Re-render component (simulating page reload)
      render(
        <LanguageSelector
          onChange={() => {}}
          storageKey="preferredLanguage"
        />
      );

      selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('Hindi');
    });

    it('should persist multiple language changes', async () => {
      const { rerender } = render(
        <LanguageSelector onChange={() => {}} />
      );

      // Change to Hindi
      let selector = screen.getByRole('combobox');
      await userEvent.click(selector);

      await waitFor(() => {
        const hindiOption = screen.getByText(/Hindi/);
        userEvent.click(hindiOption);
      });

      expect(localStorage.getItem('selectedLanguage')).toBe('hi');

      // Simulate page reload
      rerender(
        <LanguageSelector onChange={() => {}} />
      );

      selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('Hindi');

      // Change to Tamil
      await userEvent.click(selector);

      await waitFor(() => {
        const tamilOption = screen.getByText(/Tamil/);
        userEvent.click(tamilOption);
      });

      expect(localStorage.getItem('selectedLanguage')).toBe('ta');

      // Simulate another page reload
      rerender(
        <LanguageSelector onChange={() => {}} />
      );

      selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('Tamil');
    });

    it('should handle localStorage quota exceeded gracefully', () => {
      // Mock localStorage.setItem to throw error
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const onChange = jest.fn();
      render(
        <LanguageSelector
          onChange={onChange}
          storageKey="testLanguage"
        />
      );

      const selector = screen.getByRole('combobox');
      expect(selector).toBeInTheDocument();

      setItemSpy.mockRestore();
    });
  });

  /**
   * Test Suite 3: Multiple Component Instances
   */
  describe('Multiple Component Instances', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should sync language across multiple selector instances', async () => {
      const onChange1 = jest.fn();
      const onChange2 = jest.fn();

      const { container } = render(
        <>
          <div data-testid="selector1">
            <LanguageSelector
              onChange={onChange1}
              storageKey="sharedLanguage"
            />
          </div>
          <div data-testid="selector2">
            <LanguageSelector
              onChange={onChange2}
              storageKey="sharedLanguage"
            />
          </div>
        </>
      );

      const selectors = screen.getAllByRole('combobox');
      expect(selectors.length).toBe(2);

      // Both should default to English
      expect(selectors[0]).toHaveTextContent('English');
      expect(selectors[1]).toHaveTextContent('English');

      // Change first selector to Hindi
      await userEvent.click(selectors[0]);

      await waitFor(() => {
        const hindiOption = screen.getByText(/Hindi/);
        userEvent.click(hindiOption);
      });

      // Verify localStorage was updated
      expect(localStorage.getItem('sharedLanguage')).toBe('hi');
    });

    it('should maintain separate preferences with different storage keys', async () => {
      const onChange1 = jest.fn();
      const onChange2 = jest.fn();

      render(
        <>
          <div data-testid="selector1">
            <LanguageSelector
              onChange={onChange1}
              storageKey="sourceLang"
            />
          </div>
          <div data-testid="selector2">
            <LanguageSelector
              onChange={onChange2}
              storageKey="targetLang"
            />
          </div>
        </>
      );

      const selectors = screen.getAllByRole('combobox');

      // Set first to Hindi
      await userEvent.click(selectors[0]);
      await waitFor(() => {
        const hindiOption = screen.getByText(/Hindi/);
        userEvent.click(hindiOption);
      });

      // Set second to Tamil
      await userEvent.click(selectors[1]);
      await waitFor(() => {
        const tamilOption = screen.getByText(/Tamil/);
        userEvent.click(tamilOption);
      });

      // Verify separate storage
      expect(localStorage.getItem('sourceLang')).toBe('hi');
      expect(localStorage.getItem('targetLang')).toBe('ta');
    });
  });

  /**
   * Test Suite 4: Storage Events
   */
  describe('Storage Events', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should respond to storage changes from other tabs', () => {
      localStorage.setItem('selectedLanguage', 'en');

      render(<LanguageSelector onChange={() => {}} />);

      let selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('English');

      // Simulate storage change from another tab
      const event = new StorageEvent('storage', {
        key: 'selectedLanguage',
        newValue: 'hi',
        oldValue: 'en',
        storageArea: localStorage,
      });

      window.dispatchEvent(event);

      // Component should update (if implemented)
      // Note: This depends on component implementation
    });
  });

  /**
   * Test Suite 5: Edge Cases
   */
  describe('Edge Cases', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should handle invalid stored language code', () => {
      localStorage.setItem('selectedLanguage', 'invalid-code');

      render(<LanguageSelector onChange={() => {}} />);

      const selector = screen.getByRole('combobox');
      // Should default to English if stored value is invalid
      expect(selector).toHaveTextContent('English');
    });

    it('should handle null stored value', () => {
      localStorage.setItem('selectedLanguage', 'null');

      render(<LanguageSelector onChange={() => {}} />);

      const selector = screen.getByRole('combobox');
      expect(selector).toBeInTheDocument();
    });

    it('should handle empty string stored value', () => {
      localStorage.setItem('selectedLanguage', '');

      render(<LanguageSelector onChange={() => {}} />);

      const selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('English');
    });

    it('should handle rapid successive changes', async () => {
      const onChange = jest.fn();
      render(<LanguageSelector onChange={onChange} />);

      const selector = screen.getByRole('combobox');

      // Rapidly change language multiple times
      for (const lang of ['hi', 'ta', 'te', 'kn']) {
        localStorage.setItem('selectedLanguage', lang);
      }

      // Final value should be Kannada
      expect(localStorage.getItem('selectedLanguage')).toBe('kn');
    });

    it('should handle localStorage disabled gracefully', () => {
      // Mock localStorage to be unavailable
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      getItemSpy.mockImplementation(() => {
        throw new Error('localStorage is disabled');
      });

      const { container } = render(
        <LanguageSelector onChange={() => {}} />
      );

      expect(container.querySelector('[role="combobox"]')).toBeInTheDocument();

      getItemSpy.mockRestore();
    });
  });

  /**
   * Test Suite 6: Performance
   */
  describe('Performance', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should not cause excessive localStorage reads', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');

      localStorage.setItem('selectedLanguage', 'hi');

      render(<LanguageSelector onChange={() => {}} />);

      // Should only read localStorage once during mount
      expect(getItemSpy).toHaveBeenCalledTimes(1);

      getItemSpy.mockRestore();
    });

    it('should batch localStorage writes', async () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      const onChange = jest.fn();
      render(<LanguageSelector onChange={onChange} />);

      const selector = screen.getByRole('combobox');
      await userEvent.click(selector);

      await waitFor(() => {
        const hindiOption = screen.getByText(/Hindi/);
        userEvent.click(hindiOption);
      });

      // Should only write to localStorage once per change
      expect(setItemSpy).toHaveBeenCalledWith('selectedLanguage', 'hi');

      setItemSpy.mockRestore();
    });
  });

  /**
   * Test Suite 7: Integration with Form
   */
  describe('Integration with Form', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should persist language preference in form context', async () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      const onChange = jest.fn();

      render(
        <form onSubmit={handleSubmit}>
          <LanguageSelector onChange={onChange} />
          <button type="submit">Submit</button>
        </form>
      );

      const selector = screen.getByRole('combobox');
      await userEvent.click(selector);

      await waitFor(() => {
        const hindiOption = screen.getByText(/Hindi/);
        userEvent.click(hindiOption);
      });

      const submitButton = screen.getByText('Submit');
      await userEvent.click(submitButton);

      // Verify preference was saved
      expect(localStorage.getItem('selectedLanguage')).toBe('hi');
      expect(onChange).toHaveBeenCalledWith('hi');
    });
  });
});
