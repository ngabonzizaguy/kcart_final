'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupInput } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

export default function SignupPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupInput) => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Sign up user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            business_name: data.businessName,
          },
        },
      })

      if (signUpError) {
        showToast({
          type: 'error',
          title: 'Signup Failed',
          message: signUpError.message,
        })
        return
      }

      if (authData.user) {
        showToast({
          type: 'success',
          message: 'Account created! Starting onboarding...',
        })

        // Redirect to onboarding
        router.push('/onboarding/business-info')
        router.refresh()
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-orange bg-clip-text text-transparent mb-2">
            DeliGo
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Create your account
          </h2>
          <p className="text-gray-600">
            Start selling online today
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Business Name"
            type="text"
            placeholder="My Restaurant"
            {...register('businessName')}
            error={errors.businessName?.message}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            error={errors.email?.message}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            helperText="At least 6 characters"
            {...register('password')}
            error={errors.password?.message}
            required
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Login
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
