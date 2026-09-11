import React from 'react';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

interface ListItem {
  type: 'bullet' | 'ordered';
  prefix: string;
  indent: number;
  lines: string[];
}

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'hr' }
  | { type: 'quote'; lines: string[] }
  | { type: 'list'; items: ListItem[] }
  | { type: 'paragraph'; lines: string[] };

/**
 * Remove stray or unclosed markdown symbols like dangling **, __, or ###
 */
function cleanStrayMarkdown(str: string): string {
  if (!str) return '';
  return str
    // Remove stray unclosed ** and __
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    // Remove stray leading # or ###
    .replace(/(^|\s)#{1,6}\s*/g, '$1')
    // Remove stray unclosed backticks
    .replace(/(^|\s)`|`(?=\s|$)/g, '$1');
}

/**
 * Strip all markdown syntax into clean plain text for snippets, summaries, and previews
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    // Remove headings
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italics
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/___([^_]+)___/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove links [title](url) -> title
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bullets and numbered list prefixes
    .replace(/^\s*[•\-\*\+]\s+/gm, '')
    .replace(/^\s*\d+[\.\)]\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove blockquotes
    .replace(/^\s*>\s*/gm, '')
    // Clean any leftover stray symbols
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/#{1,6}/g, '')
    .trim();
}

/**
 * Parses inline formatting: bold, italic, bold+italic, code, links, and text.
 */
function parseInline(text: string, isUser: boolean, keyPrefix = 'inline'): React.ReactNode[] {
  if (!text) return [];

  // Match bold+italic, bold, code, links, italic
  const tokenRegex = /(\*\*\*[\s\S]+?\*\*\*|___[\s\S]+?___|\*\*\_[\s\S]+?\_\*\*|\_\*\*[\s\S]+?\*\*\_\s*|\*\*[\s\S]+?\*\*|__[\s\S]+?__|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*\n]+?\*|(?<=\s|^)_[^_\n]+?_(?=\s|$|[.,!?:;]))/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchedStr = match[0];

    // Preceding plain text
    if (matchIndex > lastIndex) {
      const plain = text.slice(lastIndex, matchIndex);
      const cleaned = cleanStrayMarkdown(plain);
      if (cleaned) {
        parts.push(cleaned);
      }
    }

    const tokenKey = `${keyPrefix}-${matchIndex}`;

    // 1. Bold + Italic: ***text***, ___text___, **_text_**, _**text**_
    if (
      (matchedStr.startsWith('***') && matchedStr.endsWith('***')) ||
      (matchedStr.startsWith('___') && matchedStr.endsWith('___')) ||
      (matchedStr.startsWith('**_') && matchedStr.endsWith('_**')) ||
      (matchedStr.startsWith('_**') && matchedStr.endsWith('**_'))
    ) {
      const inner = matchedStr.slice(3, -3);
      parts.push(
        <strong
          key={tokenKey}
          className={`font-bold italic ${isUser ? 'text-white' : 'text-gray-950'}`}
        >
          {parseInline(inner, isUser, `${tokenKey}-bi`)}
        </strong>
      );
    }
    // 2. Bold: **text** or __text__
    else if (
      (matchedStr.startsWith('**') && matchedStr.endsWith('**')) ||
      (matchedStr.startsWith('__') && matchedStr.endsWith('__'))
    ) {
      const inner = matchedStr.slice(2, -2);
      parts.push(
        <strong
          key={tokenKey}
          className={`font-bold ${isUser ? 'text-white font-semibold' : 'text-gray-950 font-bold'}`}
        >
          {parseInline(inner, isUser, `${tokenKey}-b`)}
        </strong>
      );
    }
    // 3. Inline Code: `code`
    else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      const inner = matchedStr.slice(1, -1);
      parts.push(
        <code
          key={tokenKey}
          className={`px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-mono ${
            isUser
              ? 'bg-white/20 text-white'
              : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}
        >
          {inner}
        </code>
      );
    }
    // 4. Link: [label](url)
    else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
      const linkMatch = matchedStr.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, title, url] = linkMatch;
        parts.push(
          <a
            key={tokenKey}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline font-medium hover:opacity-80 transition-opacity ${
              isUser ? 'text-teal-300' : 'text-teal-700'
            }`}
          >
            {title}
          </a>
        );
      } else {
        parts.push(matchedStr);
      }
    }
    // 5. Italic: *text* or _text_
    else if (
      (matchedStr.startsWith('*') && matchedStr.endsWith('*')) ||
      (matchedStr.startsWith('_') && matchedStr.endsWith('_'))
    ) {
      const inner = matchedStr.slice(1, -1);
      parts.push(
        <em
          key={tokenKey}
          className={`italic ${isUser ? 'text-gray-200' : 'text-gray-700'}`}
        >
          {parseInline(inner, isUser, `${tokenKey}-i`)}
        </em>
      );
    } else {
      parts.push(cleanStrayMarkdown(matchedStr));
    }

    lastIndex = matchIndex + matchedStr.length;
  }

  // Trailing plain text
  if (lastIndex < text.length) {
    const trailing = text.slice(lastIndex);
    const cleaned = cleanStrayMarkdown(trailing);
    if (cleaned) {
      parts.push(cleaned);
    }
  }

  return parts;
}

/**
 * Break markdown content into structured block elements.
 */
function parseBlocks(rawContent: string): Block[] {
  const normalized = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalized.split('\n');
  const blocks: Block[] = [];

  let currentParagraph: string[] = [];
  let currentList: ListItem[] | null = null;
  let currentQuote: string[] | null = null;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'paragraph', lines: [...currentParagraph] });
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList && currentList.length > 0) {
      blocks.push({ type: 'list', items: [...currentList] });
      currentList = null;
    }
  };

  const flushQuote = () => {
    if (currentQuote && currentQuote.length > 0) {
      blocks.push({ type: 'quote', lines: [...currentQuote] });
      currentQuote = null;
    }
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Empty Line -> block separator
    if (trimmed === '') {
      flushAll();
      continue;
    }

    // 2. Horizontal Rule (---, ***, ___)
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushAll();
      blocks.push({ type: 'hr' });
      continue;
    }

    // 3. Heading (# to ######)
    const headingMatch = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushAll();
      const level = headingMatch[1].length;
      // Strip trailing hashes and stray bold markers in heading title
      let headingText = headingMatch[2].replace(/\s+#+\s*$/, '').trim();
      headingText = headingText
        .replace(/^\*\*|\*\*$/g, '')
        .replace(/^__|_$/g, '')
        .replace(/\*\*/g, '');
      blocks.push({ type: 'heading', level, text: headingText });
      continue;
    }

    // 4. Blockquote (> ...)
    const quoteMatch = line.match(/^\s*>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      if (!currentQuote) currentQuote = [];
      currentQuote.push(quoteMatch[1]);
      continue;
    } else if (currentQuote) {
      flushQuote();
    }

    // 5. Unordered List Item: •, -, +, or single * (not **)
    const bulletMatch = line.match(/^(\s*)([•\-\+]|\*(?!\*))\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      flushQuote();
      if (!currentList) currentList = [];
      const indent = bulletMatch[1].length;
      currentList.push({
        type: 'bullet',
        prefix: bulletMatch[2],
        indent,
        lines: [bulletMatch[3]],
      });
      continue;
    }

    // 6. Ordered List Item: 1., 2), (1), etc.
    const orderedMatch = line.match(/^(\s*)(\d+[\.\)]|\(\d+\))\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      flushQuote();
      if (!currentList) currentList = [];
      const indent = orderedMatch[1].length;
      currentList.push({
        type: 'ordered',
        prefix: orderedMatch[2],
        indent,
        lines: [orderedMatch[3]],
      });
      continue;
    }

    // 7. Indented continuation of list item (e.g. 2+ spaces under a list item)
    if (currentList && currentList.length > 0 && /^\s{2,}/.test(line)) {
      const lastItem = currentList[currentList.length - 1];
      lastItem.lines.push(trimmed);
      continue;
    }

    // Normal line after a list
    if (currentList) {
      flushList();
    }

    // 8. Normal Paragraph line
    currentParagraph.push(line);
  }

  flushAll();
  return blocks;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  isUser = false,
}) => {
  if (!content) return null;

  const blocks = parseBlocks(content);

  const renderHeading = (block: { level: number; text: string }, index: number) => {
    const inlineContent = parseInline(block.text, isUser, `h-${index}`);
    const baseClass = isUser ? 'text-white' : 'text-gray-950 font-display';

    switch (block.level) {
      case 1:
        return (
          <h2
            key={`h1-${index}`}
            className={`text-base sm:text-lg font-bold ${baseClass} mt-3.5 first:mt-0 mb-1.5 pb-1 border-b ${
              isUser ? 'border-white/20' : 'border-gray-200/80'
            }`}
          >
            {inlineContent}
          </h2>
        );
      case 2:
        return (
          <h3
            key={`h2-${index}`}
            className={`text-sm sm:text-base font-bold ${baseClass} mt-3 first:mt-0 mb-1.5`}
          >
            {inlineContent}
          </h3>
        );
      case 3:
        return (
          <h4
            key={`h3-${index}`}
            className={`text-xs sm:text-sm font-bold ${baseClass} mt-2.5 first:mt-0 mb-1 ${
              isUser ? 'text-teal-200' : 'text-teal-900'
            }`}
          >
            {inlineContent}
          </h4>
        );
      default:
        return (
          <h5
            key={`h4-${index}`}
            className={`text-xs sm:text-sm font-semibold ${baseClass} mt-2 first:mt-0 mb-1`}
          >
            {inlineContent}
          </h5>
        );
    }
  };

  const renderList = (block: { items: ListItem[] }, blockIndex: number) => {
    return (
      <div key={`list-${blockIndex}`} className="space-y-1.5 my-2">
        {block.items.map((item, itemIdx) => {
          const isSubItem = item.indent > 0;
          const indentClass = isSubItem
            ? item.indent > 2
              ? 'ml-5 sm:ml-6'
              : 'ml-3 sm:ml-4'
            : '';

          return (
            <div
              key={`li-${blockIndex}-${itemIdx}`}
              className={`flex items-start gap-2.5 ${indentClass} leading-relaxed`}
            >
              {item.type === 'ordered' ? (
                <span
                  className={`shrink-0 font-bold select-none text-xs sm:text-sm pt-0.5 min-w-[1.25rem] ${
                    isUser ? 'text-teal-300' : 'text-teal-700'
                  }`}
                >
                  {item.prefix}
                </span>
              ) : (
                <span
                  className={`shrink-0 select-none text-sm pt-0.5 leading-none ${
                    isUser
                      ? 'text-teal-300'
                      : isSubItem
                      ? 'text-gray-400'
                      : 'text-teal-600 font-bold'
                  }`}
                >
                  {isSubItem ? '◦' : '•'}
                </span>
              )}
              <div className="flex-1 space-y-1">
                <div>{parseInline(item.lines[0], isUser, `li-${blockIndex}-${itemIdx}-0`)}</div>
                {item.lines.slice(1).map((subLine, subIdx) => (
                  <div
                    key={`sub-${subIdx}`}
                    className={`text-xs sm:text-sm ${
                      isUser ? 'text-gray-200' : 'text-gray-700'
                    } pl-1`}
                  >
                    {parseInline(subLine, isUser, `li-${blockIndex}-${itemIdx}-sub-${subIdx}`)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderParagraph = (block: { lines: string[] }, index: number) => {
    return (
      <div key={`p-${index}`} className="my-1.5 first:mt-0 last:mb-0 leading-relaxed">
        {block.lines.map((line, lineIdx) => (
          <React.Fragment key={`line-${lineIdx}`}>
            {lineIdx > 0 && <br />}
            {parseInline(line, isUser, `p-${index}-${lineIdx}`)}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderQuote = (block: { lines: string[] }, index: number) => {
    return (
      <blockquote
        key={`q-${index}`}
        className={`my-2 pl-3 py-1 border-l-3 italic rounded-r-lg ${
          isUser
            ? 'border-teal-400 bg-white/5 text-gray-200'
            : 'border-teal-600 bg-teal-50/50 text-gray-700'
        }`}
      >
        {block.lines.map((line, lineIdx) => (
          <div key={`qline-${lineIdx}`}>
            {parseInline(line, isUser, `q-${index}-${lineIdx}`)}
          </div>
        ))}
      </blockquote>
    );
  };

  const renderHr = (index: number) => {
    return (
      <hr
        key={`hr-${index}`}
        className={`my-3 border-t ${isUser ? 'border-white/20' : 'border-gray-200'}`}
      />
    );
  };

  return (
    <div
      className={`markdown-renderer ${
        isUser ? 'text-white' : 'text-gray-950'
      } ${className}`}
    >
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading':
            return renderHeading(block, idx);
          case 'hr':
            return renderHr(idx);
          case 'quote':
            return renderQuote(block, idx);
          case 'list':
            return renderList(block, idx);
          case 'paragraph':
            return renderParagraph(block, idx);
          default:
            return null;
        }
      })}
    </div>
  );
};
