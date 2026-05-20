'use client'

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <p>שגיאה בטעינת הדשבורד</p>
      <button onClick={reset} style={{ marginTop: '16px', cursor: 'pointer' }}>
        נסה שנית
      </button>
    </div>
  )
}
