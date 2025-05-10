"use client"

import { useState } from "react"
import Link from "next/link"
import {
  FilePlus,
  FileText,
  LayoutTemplate,
  Users,
  BarChart3,
  Star,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle2,
  Activity,
  TrendingUp,
  MessageSquare,
  Download,
  Share2,
  Edit3,
  Search,
  Plus,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { useIsMobile } from "@/components/ui/use-mobile"
import DashboardSidebar from "@/components/ui/DashboardSidebar"

export default function DashboardPage() {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState("overview")

  // Sample data for recent documents
  const recentDocuments = [
    {
      id: "1",
      title: "Invoice #2023-001",
      date: "2 hours ago",
      type: "Invoice",
      status: "completed",
      thumbnail: "/placeholder.svg?height=400&width=300",
    },
    {
      id: "2",
      title: "Project Proposal",
      date: "Yesterday",
      type: "Proposal",
      status: "draft",
      thumbnail: "/placeholder.svg?height=400&width=300",
    },
    {
      id: "3",
      title: "Monthly Report",
      date: "3 days ago",
      type: "Report",
      status: "completed",
      thumbnail: "/placeholder.svg?height=400&width=300",
    },
    {
      id: "4",
      title: "Client Contract",
      date: "1 week ago",
      type: "Contract",
      status: "review",
      thumbnail: "/placeholder.svg?height=400&width=300",
    },
  ]

  // Sample data for templates
  const popularTemplates = [
    {
      id: "1",
      title: "Professional Invoice",
      category: "Invoice",
      uses: 2453,
      thumbnail: "/placeholder.svg?height=400&width=300",
    },
    {
      id: "2",
      title: "Business Report",
      category: "Report",
      uses: 1872,
      thumbnail: "/placeholder.svg?height=400&width=300",
    },
    {
      id: "3",
      title: "Project Proposal",
      category: "Proposal",
      uses: 1654,
      thumbnail: "/placeholder.svg?height=400&width=300",
    },
  ]

  // Sample data for activity timeline
  const activityTimeline = [
    {
      id: "1",
      action: "Created new document",
      document: "Q2 Financial Report",
      user: "You",
      time: "2 hours ago",
      icon: <FilePlus className="h-4 w-4" />,
    },
    {
      id: "2",
      action: "Shared document",
      document: "Marketing Proposal",
      user: "You",
      time: "Yesterday",
      icon: <Share2 className="h-4 w-4" />,
    },
    {
      id: "3",
      action: "Commented on",
      document: "Client Contract",
      user: "Jane Smith",
      time: "2 days ago",
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      id: "4",
      action: "Edited",
      document: "Invoice #2023-001",
      user: "Robert Johnson",
      time: "3 days ago",
      icon: <Edit3 className="h-4 w-4" />,
    },
    {
      id: "5",
      action: "Downloaded",
      document: "Project Timeline",
      user: "You",
      time: "1 week ago",
      icon: <Download className="h-4 w-4" />,
    },
  ]

  // Sample data for team members
  const teamMembers = [
    { id: "1", name: "Jane Smith", role: "Designer", avatar: "/placeholder.svg?height=40&width=40", status: "online" },
    {
      id: "2",
      name: "Robert Johnson",
      role: "Manager",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "offline",
    },
    {
      id: "3",
      name: "Emily Davis",
      role: "Content Writer",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "online",
    },
  ]

  // Sample data for upcoming deadlines
  const upcomingDeadlines = [
    { id: "1", title: "Client Proposal", deadline: "Tomorrow", priority: "high" },
    { id: "2", title: "Quarterly Report", deadline: "In 3 days", priority: "medium" },
    { id: "3", title: "Marketing Materials", deadline: "Next week", priority: "low" },
  ]

  // Sample data for document analytics
  const documentAnalytics = {
    created: 24,
    shared: 18,
    downloaded: 42,
    viewed: 156,
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "draft":
        return "bg-yellow-500"
      case "review":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return <Badge variant="default">Medium</Badge>
      case "low":
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="outline">Normal</Badge>
    }
  }

  // Sidebar tabs for dashboard
  const dashboardTabs = [
    { id: "overview", label: "Overview", icon: <FileText className="h-4 w-4 mr-2" /> },
    { id: "activity", label: "Activity", icon: <Activity className="h-4 w-4 mr-2" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4 mr-2" /> },
    { id: "team", label: "Team", icon: <Users className="h-4 w-4 mr-2" /> },
    { id: "templates", label: "Templates", icon: <LayoutTemplate className="h-4 w-4 mr-2" /> },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row gap-4 h-full min-h-screen">
        {/* Secondary Sidebar */}
        {!isMobile && (
          <DashboardSidebar
            headline="Dashboard"
            icon={<BarChart3 className="h-6 w-6" />}
            tabs={dashboardTabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}
        {/* Main Content */}
        <div className="flex-1 px-4 py-8">
          {/* Mobile Tabs */}
          {isMobile && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="w-full overflow-x-auto">
                {dashboardTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center">
                    {tab.icon}
                    <span className="ml-1">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
          {/* Header with search, notification, and create template */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                className="pl-9"
                // Optionally, add value/onChange if you want search to work
              />
            </div>
            <div className="flex gap-2 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Bell className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-medium">Notifications</h3>
                    <Button variant="ghost" size="sm">
                      Mark all as read
                    </Button>
                  </div>
                  <div className="py-2">
                    <DropdownMenuItem className="p-3 cursor-pointer">
                      <div className="flex gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>JS</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">Jane Smith</span> commented on your document
                          </p>
                          <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 cursor-pointer">
                      <div className="flex gap-3">
                        <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center">
                          <Share2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm">
                            Your document was shared with <span className="font-medium">3 people</span>
                          </p>
                          <p className="text-xs text-muted-foreground">Yesterday</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 cursor-pointer">
                      <div className="flex gap-3">
                        <div className="h-9 w-9 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm">
                            Document <span className="font-medium">Invoice #2023-001</span> was approved
                          </p>
                          <p className="text-xs text-muted-foreground">3 days ago</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </div>
                  <div className="p-4 border-t text-center">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="#">View all notifications</Link>
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="default" asChild>
                <Link href="/editor">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">142</div>
                <div className="flex items-center pt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <p className="text-xs text-green-500">+6 from last month</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Templates Used</CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <LayoutTemplate className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <div className="flex items-center pt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <p className="text-xs text-green-500">+2 from last month</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2 GB</div>
                <div className="pt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>1.2 GB of 5 GB</span>
                    <span>24%</span>
                  </div>
                  <Progress value={24} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7</div>
                <div className="flex -space-x-2 pt-2">
                  {teamMembers.map((member, index) => (
                    <Avatar key={member.id} className="border-2 border-background h-7 w-7">
                      <AvatarFallback>
                        {member.name.charAt(0)}
                        {member.name.split(" ")[1]?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    +4
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document Analytics */}
          <div className="mb-8">
            <h2 className="mb-4">Document Analytics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                    <FilePlus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold">{documentAnalytics.created}</div>
                  <p className="text-sm text-muted-foreground">Created</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                    <Share2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold">{documentAnalytics.shared}</div>
                  <p className="text-sm text-muted-foreground">Shared</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                    <Download className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold">{documentAnalytics.downloaded}</div>
                  <p className="text-sm text-muted-foreground">Downloaded</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                    <Activity className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold">{documentAnalytics.viewed}</div>
                  <p className="text-sm text-muted-foreground">Viewed</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Documents */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2>Recent Documents</h2>
                  <Tabs defaultValue="all" className="w-auto" onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-3 w-auto">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="recent">Recent</TabsTrigger>
                      <TabsTrigger value="shared">Shared</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {recentDocuments.map((doc) => (
                    <Card key={doc.id} className="overflow-hidden group">
                      <div className="aspect-[3/4] bg-muted relative">
                        <img
                          src={doc.thumbnail || "/placeholder.svg"}
                          alt={doc.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(doc.status)}`}></span>
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="sm" variant="secondary">
                            <Edit3 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="secondary">
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium line-clamp-1">{doc.title}</h3>
                            <p className="text-xs text-muted-foreground">{doc.date}</p>
                          </div>
                          <Badge variant="outline">{doc.type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Popular Templates */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2>Popular Templates</h2>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/templates">
                      Browse templates
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {popularTemplates.map((template) => (
                    <Card key={template.id} className="overflow-hidden group">
                      <div className="aspect-video bg-muted relative">
                        <img
                          src={template.thumbnail || "/placeholder.svg"}
                          alt={template.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="sm">Use Template</Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div>
                          <h3 className="font-medium mb-1">{template.title}</h3>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{template.category}</Badge>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Star className="h-3 w-3 mr-1 fill-current text-yellow-500" />
                              <span>{template.uses.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your team's latest actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {activityTimeline.map((activity, index) => (
                      <div key={activity.id} className="flex">
                        <div className="mr-4 flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            {activity.icon}
                          </div>
                          {index < activityTimeline.length - 1 && (
                            <div className="h-full w-px bg-muted-foreground/20 mt-2"></div>
                          )}
                        </div>
                        <div className="space-y-1 pt-1">
                          <p className="text-sm">
                            <span className="font-medium">{activity.user}</span> {activity.action}{" "}
                            <span className="font-medium">{activity.document}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="#">View all activity</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Team Members */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>People you collaborate with</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {member.name.charAt(0)}
                              {member.name.split(" ")[1]?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${member.status === "online" ? "bg-green-500" : "bg-gray-300"} mr-2`}
                          ></span>
                          <span className="text-xs text-muted-foreground">
                            {member.status === "online" ? "Online" : "Offline"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Team Member
                  </Button>
                </CardFooter>
              </Card>

              {/* Upcoming Deadlines */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                  <CardDescription>Documents that need attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingDeadlines.map((deadline) => (
                      <div key={deadline.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{deadline.title}</p>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Due {deadline.deadline}</p>
                            </div>
                          </div>
                        </div>
                        {getPriorityBadge(deadline.priority)}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="#">View all deadlines</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 