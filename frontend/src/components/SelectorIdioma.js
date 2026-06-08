import React from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';

export default function SelectorIdioma() {
  const { i18n, t } = useTranslation();
  const actual = i18n.resolvedLanguage || i18n.language || 'en';

  return (
    <select
      aria-label={t('comun.language')}
      title={t('comun.language')}
      value={actual}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="form-select"
      style={{ padding: '4px 8px', fontSize: '0.8rem', height: 32, minWidth: 110 }}
    >
      {SUPPORTED_LANGUAGES.map((idioma) => (
        <option key={idioma.code} value={idioma.code}>
          {idioma.flag} {idioma.label}
        </option>
      ))}
    </select>
  );
}
