import { Separator } from '@radix-ui/react-separator';
import { FolderOpen, Languages, MessagesSquare, Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { ThemeToggle } from './theme-toggle';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
} from './ui/sidebar';
import { Toaster } from './ui/sonner';

const MENU_ITEMS = [
    {
        title: 'Categories',
        icon: FolderOpen,
        path: '/',
    },
    {
        title: 'Chat',
        icon: MessagesSquare,
        path: '/chat',
    },
] as const;

export const AppSidebar: React.FC = () => {
    const location = useLocation();
    const { isMobile, setOpenMobile } = useSidebar();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <span className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex items-center data-[state=open]:px-2 py-1 gap-2">
                    <span className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                        <Languages className="size-4" />
                    </span>
                    <span className="truncate font-medium">Cadmus</span>
                </span>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {MENU_ITEMS.map((item) => (
                                <SidebarMenuItem key={item.path}>
                                    <SidebarMenuButton asChild isActive={location.pathname === item.path}>
                                        <NavLink
                                            to={item.path}
                                            onClick={() => {
                                                if (isMobile) {
                                                    setOpenMobile(false);
                                                }
                                            }}
                                        >
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={location.pathname === '/settings'}>
                            <NavLink
                                to="/settings"
                                onClick={() => {
                                    if (isMobile) {
                                        setOpenMobile(false);
                                    }
                                }}
                            >
                                <Settings />
                                <span>Settings</span>
                            </NavLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();

    const getPageTitle = (): string => {
        if (location.pathname === '/settings') {
            return 'Settings';
        }
        if (location.pathname.startsWith('/review')) {
            return 'Review';
        }
        if (location.pathname.startsWith('/mistakes')) {
            return 'Missed';
        }
        if (location.pathname.startsWith('/songs')) {
            return 'Songs';
        }
        if (location.pathname.startsWith('/chat')) {
            return 'Chat';
        }
        return 'Categories';
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <Toaster />
                <header className="flex shrink-0 flex-col border-b transition-[width,height] ease-linear">
                    <div style={{ height: 'env(safe-area-inset-top)' }} />
                    <div className="flex h-(--header-height) items-center gap-2 px-4 lg:gap-2 lg:px-6 py-1">
                        <SidebarTrigger className="-ml-1 cursor-pointer" />
                        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                        <h1 className="text-base font-medium">{getPageTitle()}</h1>
                        <div className="ml-auto flex items-center gap-2">
                            <div className="flex justify-end bg-background p-2">
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 min-h-0 w-full overflow-y-auto p-6">{children}</main>
                <div style={{ height: 'env(safe-area-inset-bottom)' }} />
            </SidebarInset>
        </SidebarProvider>
    );
};
