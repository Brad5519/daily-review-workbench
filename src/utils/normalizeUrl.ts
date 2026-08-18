export function normalizeUrl(url: string): string {
  if (!url) return url;
  const trimmed = url.trim();

  // Map common typo protocols to correct ones
  // heeps:// -> https://, heep:// -> http://
  if (/^heeps:\/\//i.test(trimmed)) {
    return trimmed.replace(/^heeps:\/\//i, 'https://');
  }
  if (/^heep:\/\//i.test(trimmed)) {
    return trimmed.replace(/^heep:\/\//i, 'http://');
  }

  // If no protocol and looks like a GitHub Pages host, add https://
  if (!/^[a-zA-Z0-9.+-]+:\/\//.test(trimmed) && /\.github\.io(\/.*)?$/i.test(trimmed)) {
    return 'https://' + trimmed;
  }

  return trimmed;
}
