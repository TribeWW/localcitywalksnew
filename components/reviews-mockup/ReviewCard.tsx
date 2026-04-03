"use client";

import { Star } from "lucide-react";

export interface ReviewCardProps {
  name: string;
  location: string;
  date: string;
  rating: number;
  text: string;
  /** Optional max lines for text truncation (useful in grid/carousel layouts) */
  maxLines?: number;
  /** Optional callback when "Read more" is clicked */
  onReadMore?: () => void;
}

export function ReviewCard({
  name,
  location,
  date,
  rating,
  text,
  maxLines,
  onReadMore,
}: ReviewCardProps) {
  return (
    <div
      style={{
        padding: 24,
        border: "1.5px solid #D3CED2",
        borderRadius: 8,
        fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 16,
        }}
      >
        {Array.from({ length: 5 }).map((_, s) => (
          <Star
            key={s}
            size={14}
            fill={s < rating ? "#0F172A" : "none"}
            color={s < rating ? "#0F172A" : "#D3CED2"}
          />
        ))}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#0F172A",
          marginBottom: 4,
        }}
      >
        {name} — {location}
      </div>

      <div
        style={{
          fontSize: 12,
          color: "#6A6A6A",
          marginBottom: 16,
        }}
      >
        {date}
      </div>

      <p
        style={{
          fontSize: 14,
          color: "#1A1A1A",
          lineHeight: 1.6,
          margin: 0,
          flex: 1,
          ...(maxLines
            ? {
                display: "-webkit-box",
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }
            : {}),
        }}
      >
        {text}
      </p>

      {onReadMore ? (
        <button
          type="button"
          onClick={onReadMore}
          style={{
            marginTop: 16,
            fontSize: 14,
            fontWeight: 500,
            color: "#0F172A",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            textDecorationThickness: 1,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
            textAlign: "left",
          }}
        >
          Read more
        </button>
      ) : null}
    </div>
  );
}
