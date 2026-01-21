'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/page-header'
import { CustomerDialog } from '@/components/forms/customer-dialog'
import { ActivityList } from '@/components/activity-list'
import { formatDate } from '@/lib/utils'
import { projectStatusLabels, projectStatusColors } from '@/types'

interface Contact {
  name: string
  title?: string
  email?: string
  phone?: string
}

interface Customer {
  id: string
  name: string
  industry: string | null
  website: string | null
  description: string | null
  contacts: Contact[]
  notes: string | null
  tags: string[]
  owner: { id: string; fullName: string } | null
  projects: Array<{
    id: string
    title: string
    status: string
    priority: string
    createdAt: string
  }>
  createdAt: string
  updatedAt: string
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCustomer(data.data)
    } catch (error) {
      console.error('Error fetching customer:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomer()
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    try {
      const res = await fetch(`/api/customers/${params.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/customers')
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>
  }

  if (!customer) {
    return <div className="flex items-center justify-center py-12">Customer not found</div>
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/customers"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Customers
        </Link>
      </div>

      <PageHeader
        title={customer.name}
        description={customer.industry || undefined}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="projects">Projects ({customer.projects.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.website && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Website</div>
                    <a
                      href={customer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:underline"
                    >
                      {customer.website}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                )}
                {customer.description && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Description</div>
                    <div className="text-sm">{customer.description}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-gray-500">Owner</div>
                  <div className="text-sm">{customer.owner?.fullName || 'Unassigned'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Tags</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {customer.tags.length > 0 ? (
                      customer.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No tags</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Created</div>
                    <div className="text-sm">{formatDate(customer.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Updated</div>
                    <div className="text-sm">{formatDate(customer.updatedAt)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {customer.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm">{customer.notes}</div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.contacts.length === 0 ? (
                <p className="text-gray-500">No contacts added</p>
              ) : (
                <div className="space-y-4">
                  {customer.contacts.map((contact, idx) => (
                    <div key={idx} className="rounded-lg border p-4">
                      <div className="font-medium">{contact.name}</div>
                      {contact.title && (
                        <div className="text-sm text-gray-500">{contact.title}</div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-4 text-sm">
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-blue-600">
                            {contact.email}
                          </a>
                        )}
                        {contact.phone && <span>{contact.phone}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Projects</CardTitle>
              <Link href={`/projects?customerId=${customer.id}`}>
                <Button size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {customer.projects.length === 0 ? (
                <p className="text-gray-500">No projects yet</p>
              ) : (
                <div className="space-y-3">
                  {customer.projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium">{project.title}</div>
                        <div className="text-sm text-gray-500">
                          Created {formatDate(project.createdAt)}
                        </div>
                      </div>
                      <Badge className={projectStatusColors[project.status as keyof typeof projectStatusColors]}>
                        {projectStatusLabels[project.status as keyof typeof projectStatusLabels]}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityList entityType="Customer" entityId={customer.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CustomerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        customer={customer}
        onSuccess={() => {
          setEditDialogOpen(false)
          fetchCustomer()
        }}
      />
    </div>
  )
}
