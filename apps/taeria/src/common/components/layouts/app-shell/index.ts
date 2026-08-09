/**
 * AppShell — layout estilo AWS Console.
 *
 * @example
 * ```tsx
 * <AppShell sidebar={{ enabled: true, defaultOpen: true, width: 260 }}>
 *   <AppShellNavbar>
 *     <AppShellNavbarStart>
 *       <AppShellBrand title="Taeria" href="/" />
 *     </AppShellNavbarStart>
 *     <AppShellNavbarEnd>
 *       <AppShellNotifications notifications={[...]} />
 *       <AppShellUserMenu user={{ name: "User", email: "u@x.com" }} />
 *     </AppShellNavbarEnd>
 *   </AppShellNavbar>
 *
 *   <AppShellToolbar>
 *     <AppShellToolbarEnd>
 *       <AppShellPanelTrigger panelId="help" aria-label="Ajuda">
 *         <HelpCircleIcon />
 *       </AppShellPanelTrigger>
 *     </AppShellToolbarEnd>
 *   </AppShellToolbar>
 *
 *   <AppShellSidebar>{/* nav links *\/}</AppShellSidebar>
 *
 *   <AppShellPanel id="help" title="Ajuda" width={320}>
 *     {/* conteúdo scrollável *\/}
 *   </AppShellPanel>
 *
 *   <AppShellMain>{children}</AppShellMain>
 * </AppShell>
 * ```
 */

import { AppShell as AppShellRoot } from "./app-shell";
import { AppShellBrand } from "./app-shell-brand";
import {
  AppShellBreadcrumb,
  AppShellBreadcrumbs,
} from "./app-shell-breadcrumb";
import { segmentsToBreadcrumbs } from "./app-shell-breadcrumb-utils";
import {
  AppShellProvider,
  useAppShell,
  useAppShellBreadcrumbs,
} from "./app-shell-context";
import { AppShellMain } from "./app-shell-main";
import {
  AppShellNavbar,
  AppShellNavbarCenter,
  AppShellNavbarEnd,
  AppShellNavbarStart,
} from "./app-shell-navbar";
import { AppShellNotifications } from "./app-shell-notifications";
import { AppShellPanel } from "./app-shell-panel";
import { AppShellPanelTrigger } from "./app-shell-panel-trigger";
import { AppShellSidebar } from "./app-shell-sidebar";
import { AppShellSidebarToggle } from "./app-shell-sidebar-toggle";
import { AppShellThemeToggle } from "./app-shell-theme-toggle";
import {
  AppShellToolbar,
  AppShellToolbarEnd,
  AppShellToolbarStart,
} from "./app-shell-toolbar";
import { AppShellUserMenu } from "./app-shell-user-menu";

const AppShell = Object.assign(AppShellRoot, {
  Navbar: AppShellNavbar,
  NavbarStart: AppShellNavbarStart,
  NavbarCenter: AppShellNavbarCenter,
  NavbarEnd: AppShellNavbarEnd,
  Brand: AppShellBrand,
  UserMenu: AppShellUserMenu,
  Notifications: AppShellNotifications,
  ThemeToggle: AppShellThemeToggle,
  Toolbar: AppShellToolbar,
  ToolbarStart: AppShellToolbarStart,
  ToolbarEnd: AppShellToolbarEnd,
  SidebarToggle: AppShellSidebarToggle,
  Breadcrumb: AppShellBreadcrumb,
  Breadcrumbs: AppShellBreadcrumbs,
  Sidebar: AppShellSidebar,
  Panel: AppShellPanel,
  PanelTrigger: AppShellPanelTrigger,
  Main: AppShellMain,
});

export {
  AppShell,
  AppShellProvider,
  AppShellBrand,
  AppShellBreadcrumb,
  AppShellBreadcrumbs,
  AppShellMain,
  AppShellNavbar,
  AppShellNavbarCenter,
  AppShellNavbarEnd,
  AppShellNavbarStart,
  AppShellNotifications,
  AppShellPanel,
  AppShellPanelTrigger,
  AppShellSidebar,
  AppShellSidebarToggle,
  AppShellThemeToggle,
  AppShellToolbar,
  AppShellToolbarEnd,
  AppShellToolbarStart,
  AppShellUserMenu,
  segmentsToBreadcrumbs,
  useAppShell,
  useAppShellBreadcrumbs,
};

export type {
  AppShellBreadcrumbItem,
  AppShellPanelState,
  AppShellSidebarConfig,
} from "./app-shell-types";

export type { AppShellNotification } from "./app-shell-notifications";

export type {
  AppShellUserMenuItem,
  AppShellUserMenuUser,
} from "./app-shell-user-menu";
