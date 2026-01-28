// RequestBar.jsx or RequestBar.js
import { useState, useEffect } from "react";

export default function RequestBar({ url, setUrl, paramsObj }) {
  const [fullUrl, setFullUrl] = useState(url);

  useEffect(() => {
    // Replace your existing query builder with this
    const queryString = paramsObj
      .filter(p => p.key.trim() !== "")
      .map(p => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value.trim())}`)
      .join("&");

    const fullUrl = queryString ? `${url}?${queryString}` : url;

    setFullUrl(fullUrl);
  }, [url, paramsObj]);

  return (
    <input
      type="text"
      value={fullUrl}
      onChange={(e) => setUrl(e.target.value)}
      className="url-input"
    />
  );
}
