'use client'
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div style={{textAlign:'center',padding:'40px'}}><button onClick={reset}>נסה שנית</button></div>
}
