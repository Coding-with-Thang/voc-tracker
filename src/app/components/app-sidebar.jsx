"use client"

import {
    ChartScatter,
    Settings2,
    SquareTerminal,
} from "lucide-react"

import { NavMain } from "@@/components/nav-main"
import { NavUser } from "@@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"

const data = {
    user: {
        name: "thang_nguyen",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: SquareTerminal,
            items: [
                {
                    title: "Overview",
                    url: "/dashboard",
                },
            ],
        },
        {
            title: "Data",
            url: "/dashboard",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "Upload",
                    url: "/dashboard/data",
                },
                {
                    title: "View Data",
                    url: "/dashboard/view-data",
                },
                {
                    title: "VOC Data",
                    url: "/dashboard/voc",
                },
                {
                    title: "Survey Excel Upload (New)",
                    url: "/dashboard/data",
                },

            ],
        },
        {
            title: "Performance",
            url: "#",
            icon: ChartScatter,
            items: [
                {
                    title: "Trends",
                    url: "#",
                },
                {
                    title: "Analytics",
                    url: "#",
                },
                {
                    title: "View All",
                    url: "#",
                },
            ],
        },
        {
            title: "Users",
            url: "/dashboard/users",
            items: [
                {
                    title: "Voice Name Manager",
                    url: "/dashboard/users/voice-name-manager",
                },
                {
                    title: "User Management",
                    url: "/dashboard/users/user-management",
                },
            ],
        },
        {
            title: "Settings",
            url: "#",
            icon: Settings2,
            items: [
                {
                    title: "General",
                    url: "#",
                },
                {
                    title: "Team",
                    url: "#",
                },
                {
                    title: "Theme",
                    url: "#",
                },
            ],
        },
    ],
}

export function AppSidebar({ ...props }) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="mt-15">
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
