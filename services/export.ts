
export const downloadAsDocx = (filename: string, content: string) => {
  // In a real environment, we'd use the 'docx' library. 
  // Here we provide a simple HTML-to-Doc conversion blob for demonstration.
  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${filename}</title></head>
    <body style="font-family: 'Microsoft YaHei', sans-serif;">
      ${content.replace(/\n/g, '<br/>')}
    </body>
    </html>
  `;
  
  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename + '.doc'; // Using .doc for compatibility with simple HTML blobs
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
