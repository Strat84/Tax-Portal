'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function TaxProMessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1')
  const [newMessage, setNewMessage] = useState('')
  const [composeDialogOpen, setComposeDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'conversations' | 'list'>('conversations')

  // TODO: Fetch from API
  const conversations = [
    {
      id: '1',
      clientName: 'John Doe',
      clientInitials: 'JD',
      lastMessage: 'Sure, I\'ll upload them today.',
      lastMessageTime: '10 minutes ago',
      unreadCount: 1,
      isActive: true,
      priority: 'normal',
    },
    {
      id: '2',
      clientName: 'Jane Smith',
      clientInitials: 'JS',
      lastMessage: 'Thank you for the update!',
      lastMessageTime: '2 hours ago',
      unreadCount: 0,
      isActive: true,
      priority: 'normal',
    },
    {
      id: '3',
      clientName: 'Mike Johnson',
      clientInitials: 'MJ',
      lastMessage: 'When is the deadline?',
      lastMessageTime: '1 day ago',
      unreadCount: 2,
      isActive: true,
      priority: 'high',
    },
  ]

  const messages = [
    {
      id: '1',
      senderId: 'tax-pro-1',
      senderName: 'You',
      content: 'Hi! I\'ve started reviewing your documents for the 2025 tax year.',
      timestamp: '2025-02-20 10:30 AM',
      isFromClient: false,
    },
    {
      id: '2',
      senderId: 'client-1',
      senderName: 'John Doe',
      content: 'Great! Let me know if you need anything else.',
      timestamp: '2025-02-20 11:15 AM',
      isFromClient: true,
    },
    {
      id: '3',
      senderId: 'tax-pro-1',
      senderName: 'You',
      content: 'I\'ve reviewed your W-2. Could you also upload your 1099 forms?',
      timestamp: '2025-02-20 2:45 PM',
      isFromClient: false,
    },
    {
      id: '4',
      senderId: 'client-1',
      senderName: 'John Doe',
      content: 'Sure, I\'ll upload them today.',
      timestamp: '2025-02-20 3:00 PM',
      isFromClient: true,
    },
  ]

  const allMessages = [
    {
      id: '1',
      clientName: 'John Doe',
      subject: 'Document upload',
      preview: 'Sure, I\'ll upload them today.',
      timestamp: '10 minutes ago',
      unread: true,
      priority: 'normal',
    },
    {
      id: '2',
      clientName: 'Mike Johnson',
      subject: 'Tax deadline question',
      preview: 'When is the deadline?',
      timestamp: '1 day ago',
      unread: true,
      priority: 'high',
    },
    {
      id: '3',
      clientName: 'Jane Smith',
      subject: 'Status update',
      preview: 'Thank you for the update!',
      timestamp: '2 hours ago',
      unread: false,
      priority: 'normal',
    },
  ]

  const stats = [
    { label: 'Total Messages', value: '89', icon: '💬' },
    { label: 'Unread', value: '12', icon: '📩' },
    { label: 'Conversations', value: '24', icon: '👥' },
    { label: 'Response Rate', value: '98%', icon: '⚡' },
  ]

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    // TODO: Send message via API
    console.log('Sending message:', newMessage)
    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' ||
                          (filterStatus === 'unread' && conv.unreadCount > 0) ||
                          (filterStatus === 'priority' && conv.priority === 'high')
    return matchesSearch && matchesFilter
  })

  const selectedConv = conversations.find(c => c.id === selectedConversation)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-2">
            Communicate with your clients
          </p>
        </div>
        <Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
              <DialogDescription>
                Send a message to a client
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Client</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john-doe">John Doe</SelectItem>
                    <SelectItem value="jane-smith">Jane Smith</SelectItem>
                    <SelectItem value="mike-johnson">Mike Johnson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input placeholder="Enter subject..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  placeholder="Type your message..."
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setComposeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setComposeDialogOpen(false)}>
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <span className="text-2xl">{stat.icon}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Mode Toggle */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="list">All Messages</TabsTrigger>
        </TabsList>

        {/* Conversations View */}
        <TabsContent value="conversations" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
            {/* Conversations Sidebar */}
            <Card>
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
                <CardDescription>Active client threads</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search & Filter */}
                <div className="space-y-2 mb-4">
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Messages</SelectItem>
                      <SelectItem value="unread">Unread Only</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conversation List */}
                <div className="space-y-2">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedConversation === conv.id
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {conv.clientInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm truncate">
                              {conv.clientName}
                            </p>
                            <div className="flex items-center gap-1">
                              {conv.priority === 'high' && (
                                <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                                  !
                                </Badge>
                              )}
                              {conv.unreadCount > 0 && (
                                <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {conv.lastMessageTime}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {filteredConversations.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No conversations found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Thread */}
            {selectedConv ? (
              <Card className="flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {selectedConv.clientInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{selectedConv.clientName}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          Active
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        View Client
                      </Button>
                      {selectedConv.priority === 'high' && (
                        <Badge variant="destructive">High Priority</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromClient ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.isFromClient
                            ? 'bg-slate-100 dark:bg-slate-800'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">{message.senderName}</p>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.isFromClient
                            ? 'text-muted-foreground'
                            : 'text-primary-foreground/70'
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        rows={3}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Press Enter to send, Shift+Enter for new line
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        title="Attach file"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                      </Button>
                      <Button onClick={handleSendMessage} size="icon">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
                  <p className="text-muted-foreground">
                    Select a conversation from the left to start messaging
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* All Messages List View */}
        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Messages</CardTitle>
              <CardDescription>Complete message history across all clients</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allMessages.map((msg) => (
                    <TableRow key={msg.id} className={msg.unread ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}>
                      <TableCell className="font-medium">{msg.clientName}</TableCell>
                      <TableCell>{msg.subject}</TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-xs">
                        {msg.preview}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{msg.timestamp}</TableCell>
                      <TableCell>
                        {msg.unread ? (
                          <Badge variant="default">Unread</Badge>
                        ) : (
                          <Badge variant="secondary">Read</Badge>
                        )}
                        {msg.priority === 'high' && (
                          <Badge variant="destructive" className="ml-1">High</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
