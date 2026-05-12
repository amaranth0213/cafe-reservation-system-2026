'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: '10px 32px',
        background: '#2d5a27',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '15px',
        cursor: 'pointer',
        fontWeight: 'bold',
      }}
    >
      🖨️ 印刷する
    </button>
  );
}
