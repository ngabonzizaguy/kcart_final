'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

export default function SignupPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Simple validation
    if (!businessName || !email || !password) {
      showToast({
        type: 'error',
        message: 'Please fill in all fields',
      })
      return
    }

    if (password.length < 6) {
      showToast({
        type: 'error',
        message: 'Minimum 6 characters',
      })
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName,
          },
        },
      })

      if (error) {
        showToast({
          type: 'error',
          message: 'Something went wrong',
        })
        return
      }

      showToast({
        type: 'success',
        message: "Welcome! Let's get your restaurant online.",
      })

      // Start onboarding immediately
      router.push('/onboarding/business-info')
      router.refresh()
    } catch {
      showToast({
        type: 'error',
        message: 'Something went wrong',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-orange bg-clip-text text-transparent mb-2">
            DeliGo
          </h1>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
            Create your account
          </h2>
          <p className="text-gray-600 text-sm md:text-base">
            Start selling online today
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <Input
            label="Business Name"
            type="text"
            placeholder="My Restaurant"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            fullWidth
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            helperText="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
            size="lg"
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-700 underline"
            >
              Login
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
