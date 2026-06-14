"use client";

import { useState } from "react";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/import", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    console.log(data);
  };

  return (
    <div className="p-6">
      <h1>Import CSV</h1>

      <input
        type="file"
        accept=".csv"
        onChange={(e) =>
          setFile(e.target.files?.[0] || null)
        }
      />

      <button onClick={handleUpload}>
        Upload
      </button>
    </div>
  );
}