/**
 * ClientsTable component for displaying all clients in a table
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientItem } from '@/graphql/types/clients'
import { ClientRow } from './ClientRow'

interface ClientsTableProps {
  clients: ClientItem[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  searchActive: boolean
  onLoadMore: () => void
  loadMoreRef?: React.RefObject<HTMLDivElement>
}

export function ClientsTable({
  clients,
  loading,
  loadingMore,
  hasMore,
  searchActive,
  onLoadMore,
  loadMoreRef,
}: ClientsTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>View and manage your client list</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Pending Docs</TableHead>
                <TableHead className="text-center">Messages</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Tax Year</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 dark:border-gray-100"></div>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Clients</CardTitle>
        <CardDescription>View and manage your client list</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Pending Docs</TableHead>
              <TableHead className="text-center">Messages</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Tax Year</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {searchActive ? 'No clients match your search or filters' : 'No clients found'}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {clients.map((client) => (
                  <ClientRow key={client.id} client={client} />
                ))}
                {hasMore && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      <div ref={loadMoreRef}>
                        {loadingMore && (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
