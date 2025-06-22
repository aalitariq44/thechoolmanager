'use client';

export default function BooksPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem'
      }}
    >
      <h1
        style={{
          marginBottom: '1rem',
          fontWeight: 'bold',
          color: '#1976d2'
        }}
      >
        قريباً
      </h1>
      <h2 style={{ color: '#666' }}>
        سيتم إطلاق هذه الخدمة قريباً
      </h2>
    </div>
  );
}
