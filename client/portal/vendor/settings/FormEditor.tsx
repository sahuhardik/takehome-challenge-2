import { State, useState } from '@hookstate/core';
import { ContentState, convertToRaw, EditorState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import isHtml from 'is-html';
import React from 'react';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

function toDraftContent(str?: string): ContentState {
  const check = str || '';

  const html = isHtml(check)
    ? check
    : check
        .split('\n')
        .map((p) => `<p>${p}</p>`)
        .join('');

  return ContentState.createFromBlockArray(htmlToDraft(html).contentBlocks);
}

export default function FormEditor({ state }: { state: State<string> }) {
  const scoped = useState(state);
  const [editorState, setEditorState] = React.useState<EditorState>(
    EditorState.createWithContent(toDraftContent(state.get()))
  );
  const onEditorStateChange = (editorState: EditorState): void => {
    setEditorState(editorState);
    scoped.set(draftToHtml(convertToRaw(editorState.getCurrentContent())));
  };
  return (
    <Editor
      editorState={editorState}
      onEditorStateChange={onEditorStateChange}
      toolbarClassName="flex sticky top-0 z-50 !justify-center mx-auto"
      wrapperClassName="w-full"
      editorClassName="border p-2 m-0 prose prose-sm max-w-none"
      toolbar={{
        colorPicker: false,
      }}
    />
  );
}
