export const pathMatches = (pathname: string, m: string) =>
    m.startsWith("^") ? new RegExp(m).test(pathname) : pathname.includes(m);

export type NavItem = {
    title: string;
    icon: string;
    href?: string;
    /** Other paths that count as this page: a piece of the path, or a regular expression starting with ^. */
    match?: string[];
    counter?: number;
    list?: { title: string; href: string; match?: string[]; counter?: number }[];
};

/** The sidebar: only what people need. */
export const navigation: NavItem[] = [
    {
        title: "My cards",
        icon: "dashboard",
        href: "/dashboard",
        match: ["^/dashboard/[^/]+$", "/design/", "/invitations"],
    },
    {
        title: "New card",
        icon: "plus",
        href: "/templates",
        match: ["/preview/"],
    },
    {
        title: "Guests & replies",
        icon: "profile",
        href: "/guests",
        match: ["/guests", "/rsvps"],
    },
    {
        title: "Settings",
        icon: "edit-profile",
        href: "/settings",
    },
    {
        title: "Help",
        icon: "help",
        href: "/contact",
    },
];

export const navigationAdmin: NavItem = {
    title: "Admin",
    icon: "lock",
    href: "/admin",
};

/** The user menu (avatar, top right). */
export const navigationUser = [
    {
        title: "My cards",
        icon: "dashboard",
        href: "/dashboard",
    },
    {
        title: "New card",
        icon: "plus",
        href: "/templates",
    },
    {
        title: "Guests & replies",
        icon: "profile",
        href: "/guests",
    },
    {
        title: "Settings",
        icon: "edit-profile",
        href: "/settings",
    },
    {
        title: "Website home",
        icon: "earth",
        href: "/",
    },
];
