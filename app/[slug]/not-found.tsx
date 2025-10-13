import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-warm">
      <Card className="max-w-md text-center">
        <div className="text-6xl font-bold text-primary-500 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Storefront Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          This vendor doesn't exist or may have been removed.
        </p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </Card>
    </div>
  )
}
