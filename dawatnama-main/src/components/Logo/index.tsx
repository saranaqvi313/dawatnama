import Link from "next/link";

type LogoProps = {
    className?: string;
};

/** Dawatnama's mark, in the kit's logo slot (same size and place). */
const Logo = ({ className }: LogoProps) => {
    return (
        <Link
            className={`block w-12 h-12 ${className || ""}`}
            href="/"
            aria-label="Dawatnama home"
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                className="size-full"
                src="/images/logo-dawatnama.svg"
                alt="Dawatnama"
                width={48}
                height={48}
            />
        </Link>
    );
};

export default Logo;
