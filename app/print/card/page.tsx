'use client';

const RESERVE_URL = 'https://cafe-reservation-system-2026.vercel.app/reserve';
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(RESERVE_URL)}&margin=0&color=000000&bgcolor=ffffff`;

function TeaRoomSvg() {
  return (
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 障子窓の外枠 */}
      <rect x="1" y="1" width="26" height="38" rx="1" stroke="#5c3d2e" strokeWidth="1.4"/>
      {/* 縦の桟（3本） */}
      <line x1="9.5" y1="1" x2="9.5" y2="39" stroke="#5c3d2e" strokeWidth="0.8"/>
      <line x1="18" y1="1" x2="18" y2="39" stroke="#5c3d2e" strokeWidth="0.8"/>
      {/* 横の桟（4本） */}
      <line x1="1" y1="9" x2="27" y2="9" stroke="#5c3d2e" strokeWidth="0.8"/>
      <line x1="1" y1="17" x2="27" y2="17" stroke="#5c3d2e" strokeWidth="0.8"/>
      <line x1="1" y1="25" x2="27" y2="25" stroke="#5c3d2e" strokeWidth="0.8"/>
      <line x1="1" y1="33" x2="27" y2="33" stroke="#5c3d2e" strokeWidth="0.8"/>
      {/* 枝（左上から伸びる） */}
      <path d="M0 5 Q5 2 10 6 Q14 9 9 11" stroke="#5c3d2e" strokeWidth="1" fill="none"/>
      <path d="M10 6 Q13 3 15 5" stroke="#5c3d2e" strokeWidth="0.7" fill="none"/>
      {/* 葉っぱ */}
      <ellipse cx="3" cy="4" rx="2" ry="1.2" transform="rotate(-20 3 4)" fill="#5c3d2e" opacity="0.7"/>
      <ellipse cx="9" cy="2.5" rx="2" ry="1.2" transform="rotate(10 9 2.5)" fill="#5c3d2e" opacity="0.7"/>
      <ellipse cx="15" cy="4.5" rx="1.5" ry="1" transform="rotate(30 15 4.5)" fill="#5c3d2e" opacity="0.7"/>
      {/* 茶碗（右下） */}
      <path d="M20 34 Q19 38 24 38 Q29 38 28 34 Z" stroke="#5c3d2e" strokeWidth="1" fill="none"/>
      <line x1="20" y1="38" x2="28" y2="38" stroke="#5c3d2e" strokeWidth="0.8"/>
      <line x1="21.5" y1="38" x2="21.5" y2="40" stroke="#5c3d2e" strokeWidth="0.8"/>
      <line x1="26.5" y1="38" x2="26.5" y2="40" stroke="#5c3d2e" strokeWidth="0.8"/>
      <line x1="21.5" y1="40" x2="26.5" y2="40" stroke="#5c3d2e" strokeWidth="0.8"/>
      {/* 茶筅 */}
      <line x1="31" y1="28" x2="31" y2="40" stroke="#5c3d2e" strokeWidth="1"/>
      <path d="M28 32 Q31 30 34 32" stroke="#5c3d2e" strokeWidth="0.8" fill="none"/>
      <line x1="29" y1="33" x2="29" y2="38" stroke="#5c3d2e" strokeWidth="0.6"/>
      <line x1="31" y1="32" x2="31" y2="38" stroke="#5c3d2e" strokeWidth="0.6"/>
      <line x1="33" y1="33" x2="33" y2="38" stroke="#5c3d2e" strokeWidth="0.6"/>
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
