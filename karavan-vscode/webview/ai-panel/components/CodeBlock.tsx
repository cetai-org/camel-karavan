/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import './CodeBlock.css';

interface CodeBlockProps {
    code: string;
    language?: string;
    fileName?: string;
    onApply?: (code: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ 
    code, 
    language = 'yaml',
    fileName,
    onApply 
}) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleApply = () => {
        if (onApply) {
            onApply(code);
        }
    };

    return (
        <div className="code-block">
            <div className="code-block-header">
                <span className="code-language">{language}</span>
                {fileName && <span className="code-filename">{fileName}</span>}
                <div className="code-actions">
                    <button
                        className="code-action-button"
                        onClick={handleCopy}
                        title="Copy code"
                    >
                        <i className={`codicon ${copied ? 'codicon-check' : 'codicon-copy'}`}></i>
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    {onApply && (
                        <button
                            className="code-action-button primary"
                            onClick={handleApply}
                            title="Apply to file"
                        >
                            <i className="codicon codicon-insert"></i>
                            Apply
                        </button>
                    )}
                </div>
            </div>
            <pre className="code-block-content">
                <code className={`language-${language}`}>{code}</code>
            </pre>
        </div>
    );
};
