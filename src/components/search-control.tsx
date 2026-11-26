"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "./ui/button";

const SearchDialog = dynamic(() => import("./search-dialog"), { ssr: false });

export function SearchControl({ onOpen }: { onOpen?: () => void }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const previous = useRef<HTMLElement | null>(null);
  const [shortcut, setShortcut] = useState("Ctrl K");

  const openSearch = useCallback(() => {
    if (trigger.current?.closest("[inert]")) return;
    previous.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    onOpen?.();
    setOpen(true);
  }, [onOpen]);

  function closeSearch(restoreFocus: boolean) {
    setOpen(false);
    if (restoreFocus) {
      requestAnimationFrame(() => {
        const target = previous.current;
        (target?.isConnected && !target.closest('[aria-hidden="true"]') && target !== document.body ? target : trigger.current)?.focus();
      });
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.altKey || event.shiftKey || open) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, openSearch]);

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) {
      // The server defaults to the Windows and Linux label until the platform is known.
      return void requestAnimationFrame(() => setShortcut("⌘ K"));
    }
  }, []);

  return (
    <>
      <Button ref={trigger} variant="ghost" className="nav-search" onClick={openSearch}
        aria-label="Search" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K" aria-expanded={open}>
        <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
        <span className="nav-search-label">Search</span>
        <kbd aria-hidden="true">{shortcut}</kbd>
      </Button>
      {open && <SearchDialog onClose={closeSearch} />}
    </>
  );
}
