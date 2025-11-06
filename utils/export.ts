export const exportToCsv = <T extends object>(data: T[], filename: string): void => {
  if (data.length === 0) {
    alert("No data to export for the selected filters.");
    return;
  }

  const headers = Object.keys(data[0]);
  
  // A simple CSV-safe value converter. Handles values with commas, quotes, and newlines.
  const toCsvValue = (value: any): string => {
    const str = String(value == null ? '' : value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => toCsvValue(row[header as keyof T])).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a link and trigger the download
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
