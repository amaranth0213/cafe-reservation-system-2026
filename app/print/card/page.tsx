'use client';

const RESERVE_URL = 'https://cafe-reservation-system-2026.vercel.app/reserve';
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(RESERVE_URL)}&margin=0`;

function Card() {
  return (
    <div style={{
      width: '55mm',
      height: '91mm',
      background: 'white',
      boxSizing: 'border-box',
      padding: '4mm 4mm 3mm 4mm',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif',
    }}>
      {/* 店名 */}
      <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
        <div style={{ fontSize: '6pt', color: '#5c3d2e', letterSpacing: '0.2em', marginBottom: '0.5mm' }}>
          お茶と甘いもの
        </div>
        <div style={{ fontSize: '16pt', color: '#5c3d2e', letterSpacing: '0.15em', fontWeight: '400', lineHeight: 1.1 }}>
          あまらんす
        </div>
        <div style={{ fontSize: '6pt', color: '#888', marginTop: '0.5mm', letterSpacing: '0.1em' }}>
          毎週月曜日営業
        </div>
      </div>

      {/* 区切り線 */}
      <div style={{ width: '40mm', borderTop: '0.3px solid #c8b89a', marginBottom: '2mm' }} />

      {/* いらっしゃいませ */}
      <div style={{ fontSize: '8pt', color: '#5c3d2e', letterSpacing: '0.1em', marginBottom: '2mm' }}>
        いらっしゃいませ！
      </div>

      {/* QRコード */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={QR_URL}
        alt="予約QRコード"
        style={{ width: '28mm', height: '28mm', marginBottom: '2mm' }}
      />

      {/* ご予約はこちら */}
      <div style={{ fontSize: '6pt', color: '#5c3d2e', letterSpacing: '0.1em', marginBottom: '2.5mm' }}>
        ▲ ご予約はこちら
      </div>

      {/* 区切り線 */}
      <div style={{ width: '40mm', borderTop: '0.3px solid #c8b89a', marginBottom: '2mm' }} />

      {/* 案内文 */}
      <div style={{ fontSize: '5pt', color: '#555', lineHeight: 1.6, textAlign: 'left', width: '100%' }}>
        <div>・予約確認メールは届きません</div>
        <div>　予約番号を画面保存ください</div>
        <div>・予約日時・番号を必ずご確認</div>
        <div>　ください</div>
        <div>・キャンセルはInstagramの</div>
        <div>　DMからお願いします</div>
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
        }
      `}</style>

      {/* 印刷ボタン */}
      <div className="no-print" style={{
        padding: '16px',
        textAlign: 'center',
        background: '#f8f6f0',
        borderBottom: '1px solid #e0d8cc',
      }}>
        <p style={{ color: '#5c3d2e', marginBottom: '8px', fontSize: '14px' }}>
          予約案内カード（10枚 / A4）
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

      {/* カードシート：2列 × 5行 = 10枚（縦向き55×91mm） */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 55mm)',
        gridTemplateRows: 'repeat(5, 91mm)',
        width: '110mm',
        margin: '0 auto',
        background: 'white',
      }}>
        {Array.from({ length: 10 }, (_, i) => (
          <Card key={i} />
        ))}
      </div>
    </>
  );
}
