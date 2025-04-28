"use client";
import React from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2>Something went wrong!</h2>
      <pre style={{ color: 'red', margin: '16px 0' }}>{error.message}</pre>
      <button onClick={reset} style={{ padding: '8px 16px', fontSize: 16 }}>
        Try again
      </button>
    </div>
  );
} 