const handleFileUpload = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    const content = e.target?.result;

    const newFile = {
      filename: file.name,
      content,
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFile(newFile);
  };

  reader.readAsText(file);
};

export default handleFileUpload
