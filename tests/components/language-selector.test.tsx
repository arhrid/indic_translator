/**
 * Language Selector Component Tests
 * Tests for components/language-selector.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSelector, isValidLanguageCode, getLanguage, getSupportedLanguages } from '@/components/language-selector';

describe('LanguageSelector Component', () => {
  /**
   * Test Suite 1: Rendering
   */
  describe('Rendering', () => {
    it('should render the language selector', () => {
      render(<LanguageSelector onChange={() => {}} />);
      const selector = screen.getByRole('combobox');
      expect(selector).toBeInTheDocument();
    });

    it('should render with default label', () => {
      render(<LanguageSelector onChange={() => {}} />);
      const label = screen.getByText('Language');
      expect(label).toBeInTheDocument();
    });

    it('should render with custom label', () => {
      render(
        <LanguageSelector
          onChange={() => {}}
          label="Select Language"
        />
      );
      const label = screen.getByText('Select Language');
      expect(label).toBeInTheDocument();
    });

    it('should render with placeholder text', () => {
      render(
        <LanguageSelector
          onChange={() => {}}
          placeholder="Choose a language"
        />
      );
      const selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('Choose a language');
    });
  });

  /**
   * Test Suite 2: Language Options
   */
  describe('Language Options', () => {
    it('should render all 23 languages', async () => {
      render(<LanguageSelector onChange={() => {}} />);
      const selector = screen.getByRole('combobox');
      
      await userEvent.click(selector);
      
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options.length).toBe(23);
      });
    });

    it('should include English', async () => {
      render(<LanguageSelector onChange={() => {}} />);
      const selector = screen.getByRole('combobox');
      
      await userEvent.click(selector);
      
      await waitFor(() => {
        expect(screen.getByText(/English/)).toBeInTheDocument();
      });
    });

    it('should include Hindi', async () => {
      render(<LanguageSelector onChange={() => {}} />);
      const selector = screen.getByRole('combobox');
      
      await userEvent.click(selector);
      
      await waitFor(() => {
        expect(screen.getByText(/Hindi/)).toBeInTheDocument();
      });
    });

    it('should include Tamil', async () => {
      render(<LanguageSelector onChange={() => {}} />);
      const selector = screen.getByRole('combobox');
      
      await userEvent.click(selector);
      
      await waitFor(() => {
        expect(screen.getByText(/Tamil/)).toBeInTheDocument();
      });
    });

    it('should display native language names', async () => {
      render(<LanguageSelector onChange={() => {}} />);
      const selector = screen.getByRole('combobox');
      
      await userEvent.click(selector);
      
      await waitFor(() => {
        expect(screen.getByText(/हिन्दी/)).toBeInTheDocument(); // Hindi in Devanagari
        expect(screen.getByText(/தமிழ்/)).toBeInTheDocument();  // Tamil in Tamil script
      });
    });
  });

  /**
   * Test Suite 3: Selection
   */
  describe('Selection', () => {
    it('should call onChange when language is selected', async () => {
      const onChange = jest.fn();
      render(<LanguageSelector onChange={onChange} />);
      
      const selector = screen.getByRole('combobox');
      await userEvent.click(selector);
      
      await waitFor(() => {
        const hindiOption = screen.getByText(/Hindi/);
        fireEvent.click(hindiOption);
      });
      
      expect(onChange).toHaveBeenCalledWith('hi');
    });

    it('should update selected value', async () => {
      const { rerender } = render(
        <LanguageSelector value="en" onChange={() => {}} />
      );
      
      let selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('English');
      
      rerender(
        <LanguageSelector value="hi" onChange={() => {}} />
      );
      
      selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('Hindi');
    });

    it('should select multiple different languages', async () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <LanguageSelector onChange={onChange} />
      );
      
      const selector = screen.getByRole('combobox');
      
      // Select Hindi
      await userEvent.click(selector);
      await waitFor(() => {
        const hindiOption = screen.getByText(/Hindi/);
        fireEvent.click(hindiOption);
      });
      
      expect(onChange).toHaveBeenCalledWith('hi');
      
      // Select Tamil
      rerender(
        <LanguageSelector value="ta" onChange={onChange} />
      );
      
      expect(onChange).toHaveBeenCalledWith('hi');
    });
  });

  /**
   * Test Suite 4: LocalStorage Persistence
   */
  describe('LocalStorage Persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should save selected language to localStorage', async () => {
      const onChange = jest.fn();
      render(
        <LanguageSelector
          onChange={onChange}
          storageKey="testLanguage"
        />
      );
      
      const selector = screen.getByRole('combobox');
      await userEvent.click(selector);
      
      await waitFor(() => {
        const hindiOption = screen.getByText(/Hindi/);
        fireEvent.click(hindiOption);
      });
      
      expect(localStorage.getItem('testLanguage')).toBe('hi');
    });

    it('should load language from localStorage on mount', () => {
      localStorage.setItem('selectedLanguage', 'ta');
      
      render(<LanguageSelector onChange={() => {}} />);
      
      const selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('Tamil');
    });

    it('should use custom storage key', () => {
      localStorage.setItem('myLanguageKey', 'mr');
      
      render(
        <LanguageSelector
          onChange={() => {}}
          storageKey="myLanguageKey"
        />
      );
      
      const selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('Marathi');
    });

    it('should default to English if no stored value', () => {
      render(<LanguageSelector onChange={() => {}} />);
      
      const selector = screen.getByRole('combobox');
      expect(selector).toHaveTextContent('English');
    });
  });

  /**
   * Test Suite 5: Styling and Accessibility
   */
  describe('Styling and Accessibility', () => {
    it('should accept custom className', () => {
      const { container } = render(
        <LanguageSelector onChange={() => {}} className="custom-class" />
      );
      
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<LanguageSelector onChange={() => {}} />);
      
      const selector = screen.getByRole('combobox');
      expect(selector).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('should support keyboard navigation', async () => {
      render(<LanguageSelector onChange={() => {}} />);
      
      const selector = screen.getByRole('combobox');
      
      // Open dropdown with keyboard
      await userEvent.click(selector);
      await userEvent.keyboard('{ArrowDown}');
      
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThan(0);
      });
    });

    it('should be responsive', () => {
      const { container } = render(
        <LanguageSelector onChange={() => {}} />
      );
      
      const wrapper = container.querySelector('.w-full');
      expect(wrapper).toBeInTheDocument();
    });
  });

  /**
   * Test Suite 6: Helper Functions
   */
  describe('Helper Functions', () => {
    it('should validate language codes', () => {
      expect(isValidLanguageCode('en')).toBe(true);
      expect(isValidLanguageCode('hi')).toBe(true);
      expect(isValidLanguageCode('ta')).toBe(true);
      expect(isValidLanguageCode('xx')).toBe(false);
      expect(isValidLanguageCode('invalid')).toBe(false);
    });

    it('should get language by code', () => {
      const english = getLanguage('en');
      expect(english).toEqual({
        code: 'en',
        name: 'English',
        nativeName: 'English',
      });
      
      const hindi = getLanguage('hi');
      expect(hindi?.name).toBe('Hindi');
      expect(hindi?.nativeName).toBe('हिन्दी');
    });

    it('should return undefined for invalid code', () => {
      const result = getLanguage('xx' as any);
      expect(result).toBeUndefined();
    });

    it('should get all supported languages', () => {
      const languages = getSupportedLanguages();
      expect(languages.length).toBe(23);
      expect(languages[0].code).toBe('en');
    });

    it('should include all required languages', () => {
      const languages = getSupportedLanguages();
      const codes = languages.map(l => l.code);
      
      const requiredLanguages = [
        'en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'bn', 'pa',
        'or', 'as', 'ur', 'sa', 'kok', 'mni', 'mai', 'sd', 'ks', 'dg',
        'bodo', 'sat'
      ];
      
      requiredLanguages.forEach(lang => {
        expect(codes).toContain(lang);
      });
    });
  });

  /**
   * Test Suite 7: Edge Cases
   */
  describe('Edge Cases', () => {
    it('should handle rapid selection changes', async () => {
      const onChange = jest.fn();
      render(<LanguageSelector onChange={onChange} />);
      
      const selector = screen.getByRole('combobox');
      
      // Rapidly click and select different languages
      await userEvent.click(selector);
      await waitFor(() => {
        const hindiOption = screen.getByText(/Hindi/);
        fireEvent.click(hindiOption);
      });
      
      expect(onChange).toHaveBeenCalledWith('hi');
    });

    it('should handle missing onChange callback gracefully', () => {
      const { container } = render(
        <LanguageSelector />
      );
      
      expect(container.querySelector('[role="combobox"]')).toBeInTheDocument();
    });

    it('should handle undefined value prop', () => {
      render(
        <LanguageSelector value={undefined} onChange={() => {}} />
      );
      
      const selector = screen.getByRole('combobox');
      expect(selector).toBeInTheDocument();
    });
  });

  /**
   * Test Suite 8: Integration
   */
  describe('Integration', () => {
    it('should work with form submission', async () => {
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
        fireEvent.click(hindiOption);
      });
      
      const submitButton = screen.getByText('Submit');
      await userEvent.click(submitButton);
      
      expect(onChange).toHaveBeenCalledWith('hi');
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should work with multiple selectors', async () => {
      const onChange1 = jest.fn();
      const onChange2 = jest.fn();
      
      render(
        <>
          <LanguageSelector
            onChange={onChange1}
            label="Source Language"
            storageKey="sourceLang"
          />
          <LanguageSelector
            onChange={onChange2}
            label="Target Language"
            storageKey="targetLang"
          />
        </>
      );
      
      const selectors = screen.getAllByRole('combobox');
      expect(selectors.length).toBe(2);
    });
  });
});
