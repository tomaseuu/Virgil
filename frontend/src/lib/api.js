const apiBaseUrl =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

export function getApiUrl(path) {
  return `${apiBaseUrl}${path}`;
}
