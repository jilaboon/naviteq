'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { roleDisplayNames } from '@/lib/permissions'

interface ProfileForm {
  fullName: string
  password: string
  confirmPassword: string
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    defaultValues: {
      fullName: session?.user?.fullName || '',
    },
  })

  const password = watch('password')

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true)
    setMessage('')

    if (data.password && data.password !== data.confirmPassword) {
      setMessage('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const payload: Record<string, string> = {}
      if (data.fullName && data.fullName !== session?.user?.fullName) {
        payload.fullName = data.fullName
      }
      if (data.password) {
        payload.password = data.password
      }

      if (Object.keys(payload).length === 0) {
        setMessage('No changes to save')
        setLoading(false)
        return
      }

      const res = await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setMessage('Profile updated successfully')
        reset({ fullName: data.fullName, password: '', confirmPassword: '' })
        // Update session
        if (payload.fullName) {
          await update({ ...session, user: { ...session?.user, fullName: payload.fullName } })
        }
      } else {
        const error = await res.json()
        setMessage(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <PageHeader title="Profile" description="Manage your account settings" />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your current account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Email</div>
              <div>{session.user.email}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Role</div>
              <div>
                {roleDisplayNames[session.user.role as keyof typeof roleDisplayNames]}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Profile</CardTitle>
            <CardDescription>Change your name or password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {message && (
                <div
                  className={`rounded-md p-3 text-sm ${
                    message.includes('success')
                      ? 'bg-green-50 text-green-600'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  {...register('fullName')}
                  defaultValue={session.user.fullName}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password', {
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                  placeholder="Leave empty to keep current"
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {password && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                  />
                </div>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
