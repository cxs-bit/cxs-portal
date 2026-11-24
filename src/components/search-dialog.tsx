"use client";

import { BookOpen01Icon, Cancel01Icon, Folder01Icon, Home01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Autocomplete, Dialog, Heading, Input, Menu, MenuItem, Modal, ModalOverlay, Text, TextField } from "react-aria-components";
import { searchPortfolio, type SearchResult } from "@/generated/portfolio";
import { Button } from "./ui/button";

const quickLinks: SearchResult[] = [
  { title: "Home", href: "/", description: "Portfolio overview", kind: "page" },
  { title: "Projects", href: "/projects", description: "Project index", kind: "page" },
  { title: "Devlog", href: "/blog", description: "Project updates and technical notes", kind: "page" },
];

const resultIcon = { page: Home01Icon, post: BookOpen01Icon, project: Folder01Icon };

type SearchState = { query: string; results: SearchResult[]; failed?: boolean };

export default function SearchDialog({ onClose }: { onClose: (restoreFocus: boolean) => void }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [state, setState] = useState<SearchState>();
  const [attempt, setAttempt] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const query = input.trim();

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await searchPortfolio({ q: query }, { signal: controller.signal });
        if (response.status !== 200) throw new Error("Search failed");
        if (!controller.signal.aborted) setState({ query, results: response.data.results });
      } catch {
        if (!controller.signal.aborted) setState({ query, results: [], failed: true });
      }
    }, 160);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, attempt]);

  const pending = Boolean(query && state?.query !== query);
  const failed = Boolean(query && !pending && state?.failed);
  const matches = query && !pending ? (state?.results ?? []) : [];
  const showQuickLinks = !query || (!pending && matches.length === 0);
  const results = showQuickLinks ? quickLinks : matches;
  const message = pending ? "Searching…" : failed ? "Search is temporarily unavailable." :
    query && matches.length === 0 ? "No results found." : "";

  function retrySearch() {
    setState(undefined);
    setAttempt((previous) => previous + 1);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <ModalOverlay isOpen isDismissable onOpenChange={(open) => !open && onClose(true)} className="search-overlay">
      <Modal className="search-modal">
        <Dialog className="search-dialog">
          <Heading slot="title" className="sr-only">Search portfolio</Heading>
          <Autocomplete inputValue={input} onInputChange={setInput} disableAutoFocusFirst>
            <div className="search-input-row">
              <HugeiconsIcon icon={Search01Icon} size={20} aria-hidden="true" />
              <TextField aria-label="Search portfolio" className="search-field">
                <Input ref={inputRef} autoFocus autoComplete="off" maxLength={100} placeholder="Search the portfolio…" />
              </TextField>
              <Button variant="ghost" size="icon" onClick={() => onClose(true)} aria-label="Close search">
                <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
              </Button>
            </div>
            <div className="search-results">
              <p role="status" className={message ? "search-status" : "sr-only"}>
                {message || (query ? `${matches.length} results` : "")}
              </p>
              {failed && <Button variant="outline" size="sm" className="search-retry" onClick={retrySearch}>Retry search</Button>}
              {showQuickLinks && <p className="eyebrow">Quick links</p>}
              <Menu
                aria-label="Search results"
                items={results}
                onAction={(key) => {
                  const result = results.find(({ href }) => href === key);
                  if (!result) return;
                  onClose(false);
                  router.push(result.href);
                }}
              >
                {(item) => {
                  const icon = resultIcon[item.kind];
                  return (
                    <MenuItem id={item.href} textValue={item.title} className="search-result">
                      <HugeiconsIcon icon={icon} size={18} aria-hidden="true" />
                      <span>
                        <Text slot="label" className="search-title">{item.title}</Text>
                        <Text slot="description" className="search-description">{item.description}</Text>
                      </span>
                    </MenuItem>
                  );
                }}
              </Menu>
            </div>
          </Autocomplete>
          <div className="search-hints" aria-hidden="true">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Open</span>
            <span><kbd>Esc</kbd> Close</span>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
