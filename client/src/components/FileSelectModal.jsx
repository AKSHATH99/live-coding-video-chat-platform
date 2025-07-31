import { useState, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const FileSelectModal = ({ onClose, files }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);

    useEffect(() => {
        setSelectedFiles(files); // Select all on open
    }, [files]);

    const toggleFile = (file) => {
        setSelectedFiles((prev) =>
            prev.includes(file)
                ? prev.filter(f => f !== file)
                : [...prev, file]
        );
    };

    const handleDownloadSelected = () => {
        if (selectedFiles.length === 0) return;

        const zip = new JSZip();
        selectedFiles.forEach(file => {
            zip.file(file.filename, file.content);
        });

        zip.generateAsync({ type: "blob" }).then(content => {
            saveAs(content, "selected-files.zip");
            onClose();
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl p-8 space-y-6 relative">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Select Files to Download</h2>
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                        {files.map((file, index) => (
                            <li key={index} className="flex items-center justify-between">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles.includes(file)}
                                        onChange={() => toggleFile(file)}
                                        className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600 dark:checked:border-blue-600"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">{file.filename}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleDownloadSelected}
                            className="px-4 py-1.5 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800"
                        >
                            Download Selected
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileSelectModal;
