'use client';

const RESERVE_URL = 'https://cafe-reservation-system-2026.vercel.app/reserve';
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(RESERVE_URL)}&margin=0&color=000000&bgcolor=ffffff`;

function TeaRoomSvg() {
  const c = '#5c3d2e';
  return (
    <svg width="52" height="64" viewBox="0 0 52 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 障子窓 外枠 */}
      <rect x="1" y="1" width="36" height="56" stroke={c} strokeWidth="1.4" rx="0.5"/>
      {/* 縦桟 2本（3等分） */}
      <line x1="13" y1="1" x2="13" y2="57" stroke={c} strokeWidth="0.9"/>
      <line x1="25" y1="1" x2="25" y2="57" stroke={c} strokeWidth="0.9"/>
      {/* 横桟 1本（下寄り） */}
      <line x1="1" y1="42" x2="37" y2="42" stroke={c} strokeWidth="0.9"/>

      {/* 枝：左上から斜め右下へ */}
      <path d="M1 10 Q7 6 14 14 Q18 19 13 24" stroke={c} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* 小枝 */}
      <path d="M10 11 Q14 7 17 9" stroke={c} strokeWidth="0.8" fill="none" strokeLinecap="round"/>
      {/* 葉っぱ */}
      <path d="M1 8 Q4 5 6 8 Q4 10 1 8Z" fill={c}/>
      <path d="M11 7 Q14 4 16 7 Q14 9 11 7Z" fill={c}/>
      <path d="M17 8 Q20 6 21 9 Q19 10 17 8Z" fill={c}/>

      {/* 茶碗：下部左パネル中央 */}
      <path d="M5 50 Q4 54 9 54 Q14 54 13 50Z" stroke={c} strokeWidth="1" fill="none" strokeLinecap="round"/>
      <line x1="5" y1="54" x2="13" y2="54" stroke={c} strokeWidth="0.9"/>
      <line x1="7" y1="54" x2="7" y2="56" stroke={c} strokeWidth="0.9"/>
      <line x1="11" y1="54" x2="11" y2="56" stroke={c} strokeWidth="0.9"/>
      <line x1="7" y1="56" x2="11" y2="56" stroke={c} strokeWidth="0.9"/>

      {/* 茶筅：下部右パネル */}
      <line x1="31" y1="43" x2="31" y2="57" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      {/* 茶筅の結び目 */}
      <ellipse cx="31" cy="47" rx="3.5" ry="1.5" stroke={c} strokeWidth="0.8" fill="none"/>
      {/* 穂 */}
      <line x1="27.5" y1="47" x2="26" y2="56" stroke={c} strokeWidth="0.7" strokeLinecap="round"/>
      <line x1="29" y1="48" x2="28" y2="57" stroke={c} strokeWidth="0.7" strokeLinecap="round"/>
      <line x1="31" y1="48" x2="31" y2="57" stroke={c} strokeWidth="0.7" strokeLinecap="round"/>
      <line x1="33" y1="48" x2="34" y2="57" stroke={c} strokeWidth="0.7" strokeLinecap="round"/>
      <line x1="34.5" y1="47" x2="36" y2="56" stroke={c} strokeWidth="0.7" strokeLinecap="round"/>
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
