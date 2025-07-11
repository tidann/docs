import Editor from '@monaco-editor/react';
import { Button } from '@openfun/cunningham-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Icon } from '@/components';

import { getEditorOptions, initializeMonaco } from './config/editorConfig';
import { useClickOutside } from './hooks/useClickOutside';
import { useEditorDimensions } from './hooks/useEditorDimensions';
import { containerStyles, editorContainerStyles } from './styles/editorStyles';
import type { CodeEditorProps } from './types';

export const CodeEditor = ({
  value,
  onChange,
  onClickOutside,
  parentRef,
  language = 'latex',
  height = '190px',
  width,
}: CodeEditorProps) => {
  const { t } = useTranslation();
  const { height: parentHeight, width: parentWidth } =
    useEditorDimensions(parentRef);
  const editorRef = useClickOutside(onClickOutside);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    void initializeMonaco();
  }, []);

  const containerWidth = width || `${parentWidth}px`;
  const containerMargin = `${parentHeight}px 0 0 -16px`;

  return (
    <Box
      ref={editorRef}
      $position="absolute"
      $zIndex={1000}
      $margin={containerMargin}
      $padding="1rem"
      $background="white"
      style={{
        ...containerStyles,
        width: containerWidth,
      }}
    >
      <Box style={editorContainerStyles}>
        <Editor
          language={language}
          height={height}
          value={localValue}
          onChange={(value) => setLocalValue(value || '')}
          options={getEditorOptions(language)}
          theme="vs-light"
        />
      </Box>
      <div style={{ marginTop: 'auto' }}>
        <Button
          size="small"
          iconPosition="right"
          color="primary"
          icon={<Icon $variation="000" iconName="keyboard_return" />}
          onClick={() => onChange(localValue)}
        >
          {t('OK')}
        </Button>
      </div>
    </Box>
  );
};
