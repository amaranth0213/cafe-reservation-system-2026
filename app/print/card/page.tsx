'use client';

const RESERVE_URL = 'https://cafe-reservation-system-2026.vercel.app/reserve';
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(RESERVE_URL)}&margin=0`;

function Card() {
  return (
    <div style={{
      width: '91mm',
      height: '55mm',
      background: 'white',
      boxSizing: 'border-box',
      padding: '4mm',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'stretch',
      fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif',
    }}>

      {/* 左エリア：店名・あいさつ */}
      <div style={{
        width: '32mm',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        flexShrink: 0,
        paddingRight: '3mm',
        borderRight: '0.3px solid #c8b89a',
      }}>
        <div style={{ fontSize: '5pt', color: '#888', letterSpacing: '0.15em', marginBottom: '1mm' }}>
          お茶と甘いもの
        </div>
        <div style={{ fontSize: '14pt', color: '#5c3d2e', letterSpacing: '0.1em', fontWeight: '400', lineHeight: 1.1, marginBottom: '2mm' }}>
          あまらんす
        </div>
        <div style={{ fontSize: '5.5pt', color: '#666', letterSpacing: '0.1em', marginBottom: '1.5mm' }}>
          毎週月曜日営業
        </div>
        <div style={{ fontSize: '7pt', color: '#5c3d2e', letterSpacing: '0.05em' }}>
          いらっしゃいませ！
        </div>
      </div>

      {/* 中央エリア：QRコード */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 3mm',
        flexShrink: 0,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={QR_URL}
          alt="予約QRコード"
          style={{ width: '26mm', height: '26mm' }}
        />
        <div style={{ fontSize: '4.5pt', color: '#5c3d2e', marginTop: '1mm', letterSpacing: '0.05em' }}>
          ▲ ご予約はこちら
        </div>
      </div>

      {/* 右エリア：案内文 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingLeft: '3mm',
        borderLeft: '0.3px solid #c8b89a',
      }}>
        <div style={{ fontSize: '4.5pt', color: '#555', lineHeight: 1.8 }}>
          <div>・予約確認メールは届きません</div>
          <div>　予約番号を画面保存ください</div>
          <div style={{ marginTop: '1mm' }}>・予約日時・番号を</div>
          <div>　必ずご確認ください</div>
          <div style={{ marginTop: '1mm' }}>・キャンセルは</div>
          <div>　Instagram DMから</div>
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
            margin: 11mm 14mm;
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
          A-ONE 51835 用 予約案内カード（10枚 / A4）
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

      {/* カードシート：2列 × 5行 = 10枚（横向き91×55mm） */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 91mm)',
        gridTemplateRows: 'repeat(5, 55mm)',
        width: '182mm',
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
