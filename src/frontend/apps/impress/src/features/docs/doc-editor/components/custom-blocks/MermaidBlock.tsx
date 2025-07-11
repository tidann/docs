import { createReactBlockSpec } from '@blocknote/react';
import { useEffect, useState, useRef } from 'react';
import React from 'react';

import { TFunction } from 'i18next';
import { Icon, Box } from '@/components';
import { DocsBlockNoteEditor } from '../../types';
import { defaultProps, Block, BlockNoteEditor, insertOrUpdateBlock } from '@blocknote/core';

import { CodeEditor } from '../CodeEditor/index';
import { blockStyles } from './shared/styles';

export interface MermaidRendererProps {
  diagram: string;
  onDiagramChange: (diagram: string) => void;
}

export interface MermaidBlockProps {
  block: Block;
  editor: BlockNoteEditor;
}

export interface SlashMenuItemProps {
  editor: BlockNoteEditor;
  t: (key: string) => string;
  group: string;
}

export interface MermaidModule {
  initialize: (config: {
    startOnLoad: boolean;
    theme: string;
    securityLevel: string;
  }) => void;
  render: (id: string, text: string) => Promise<{ svg: string; }>;
}

export interface MermaidImport {
  default: MermaidModule;
}

export const defaultDiagram = `graph TD
    A[Start] --> B{Is it?}
    B -- Yes --> C[OK]
    B -- No --> D[End]`;

export const blockSpec = {
  type: 'mermaid',
  propSchema: {
    diagram: {
      default: defaultDiagram,
    },
    textAlignment: defaultProps.textAlignment,
    backgroundColor: defaultProps.backgroundColor,
  },
  content: 'none',
} as const;

export const MermaidRenderer = ({
  diagram,
  onDiagramChange,
}: MermaidRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const [isLocalEditing, setIsLocalEditing] = useState(false);
  const { mermaidModule, error: mermaidError } = useMermaid();
  const [error, setError] = useState<string | null>(null);
  const diagramId = useRef(
    `mermaid-diagram-${Math.random().toString(36).substr(2, 9)}`,
  );

  useEffect(() => {
    if (containerRef.current && mermaidModule) {
      const renderDiagram = async () => {
        try {
          const { svg } = await mermaidModule.render(
            diagramId.current,
            diagram,
          );
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
          setError('');
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          setError('Invalid Mermaid diagram');
          if (containerRef.current) {
            containerRef.current.innerHTML = '/!\\ Invalid Mermaid diagram';
          }
        }
      };
      void renderDiagram();
    }
  }, [diagram, mermaidModule]);

  return (
    <Box
      ref={blockRef}
      $padding="1rem"
      style={blockStyles.container}
      onClick={() => setIsLocalEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setIsLocalEditing(true);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div
        ref={containerRef}
        style={{
          display: diagram.trim() && !error && !mermaidError ? 'block' : 'none',
        }}
      />
      {!diagram.trim() && (
        <div style={blockStyles.placeholder}>
          <Icon iconName="account_tree" $size="18px" />
          Click here to edit the Mermaid diagram.
        </div>
      )}
      {diagram.trim() && (error || mermaidError) && (
        <Box
          $margin="0.5rem 0 0 0"
          $padding="0.5rem"
          $background="#fff3f3"
          style={blockStyles.error}
        >
          {error || mermaidError}
        </Box>
      )}
      {isLocalEditing && (
        <CodeEditor
          value={diagram}
          onChange={onDiagramChange}
          onClickOutside={() => setIsLocalEditing(false)}
          parentRef={blockRef}
          language="mermaid"
        />
      )}
    </Box>
  );
};

export function useMermaid() {
  const [mermaidModule, setMermaidModule] = useState<MermaidModule | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMermaid = async () => {
      try {
        const mermaid = (await import('mermaid')) as MermaidImport;
        mermaid.default.initialize({
          startOnLoad: true,
          theme: 'default',
          securityLevel: 'loose',
        });
        setMermaidModule(mermaid.default);
      } catch (error) {
        console.error('Failed to load Mermaid:', error);
        setError('Failed to load Mermaid');
      }
    };

    void loadMermaid();
  }, []);

  return { mermaidModule, error };
}

export const MermaidBlock = createReactBlockSpec(blockSpec, {
  render: (props) => {
    const { block, editor } = props;
    const handleDiagramChange = (newDiagram: string) => {
      editor.updateBlock(block, {
        props: {
          diagram: newDiagram,
        },
      });
    };

    return (
      <MermaidRenderer
        diagram={block.props.diagram}
        onDiagramChange={handleDiagramChange}
      />
    );
  },
});

export const getMermaidReactSlashMenuItems = (
  editor: DocsBlockNoteEditor,
  t: TFunction<'translation', undefined>,
  group: string,
) => [
  {
    title: t('Mermaid Diagram'),
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: 'mermaid',
        props: {
          diagram: defaultDiagram,
        },
      });
    },
    aliases: ['mermaid', 'diagram', 'flowchart', 'graph', 'chart'],
    group,
    icon: <Icon iconName="account_tree" $size="18px" />,
    subtext: t('Add a Mermaid diagram block'),
  },
];
