import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="site-wrap content-page">
      <header className="page-heading">
        <h1>Page not found<span>.</span></h1>
        <p>The page may have moved, or the address may be incorrect.</p>
      </header>
      <Link href="/" className={buttonVariants()}>Go home</Link>
    </div>
  );
}
