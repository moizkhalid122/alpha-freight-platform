import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  showText?: boolean;
  className?: string;
  href?: string;
  textClassName?: string;
  iconClassName?: string;
};

export default function BrandMark({
  showText = true,
  className = "",
  href = "/",
  textClassName = "text-base font-bold tracking-tight text-gray-900",
  iconClassName = "h-8 w-8",
}: BrandMarkProps) {
  const content = (
    <>
      <Image
        src="/logo.png"
        alt="Alpha Freight Logo"
        width={32}
        height={32}
        className={`shrink-0 object-contain ${iconClassName}`}
        priority
      />
      {showText ? (
        <span className={`truncate ${textClassName}`}>Alpha Freight</span>
      ) : null}
    </>
  );

  const rootClassName = `flex min-w-0 items-center gap-2.5 ${className}`;

  if (href) {
    return (
      <Link href={href} className={rootClassName}>
        {content}
      </Link>
    );
  }

  return <div className={rootClassName}>{content}</div>;
}
