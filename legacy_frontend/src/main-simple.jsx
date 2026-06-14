import React from 'react'
import ReactDOM from 'react-dom/client'

// Simple test component
function SimpleApp() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white',
      textAlign: 'center'
    }}>
      <h1>🎯 GlobalScout React Test</h1>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '20px',
        borderRadius: '10px',
        margin: '20px auto',
        maxWidth: '600px'
      }}>
        <h2>✅ React Works!</h2>
        <p>If you see this, React is working correctly.</p>
        <p><strong>Time:</strong> {new Date().toLocaleString('en-US')}</p>
        
        <div style={{ margin: '20px 0' }}>
          <button 
            onClick={() => alert('JavaScript works!')}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '5px'
            }}
          >
            Test JavaScript
          </button>
          
          <button 
            onClick={() => window.location.href = '/test-simple.html'}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              margin: '5px'
            }}
          >
            Go to HTML Test
          </button>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '15px',
          borderRadius: '5px',
          textAlign: 'left'
        }}>
          <h3>🔧 Next Steps:</h3>
          <ol>
            <li>If you see this → React mounting works ✅</li>
            <li>The issue is likely with AuthContext or routing</li>
            <li>Go back to normal app and check the console</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

console.log('🚀 Simple React App Starting...')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SimpleApp />
  </React.StrictMode>
)

console.log('✅ Simple React App Mounted!')