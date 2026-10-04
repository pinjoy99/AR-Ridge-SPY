import React, { useMemo } from 'react';
import katex from 'katex';

interface MathFormulaProps {
  tex: string;
  block?: boolean;
  className?: string;
}

export const MathFormula: React.FC<MathFormulaProps> = ({
  tex,
  block = false,
  className = '',
}) => {
  const html = useMemo(() => {
    if (!tex) return '';
    try {
      // Normalize any control characters created if template literals were escaped
      const normalizedTex = tex
        .replace(/\x08/g, '\\b')
        .replace(/\x09/g, '\\t')
        .replace(/\x0c/g, '\\f')
        .replace(/\x0b/g, '\\v');

      return katex.renderToString(normalizedTex, {
        displayMode: block,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return tex;
    }
  }, [tex, block]);

  if (block) {
    return (
      <div
        className={`overflow-x-auto py-1 ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`inline-block align-baseline ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
