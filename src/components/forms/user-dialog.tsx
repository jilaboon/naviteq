'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createUserSchema, updateUserSchema, CreateUserInput, UpdateUserInput } from '@/lib/validations'

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: {
    id: string
    fullName: string
    email: string
    role: string
    isActive: boolean
  }
  onSuccess: () => void
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserDialogProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserInput | UpdateUserInput>({
    resolver: zodResolver(user ? updateUserSchema : createUserSchema),
  })

  useEffect(() => {
    if (user) {
      setValue('fullName', user.fullName)
      setValue('email', user.email)
      setValue('role', user.role as CreateUserInput['role'])
      setValue('isActive', user.isActive)
    } else {
      reset()
    }
  }, [user, setValue, reset])

  const onSubmit = async (data: CreateUserInput | UpdateUserInput) => {
    setLoading(true)
    try {
      const url = user ? `/api/users/${user.id}` : '/api/users'
      const method = user ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        onSuccess()
        reset()
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Failed to save user')
      }
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Failed to save user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add User'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              {...register('fullName')}
              placeholder="John Doe"
            />
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="john@naviteq.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password {user ? '(leave empty to keep current)' : '*'}
            </Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder={user ? '••••••••' : 'Min 8 characters'}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Role *</Label>
            <Select
              onValueChange={(value) => setValue('role', value as CreateUserInput['role'])}
              defaultValue={user?.role}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="SALES">Sales</SelectItem>
                <SelectItem value="RECRUITER">Recruiter</SelectItem>
                <SelectItem value="CLIENT_MANAGER">Client Manager</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>

          {user && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                onValueChange={(value) => setValue('isActive', value === 'true')}
                defaultValue={user.isActive ? 'true' : 'false'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : user ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
