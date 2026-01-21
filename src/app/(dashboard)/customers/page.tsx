'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/layout/page-header'
import { CustomerDialog } from '@/components/forms/customer-dialog'
import { formatDate } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  industry: string | null
  website: string | null
  tags: string[]
  owner: { fullName: string } | null
  _count: { projects: number }
  updatedAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/customers?${params}`)
      const data = await res.json()
      setCustomers(data.data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const debounce = setTimeout(fetchCustomers, 300)
    return () => clearTimeout(debounce)
  }, [fetchCustomers])

  const handleCreated = () => {
    setDialogOpen(false)
    fetchCustomers()
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage your customer relationships"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Building2 className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-gray-500">No customers found</p>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell>{customer.industry || '-'}</TableCell>
                  <TableCell>{customer.owner?.fullName || '-'}</TableCell>
                  <TableCell>{customer._count.projects}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {customer.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{customer.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(customer.updatedAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleCreated}
      />
    </div>
  )
}
