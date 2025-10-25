'use client'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          ✅ Success! You have admin access.
        </p>
        
        <div className="mt-8 space-y-4">
          <a 
            href="/admin/vendors" 
            className="block p-4 bg-white rounded-lg shadow hover:shadow-md"
          >
            📊 Vendors
          </a>
          <a 
            href="/dashboard" 
            className="block p-4 bg-white rounded-lg shadow hover:shadow-md"
          >
            🏠 Back to Vendor Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}