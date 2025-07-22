import JSZip from "jszip";

const   downloadAllFilesAsZip = async (files) => {
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.filename, file.content);
  });

  const blob = await zip.generateAsync({ type: "blob" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "all-files.zip";
  a.click();
  URL.revokeObjectURL(url);
};

export default downloadAllFilesAsZip;