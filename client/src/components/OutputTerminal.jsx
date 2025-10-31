import React, { useState, useEffect } from 'react';
import { Terminal, X, Copy, Maximize2, Minimize2, CheckCircle } from 'lucide-react';

const TerminalOutput = ({
  output = "",
  loading = false,
  isVisible = false,
  onClose,
  onClear,
  initialHeight = 200
}) => {
  const [terminalHeight, setTerminalHeight] = useState(initialHeight);
  const [isMaximized, setIsMaximized] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isVisible, onClose]);

  // Handle terminal resize
  const handleTerminalResize = (e) => {
    const startY = e.clientY;
    const startHeight = terminalHeight;

    const handleMouseMove = (e) => {
      const newHeight = Math.max(100, Math.min(500, startHeight - (e.clientY - startY)));
      setTerminalHeight(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Copy output to clipboard
  const copyOutputToClipboard = () => {
    if (!output) return;

    navigator.clipboard.writeText(output)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy output: ', err);
      });
  };

  // Get status info
  const getStatus = () => {
    if (loading) return { color: 'bg-yellow-500', text: 'Running...' };
    if (output && !output.toLowerCase().includes('error')) return { color: 'bg-green-500', text: 'Success' };
    if (output && output.toLowerCase().includes('error')) return { color: 'bg-red-500', text: 'Error' };
    return { color: 'bg-gray-400', text: 'Ready' };
  };

  const status = getStatus();

  return (
    <div className="h-full w-full flex flex-col">
      {/* Modal Container */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 h-full rounded-none shadow-lg flex flex-col w-full">
        {/* Resize Handle */}
        <div
          className="h-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-row-resize transition-colors"
          onMouseDown={handleTerminalResize}
          title="Drag to resize"
        />

        {/* Terminal Header */}
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Terminal</span>
            </div>

            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{status.text}</span>
            </div>

            {output && !loading && (
              <div className="text-xs text-gray-400">
                {output.split('\n').length} lines
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Clear Output */}
            {onClear && output && (
              <button
                onClick={onClear}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                title="Clear output"
              >
                <span className="text-xs">Clear</span>
              </button>
            )}

            {/* Copy Output */}
            <button
              onClick={copyOutputToClipboard}
              disabled={!output || loading}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Copy output"
            >
              {copied ? <CheckCircle size={14} className="text-green-600" /> : <Copy size={14} />}
            </button>

            {/* Maximize/Minimize */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Close Terminal */}
            <button
              onClick={onClose}
              className="flex items-center gap-1 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 rounded text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Close terminal (ESC)"
            >
              <X size={14} />
              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">ESC</span>
            </button>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
          <div className="p-4">
            {loading && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                <div className="animate-spin w-3 h-3 border border-gray-400 dark:border-gray-500 border-t-transparent rounded-full"></div>
                <span className="text-sm">Executing code...</span>
              </div>
            )}

            <pre className="font-mono text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
              {output || (loading ? "" : "No output yet. Run your code to see results here.")}
            </pre>

            {/* Scroll to bottom indicator */}
            {output && output.split('\n').length > 10 && (
              <div className="mt-4 text-center">
                <div className="inline-block text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                  End of output
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalOutput;