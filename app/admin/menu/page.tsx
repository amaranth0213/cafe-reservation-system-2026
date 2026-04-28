'use client';

import { useState, useEffect } from 'react';
import type { Menu } from '@/types';

export default function AdminMenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Menu> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchMenus = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/menu');
    const data = await res.json();
    setMenus(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchMenus(); }, []);

  const handleSave = async () => {
    if (!editing?.name?.trim()) return;
    setSaving(true);

    const method = isNew ? 'POST' : 'PATCH';
    const body = isNew
      ? { name: editing.name, description: editing.description, price: editing.price ?? 0, is_available: editing.is_available ?? true, sort_order: editing.sort_order ?? 0, stock: editing.stock ?? null, hold_count: editing.hold_count ?? 0, is_takeout_available: editing.is_takeout_available ?? true }
      : { id: editing.id, name: editing.name, description: editing.description, price: editing.price, is_available: editing.is_available, sort_order: editing.sort_order, stock: editing.stock ?? null, hold_count: editing.hold_count ?? 0, is_takeout_available: editing.is_takeout_available ?? true };

    const res = await fetch('/api/admin/menu', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setMessage(isNew ? 'メニューを追加しました' : '更新しました');
      setEditing(null);
      fetchMenus();
    } else {
      const data = await res.json();
      setMessage(data.error ?? '保存に失敗しました');
    }
    setSaving(false);
  };

  const handleToggleAvailable = async (menu: Menu) => {
    const res = await fetch('/api/admin/menu', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: menu.id, is_available: !menu.is_available }),
    });
    if (res.ok) fetchMenus();
  };

  const handleDelete = async (menu: Menu) => {
    if (!confirm(`「${menu.name}」を削除しますか？`)) return;
    const res = await fetch(`/api/admin/menu?id=${menu.id}`, { method: 'DELETE' });
    if (res.ok) { setMessage('削除しました'); fetchMenus(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif text-gray-800">メニュー管理</h1>
        <button
          onClick={() => { setIsNew(true); setEditing({ name: '', price: 0, is_available: true, sort_order: menus.length + 1 }); }}
          className="btn-primary py-2 px-4 text-sm"
        >
          + メニューを追加
        </button>
      </div>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex justify-between">
          {message}
          <button onClick={() => setMessage('')}>×</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">順番</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">メニュー名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">価格</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">表示</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {menus.map((menu) => (
                <tr key={menu.id} className={!menu.is_available ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 text-gray-500">{menu.sort_order}</td>
                  <td className="px-4 py-3 font-medium">
                    {menu.name}
                    {menu.description && <p className="text-xs text-gray-400">{menu.description}</p>}
                  </td>
                  <td className="px-4 py-3">¥{menu.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleAvailable(menu)}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                        menu.is_available
                          ? 'bg-matcha-100 text-matcha-700 hover:bg-matcha-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {menu.is_available ? '表示中' : '非表示'}
                    </button>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => { setIsNew(false); setEditing({ ...menu }); }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(menu)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 編集/追加モーダル */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-4">{isNew ? 'メニューを追加' : 'メニューを編集'}</h3>
            <div className="space-y-4">
              <div>
                <label className="label">メニュー名 *</label>
                <input
                  type="text"
                  value={editing.name ?? ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="input"
                  placeholder="例: 抹茶のテリーヌ"
                />
              </div>
              <div>
                <label className="label">説明</label>
                <input
                  type="text"
                  value={editing.description ?? ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="input"
                  placeholder="例: 濃厚な抹茶の風味が楽しめます"
                />
              </div>
              <div>
                <label className="label">価格（円）</label>
                <input
                  type="number"
                  value={editing.price ?? 0}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                  className="input"
                  min="0"
                />
              </div>
              <div>
                <label className="label">表示順</label>
                <input
                  type="number"
                  value={editing.sort_order ?? 0}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  className="input"
                  min="0"
                />
              </div>
              <div>
                <label className="label">総在庫数（空欄＝無制限、0＝完売）</label>
                <input
                  type="number"
                  value={editing.stock ?? ''}
                  onChange={(e) => setEditing({ ...editing, stock: e.target.value === '' ? null : Number(e.target.value) })}
                  className="input"
                  min="0"
                  placeholder="例: 10（実際に用意する個数）"
                />
              </div>
              <div>
                <label className="label">当日取り置き数（席のみの方用・0でも可）</label>
                <input
                  type="number"
                  value={editing.hold_count ?? 0}
                  onChange={(e) => setEditing({ ...editing, hold_count: Number(e.target.value) })}
                  className="input"
                  min="0"
                  placeholder="例: 2（事前予約に使わず当日に残しておく個数）"
                />
                {(editing.stock != null) && (
                  <p className="text-xs text-gray-400 mt-1">
                    → 事前予約上限：{Math.max(0, (editing.stock ?? 0) - (editing.hold_count ?? 0))}個
                  </p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.is_available ?? true}
                  onChange={(e) => setEditing({ ...editing, is_available: e.target.checked })}
                  className="accent-matcha-600"
                />
                予約フォームに表示する
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.is_takeout_available ?? true}
                  onChange={(e) => setEditing({ ...editing, is_takeout_available: e.target.checked })}
                  className="accent-matcha-600"
                />
                テイクアウト可能
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="btn-secondary flex-1 py-2">キャンセル</button>
              <button onClick={handleSave} disabled={saving || !editing.name?.trim()} className="btn-primary flex-1 py-2">
                {saving ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
