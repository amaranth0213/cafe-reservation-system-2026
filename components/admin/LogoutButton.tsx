'use client';

export function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    window.location.href = '/admin/login';
  };

  return (
    <button onClick={handleLogout} className="text-sm text-matcha-300 hover:text-white transition">
      ログアウト
    </button>
  );
}
