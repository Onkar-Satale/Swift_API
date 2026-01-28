import React from "react";
import AceEditor from "react-ace";

// Ace editor modes and themes
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

export default function CodeEditor({ value, onChange }) {
  return (
    <AceEditor
      mode="json"
      theme="github"
      name="jsonEditor"
      fontSize={14}
      showPrintMargin={false}
      showGutter={true}
      highlightActiveLine={true}
      value={value}
      onChange={onChange}
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: false,
        showLineNumbers: true,
        tabSize: 2,
      }}
      style={{
        width: "100%",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    />
  );
}

