'use client';

function Card() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/card2.png"
      alt="予約案内カード"
      style={{
        width: '91mm',
        height: '55mm',
        display: 'block',
        objectFit: 'fill',
      }}
    />
  );
}

export default function PrintCardPage() {
  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
        }
      `}</style>

      {/* 印刷ボタン（印刷時非表示） */}
      <div className="no-print" style={{
        padding: '16px',
        textAlign: 'center',
        background: '#f8f6f0',
        borderBottom: '1px solid #e0d8cc',
      }}>
        <p style={{ color: '#5c3d2e', marginBottom: '4px', fontSize: '14px' }}>
          A-ONE 51835 用 予約案内カード（10枚 / A4）
        </p>
        <p style={{ color: '#888', marginBottom: '10px', fontSize: '12px' }}>
          ※ 印刷時は余白「なし」を選択してください
        </p>
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
      </div>

      {/* A4サイズ全体を包むラッパー。余白「なし」前提でpaddingで位置調整 */}
      <div style={{
        width: '210mm',
        height: '297mm',
        paddingTop: '13mm',
        paddingLeft: '14mm',
        boxSizing: 'border-box',
        background: 'white',
      }}>
        {/* カードグリッド：2列 × 5行 = 10枚 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 91mm)',
          gridTemplateRows: 'repeat(5, 55mm)',
          width: '182mm',
        }}>
          {Array.from({ length: 10 }, (_, i) => (
            <Card key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
