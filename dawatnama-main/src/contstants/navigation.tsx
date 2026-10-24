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

/** Dawatnama's own pages, shown first in the sidebar. */
export const navigation: NavItem[] = [
    {
        title: "Home",
        icon: "earth",
        href: "/",
    },
    {
        title: "Dashboard",
        icon: "dashboard",
        href: "/dashboard",
    },
    {
        title: "Invitations",
        icon: "product-think",
        list: [
            {
                title: "My invitations",
                href: "/invitations",
                match: ["^/dashboard/[^/]+$", "/design/"],
            },
            {
                title: "Templates",
                href: "/templates",
                match: ["/preview/"],
            },
            {
                title: "Designer cards",
                href: "/designs",
            },
            {
                title: "Card ideas",
                href: "/cards",
            },
        ],
    },
    {
        title: "Guests",
        icon: "profile",
        href: "/guests",
        match: ["/guests", "/rsvps"],
    },
    {
        title: "Plans",
        icon: "wallet",
        href: "/premium",
    },
    {
        title: "Settings",
        icon: "edit-profile",
        href: "/settings",
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
        title: "Dashboard",
        icon: "dashboard",
        href: "/dashboard",
    },
    {
        title: "My invitations",
        icon: "product-think",
        href: "/invitations",
    },
    {
        title: "Guests",
        icon: "profile",
        href: "/guests",
    },
    {
        title: "Edit profile",
        icon: "edit-profile",
        href: "/settings",
    },
    {
        title: "Contact us",
        icon: "chat-think",
        href: "/contact",
    },
    {
        title: "Upgrade to Premium",
        icon: "star-fill",
        href: "/premium",
    },
];

export const navigationKit: NavItem[] = [
    {
        title: "Demo dashboard",
        icon: "dashboard",
        href: "/demo",
    },
    {
        title: "Products",
        icon: "product-think",
        list: [
            {
                title: "Overview",
                href: "/products",
            },
            {
                title: "Drafts",
                href: "/products/drafts",
                counter: 2,
            },
            {
                title: "Released",
                href: "/products/released",
            },
            {
                title: "Comments",
                href: "/products/comments",
            },
            {
                title: "Scheduled",
                href: "/products/scheduled",
                counter: 8,
            },
        ],
    },
    {
        title: "Customers",
        icon: "profile",
        list: [
            {
                title: "Overview",
                href: "/customers",
            },
            {
                title: "Customer list",
                href: "/customers/customer-list",
            },
        ],
    },
    {
        title: "Shop",
        icon: "wallet",
        href: "/shop",
    },
    {
        title: "Income",
        icon: "income",
        list: [
            {
                title: "Earning",
                href: "/income/earning",
            },
            {
                title: "Refunds",
                href: "/income/refunds",
                counter: 3,
            },
            {
                title: "Payouts",
                href: "/income/payouts",
            },
            {
                title: "Statements",
                href: "/income/statements",
            },
        ],
    },
    {
        title: "Promote",
        icon: "promote",
        href: "/promote",
    },
];

export const navigationUserKit = [
    {
        title: "My shop",
        icon: "bag",
        href: "/shop",
    },
    {
        title: "Edit profile",
        icon: "edit-profile",
        href: "/demo/settings",
    },
    {
        title: "Analytics",
        icon: "chart",
        href: "/customers",
    },
    {
        title: "Affiliate center",
        icon: "chain-think",
        href: "/affiliate-center",
    },
    {
        title: "Explore creators",
        icon: "grid",
        href: "/explore-creators",
    },
    {
        title: "Upgrade to Pro",
        icon: "star-fill",
        href: "/upgrade-to-pro",
    },
];
