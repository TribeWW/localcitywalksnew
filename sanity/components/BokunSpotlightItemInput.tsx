"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, Card, Stack, Text } from "@sanity/ui";
import type { ObjectInputProps } from "sanity";
import { set, unset } from "sanity";

type BokunProductOption = {
  id: string;
  title: string;
};

type SpotlightItemValue = {
  bokunProductId?: string;
  bokunProductTitle?: string;
};

function formatOptionLabel(o: BokunProductOption) {
  return `${o.title} — ${o.id}`;
}

function formatSelectedLabel(o: Partial<BokunProductOption> & { id: string }) {
  return o.title ?? o.id;
}

export default function BokunSpotlightItemInput(props: ObjectInputProps) {
  const { value, onChange, readOnly, elementProps } = props;
  const { id, ref, "aria-describedby": ariaDescribedBy } = elementProps;

  const current = (value as SpotlightItemValue | Record<string, unknown> | undefined) ?? {};
  const selectedId =
    typeof (current as SpotlightItemValue).bokunProductId === "string"
      ? (current as SpotlightItemValue).bokunProductId!
      : "";
  const selectedTitle =
    typeof (current as SpotlightItemValue).bokunProductTitle === "string"
      ? (current as SpotlightItemValue).bokunProductTitle!
      : "";

  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<BokunProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const lastRequestId = useRef(0);
  const [resolvedSelected, setResolvedSelected] =
    useState<BokunProductOption | null>(null);

  const optionById = useMemo(() => {
    const map = new Map<string, BokunProductOption>();
    for (const o of options) map.set(o.id, o);
    return map;
  }, [options]);

  const visibleOptions = useMemo(() => options.map((o) => ({ value: o.id })), [options]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setOptions([]);
      return;
    }

    const requestId = ++lastRequestId.current;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/bokun/search?q=${encodeURIComponent(query.trim())}`,
          { method: "GET" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { items: BokunProductOption[] };
        if (lastRequestId.current !== requestId) return;
        setOptions(Array.isArray(data.items) ? data.items : []);
      } finally {
        if (lastRequestId.current === requestId) setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (!selectedId || selectedTitle) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/bokun/product?id=${encodeURIComponent(selectedId)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { item: BokunProductOption | null };
      if (cancelled) return;
      if (data?.item?.id) setResolvedSelected(data.item);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, selectedTitle]);

  return (
    <Stack space={3}>
      <Autocomplete
        id={id}
        ref={ref}
        aria-describedby={ariaDescribedBy}
        readOnly={readOnly}
        loading={loading}
        placeholder="Search Bokun by title…"
        options={visibleOptions}
        value={selectedId}
        // We filter server-side by title; don't hide options by id filtering.
        filterOption={() => true}
        onQueryChange={(next) => setQuery(next ?? "")}
        renderOption={(opt) => (
          <Card padding={2} radius={2}>
            <Text size={1}>
              {formatOptionLabel(optionById.get(opt.value) ?? { id: opt.value, title: opt.value })}
            </Text>
          </Card>
        )}
        renderValue={(nextId) => {
          const o = optionById.get(nextId);
          if (o) return formatSelectedLabel(o);
          if (selectedTitle) return selectedTitle;
          if (resolvedSelected?.id === nextId) return formatSelectedLabel(resolvedSelected);
          return nextId;
        }}
        onSelect={(nextId) => {
          if (readOnly) return;
          const o = optionById.get(nextId);
          onChange(
            set({
              ...current,
              bokunProductId: nextId,
              bokunProductTitle: o?.title ?? (current as SpotlightItemValue).bokunProductTitle,
            }),
          );
        }}
      />

      <Text size={1} muted>
        Select by title. Stored as Bokun product ID for the frontend.
      </Text>

      {!readOnly && selectedId ? (
        <button
          type="button"
          onClick={() => onChange(unset())}
          style={{ textAlign: "left" }}
        >
          <Text size={1} muted>
            Clear selection
          </Text>
        </button>
      ) : null}
    </Stack>
  );
}

