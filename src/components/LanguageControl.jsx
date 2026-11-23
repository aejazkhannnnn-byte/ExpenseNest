import { Languages } from 'lucide-react';

export default function LanguageControl({ language, onChange, id = 'language-preference' }) {
  return (
    <div className="language-control-wrap">
      <div className="language-control" role="group" aria-label="Language" id={id}>
        <button
          type="button"
          className={language === 'en' ? 'selected' : ''}
          onClick={() => onChange('en')}
          aria-pressed={language === 'en'}
        >
          <Languages size={16} aria-hidden="true" />
          <span>English</span>
        </button>
        <button
          type="button"
          className={language === 'gu' ? 'selected' : ''}
          onClick={() => onChange('gu')}
          aria-pressed={language === 'gu'}
        >
          <span>Gujarati</span>
        </button>
      </div>
    </div>
  );
}
