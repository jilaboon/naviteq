'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { customerSchema, CustomerInput } from '@/lib/validations'
import { Plus, Trash2 } from 'lucide-react'

interface Contact {
  name: string
  title?: string
  email?: string
  phone?: string
}

interface User {
  id: string
  fullName: string
}

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: {
    id: string
    name: string
    industry: string | null
    website: string | null
    description: string | null
    contacts: Contact[]
    notes: string | null
    tags: string[]
    owner: { id: string } | null
  }
  onSuccess: () => void
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDialogProps) {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [tags, setTags] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
  })

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => setUsers(data.data || []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (customer) {
      setValue('name', customer.name)
      setValue('industry', customer.industry || '')
      setValue('website', customer.website || '')
      setValue('description', customer.description || '')
      setValue('notes', customer.notes || '')
      setValue('ownerUserId', customer.owner?.id || '')
      setContacts(customer.contacts || [])
      setTags(customer.tags.join(', '))
    } else {
      reset()
      setContacts([])
      setTags('')
    }
  }, [customer, setValue, reset])

  const onSubmit = async (data: CustomerInput) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        contacts,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }

      const url = customer ? `/api/customers/${customer.id}` : '/api/customers'
      const method = customer ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        onSuccess()
        reset()
        setContacts([])
        setTags('')
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Failed to save customer')
      }
    } catch (error) {
      console.error('Error saving customer:', error)
      alert('Failed to save customer')
    } finally {
      setLoading(false)
    }
  }

  const addContact = () => {
    setContacts([...contacts, { name: '', title: '', email: '', phone: '' }])
  }

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index))
  }

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    const updated = [...contacts]
    updated[index] = { ...updated[index], [field]: value }
    setContacts(updated)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {customer ? 'Edit Customer' : 'Add Customer'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Company name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                {...register('industry')}
                placeholder="e.g., Technology, Healthcare"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...register('website')}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of the customer"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerUserId">Owner</Label>
            <Select
              onValueChange={(value) => setValue('ownerUserId', value)}
              defaultValue={customer?.owner?.id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated tags"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Contacts</Label>
              <Button type="button" variant="outline" size="sm" onClick={addContact}>
                <Plus className="mr-1 h-3 w-3" />
                Add Contact
              </Button>
            </div>
            {contacts.map((contact, index) => (
              <div key={index} className="rounded-lg border p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Contact {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeContact(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Name"
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                  />
                  <Input
                    placeholder="Title"
                    value={contact.title || ''}
                    onChange={(e) => updateContact(index, 'title', e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={contact.email || ''}
                    onChange={(e) => updateContact(index, 'email', e.target.value)}
                  />
                  <Input
                    placeholder="Phone"
                    value={contact.phone || ''}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Internal notes"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : customer ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
