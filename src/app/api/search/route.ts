import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { searchQuerySchema } from '@/lib/validations'
import { hasPermission } from '@/lib/permissions'
import {
  searchCustomers,
  searchProjects,
  searchCandidates,
  searchEngineers,
  searchUsers,
} from '@/lib/search'
import { SearchResponse, SearchResults } from '@/types/search'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rawParams = {
      q: searchParams.get('q') || '',
      limit: searchParams.get('limit') || '5',
    }

    const validationResult = searchQuerySchema.safeParse(rawParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { q: query, limit } = validationResult.data
    const role = session.user.role

    // Build search promises based on user permissions
    const searchPromises: Promise<unknown>[] = []
    const searchKeys: (keyof SearchResults)[] = []

    // Customers
    if (hasPermission(role, 'customers:read')) {
      searchPromises.push(searchCustomers(query, limit))
      searchKeys.push('customers')
    }

    // Projects
    if (hasPermission(role, 'projects:read')) {
      searchPromises.push(searchProjects(query, limit))
      searchKeys.push('projects')
    }

    // Candidates
    if (hasPermission(role, 'candidates:read')) {
      searchPromises.push(searchCandidates(query, limit))
      searchKeys.push('candidates')
    }

    // Engineers
    if (hasPermission(role, 'engineers:read')) {
      searchPromises.push(searchEngineers(query, limit))
      searchKeys.push('engineers')
    }

    // Users (only admins can search users)
    if (hasPermission(role, 'users:read')) {
      searchPromises.push(searchUsers(query, limit))
      searchKeys.push('users')
    }

    // Execute all searches in parallel
    const searchResults = await Promise.all(searchPromises)

    // Build categorized results
    const results: SearchResults = {
      customers: [],
      projects: [],
      candidates: [],
      engineers: [],
      users: [],
    }

    searchKeys.forEach((key, index) => {
      results[key] = searchResults[index] as never[]
    })

    // Calculate total count
    const totalCount = Object.values(results).reduce(
      (sum, arr) => sum + arr.length,
      0
    )

    const response: SearchResponse = {
      results,
      meta: {
        totalCount,
        queryTimeMs: Date.now() - startTime,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
