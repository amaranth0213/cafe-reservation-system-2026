'use client';

const RESERVE_URL = 'https://cafe-reservation-system-2026.vercel.app/reserve';
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(RESERVE_URL)}&margin=0&color=000000&bgcolor=ffffff`;

function TeaRoomSvg() {
  return (
    <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 窓枠 */}
      <rect x="2" y="1" width="24" height="30" rx="1" stroke="#5c3d2e" strokeWidth="1.2"/>
      {/* 縦桟 */}
      <line x1="14" y1="1" x2="14" y2="31" stroke="#5c3d2e" strokeWidth="1"/>
      {/* 横桟 */}
      <line x1="2" y1="10" x2="26" y2="10" stroke="#5c3d2e" strokeWidth="1"/>
      <line x1="2" y1="19" x2="26" y2="19" stroke="#5c3d2e" strokeWidth="1"/>
      {/* 枝 */}
      <path d="M4 6 Q8 3 10 5 Q12 7 8 8" stroke="#5c3d2e" strokeWidth="0.8" fill="none"/>
      <circle cx="5" cy="5" r="1" fill="#5c3d2e"/>
      <circle cx="10" cy="4" r="1" fill="#5c3d2e"/>
      {/* 茶碗 */}
      <path d="M16 26 Q16 29 20 29 Q24 29 24 26 L23 23 L17 23 Z" stroke="#5c3d2e" strokeWidth="0.8" fill="none"/>
      <line x1="18" y1="29" x2="22" y2="29" stroke="#5c3d2e" strokeWidth="0.8"/>
      {/* 茶筅 */}
      <line x1="21" y1="22" x2="21" y2="18" stroke="#5c3d2e" strokeWidth="0.8"/>
      <path d="M19 18 Q21 16 23 18" stroke="#5c3d2e" strokeWidth="0.7" fill="none"/>
    </svg>
  );
}

function Card() {
  return (
    <div
      style={{
        width: '55mm',
        height: '91mm',
        background: 'white',
        boxSizing: 'border-box',
        padding: '5mm 4mm 4mm 4mm',
        position: 'relative',
        overflow: 'hidden',
        border: '0.3px solid #ccc',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* 上部：縦書きテキスト */}
      <div style={{ display: 'flex', flexDirection: 'row', flex: 1, gap: '3mm' }}>
        {/* 左：ご予約はこちらから */}
        <div
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'upright',
            fontSize: '6.5pt',
            color: '#333',
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            paddingTop: '12mm',
          }}
        >
          ご予約はこちらから↓
        </div>

        {/* 右：店名 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: '2mm',
          }}
        >
          <div
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '1mm',
            }}
          >
            <span
              style={{
                fontSize: '6pt',
                color: '#5c3d2e',
                letterSpacing: '0.15em',
                fontWeight: '400',
              }}
            >
              お茶と甘いもの
            </span>
            <span
              style={{
                fontSize: '22pt',
                color: '#5c3d2e',
                letterSpacing: '0.2em',
                fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif',
                fontWeight: '300',
                lineHeight: 1.1,
              }}
            >
              あまらんす
            </span>
          </div>
        </div>
      </div>

      {/* 下部：QRコード＋イラスト */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: '2mm',
        }}
      >
        {/* QRコード */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={QR_URL}
          alt="予約QRコード"
          style={{ width: '28mm', height: '28mm' }}
        />
        {/* イラスト */}
        <div style={{ marginBottom: '1mm', marginRight: '1mm' }}>
          <TeaRoomSvg />
        </div>
      </div>
    </div>
  );
}

export default function PrintCardPage() {
  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 13mm 9.5mm;
          }
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .card-sheet {
            box-shadow: none !important;
          }
          div[style*="border: 0.3px solid #ccc"] {
            border: none !important;
          }
        }
      `}</style>

      {/* 印刷ボタン（印刷時は非表示） */}
      <div
        className="no-print"
        style={{
          padding: '16px',
          textAlign: 'center',
          background: '#f8f6f0',
          borderBottom: '1px solid #e0d8cc',
        }}
      >
        <p style={{ color: '#5c3d2e', marginBottom: '8px', fontSize: '14px' }}>
          A-ONE 51835 用 予約QRカード（10枚 / A4）
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

      {/* カードシート：2列 × 5行 = 10枚 */}
      <div
        className="card-sheet"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 55mm)',
          gridTemplateRows: 'repeat(5, 91mm)',
          width: '110mm',
          margin: '0 auto',
          background: 'white',
        }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <Card key={i} />
        ))}
      </div>
    </>
  );
}
