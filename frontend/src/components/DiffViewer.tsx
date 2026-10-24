import React, { useMemo } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-yaml';

interface DiffViewerProps {
  payload: string;
}

type SupportedLanguage = 'bash' | 'json' | 'python' | 'typescript' | 'yaml';

const LANGUAGE_BY_EXTENSION: Record<string, SupportedLanguage> = {
  bash: 'bash',
  json: 'json',
  py: 'python',
  sh: 'bash',
  ts: 'typescript',
  tsx: 'typescript',
  yaml: 'yaml',
  yml: 'yaml'
};

const FILE_PATH_KEYS = new Set([
  'file',
  'filepath',
  'file_path',
  'filename',
  'path',
  'targetfile',
  'target_file'
]);

const findFilePath = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object') return undefined;

  for (const [key, entry] of Object.entries(value)) {
    if (FILE_PATH_KEYS.has(key.toLowerCase()) && typeof entry === 'string') {
      return entry;
    }
  }

  for (const entry of Object.values(value)) {
    const nestedPath = findFilePath(entry);
    if (nestedPath) return nestedPath;
  }

  return undefined;
};

const detectLanguage = (filePath: string | undefined, isJson: boolean): SupportedLanguage => {
  const extension = filePath?.split('.').pop()?.toLowerCase();
  return (extension && LANGUAGE_BY_EXTENSION[extension]) || (isJson ? 'json' : 'typescript');
};

export const DiffViewer: React.FC<DiffViewerProps> = ({ payload }) => {
  const parsedData = useMemo(() => {
    try {
      const obj = JSON.parse(payload);
      return obj;
    } catch {
      return null;
    }
  }, [payload]);

  // Check if payload contains explicit diff fields (e.g. old_content vs new_content)
  const diffContent = useMemo(() => {
    if (!parsedData || typeof parsedData !== 'object') return null;

    const oldValue =
      parsedData.old_content ||
      parsedData.oldValue ||
      parsedData.TargetContent ||
      parsedData.original ||
      null;

    const newValue =
      parsedData.new_content ||
      parsedData.newValue ||
      parsedData.ReplacementContent ||
      parsedData.CodeContent ||
      parsedData.modified ||
      null;

    if (oldValue !== null && newValue !== null) {
      return {
        oldValue: typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue, null, 2),
        newValue: typeof newValue === 'string' ? newValue : JSON.stringify(newValue, null, 2)
      };
    }

    return null;
  }, [parsedData]);

  const formattedJson = useMemo(() => {
    if (parsedData) {
      return JSON.stringify(parsedData, null, 2);
    }
    return payload;
  }, [parsedData, payload]);

  const language = useMemo(
    () => detectLanguage(findFilePath(parsedData), parsedData !== null),
    [parsedData]
  );

  const renderHighlightedContent = (source: string) => (
    <code
      className={`language-${language} whitespace-pre-wrap break-words`}
      dangerouslySetInnerHTML={{
        __html: Prism.highlight(source, Prism.languages[language], language)
      }}
    />
  );

  const darkThemeStyles = {
    variables: {
      dark: {
        diffViewerBackground: '#0d131f',
        diffViewerColor: '#e2e8f0',
        addedBackground: '#064e3b',
        addedColor: '#a7f3d0',
        removedBackground: '#7f1d1d',
        removedColor: '#fecaca',
        wordAddedBackground: '#047857',
        wordRemovedBackground: '#991b1b',
        addedGutterBackground: '#065f46',
        removedGutterBackground: '#881337',
        gutterBackground: '#0f172a',
        gutterBackgroundDark: '#0b1120',
        highlightBackground: '#1e293b',
        highlightGutterBackground: '#1e293b',
        codeFoldGutterBackground: '#1e293b',
        codeFoldBackground: '#1e293b',
        emptyLineBackground: '#0d131f',
        gutterColor: '#64748b',
        addedGutterColor: '#6ee7b7',
        removedGutterColor: '#fca5a5'
      }
    },
    line: {
      padding: '4px 8px',
      fontSize: '13px',
      fontFamily: 'JetBrains Mono, monospace'
    }
  };

  if (diffContent) {
    return (
      <div className="rounded-lg overflow-hidden border border-slate-800 bg-[#0d131f]">
        <div className="bg-slate-900/90 px-3 py-1.5 text-xs font-mono text-slate-400 border-b border-slate-800 flex justify-between items-center">
          <span>Payload File Modification Diff</span>
          <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">Side-by-Side Verification</span>
        </div>
        <div className="max-h-96 overflow-auto text-xs">
          <ReactDiffViewer
            oldValue={diffContent.oldValue}
            newValue={diffContent.newValue}
            splitView={true}
            useDarkTheme={true}
            compareMethod={DiffMethod.WORDS}
            renderContent={renderHighlightedContent}
            styles={darkThemeStyles}
            leftTitle="Original State (Disk)"
            rightTitle="AI Requested State (Proposed)"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-slate-800 bg-[#0b0f19]">
      <div className="bg-slate-900/80 px-3 py-1.5 text-xs font-mono text-slate-400 border-b border-slate-800 flex justify-between items-center">
        <span>Raw Payload Payload Inspector</span>
        <span className="text-[10px] text-sky-400 uppercase tracking-wider font-semibold">JSON Parameters</span>
      </div>
      <pre className="p-3 text-xs font-mono text-emerald-400 overflow-x-auto max-h-72 whitespace-pre leading-relaxed selection:bg-slate-700">
        {renderHighlightedContent(formattedJson)}
      </pre>
    </div>
  );
};
