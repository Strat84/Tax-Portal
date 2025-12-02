import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-primary-foreground"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Tax Portal
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-5xl font-bold text-slate-900 dark:text-slate-100">
            Secure Tax Document Management
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            A modern, secure platform for managing tax documents and communicating with your tax professional
          </p>
          <div className="flex items-center justify-center space-x-4 pt-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Create account
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Everything you need
          </h3>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Powerful features to streamline your tax preparation process
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Feature 1 */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>
                Upload, organize, and manage all your tax documents in one secure place with folder organization and tagging
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 2 */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <CardTitle>Secure Messaging</CardTitle>
              <CardDescription>
                Communicate directly with your tax professional through encrypted messaging with file attachments
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 3 */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <CardTitle>Status Tracking</CardTitle>
              <CardDescription>
                Track the progress of your tax return from document collection to filing with real-time updates
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 4 */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <CardTitle>Bank-Level Security</CardTitle>
              <CardDescription>
                Your data is protected with enterprise-grade encryption, MFA, and comprehensive audit logging
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 5 */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Stay informed with email alerts for new messages, document requests, and status changes
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Feature 6 */}
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <CardTitle>E-Signatures</CardTitle>
              <CardDescription>
                Sign documents electronically with legally-binding digital signatures - no printing required
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-3xl mx-auto border-slate-200 dark:border-slate-700 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-12 text-center space-y-6">
            <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Ready to get started?
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Join thousands of clients who trust us with their tax documents
            </p>
            <Link href="/signup">
              <Button size="lg" className="text-lg px-12">
                Create your free account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              &copy; {new Date().getFullYear()} Tax Portal. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
