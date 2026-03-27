import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Render a breadcrumb navigation container.
 *
 * Adds `aria-label="breadcrumb"` and `data-slot="breadcrumb"` to the element and forwards all other props to the underlying `<nav>`.
 *
 * @param props - Props to be passed to the rendered `<nav>` element
 * @returns The rendered breadcrumb `<nav>` element
 */
function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />
}

/**
 * Renders the breadcrumb list container as an ordered list with default layout and typography classes.
 *
 * @param className - Additional CSS classes merged with the component's default classes
 * @param props - Remaining props forwarded to the underlying `<ol>` element
 * @returns The rendered `<ol>` element configured as a breadcrumb list
 */
function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2.5",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders a breadcrumb list item wrapper.
 *
 * @param className - Additional CSS classes merged with the default inline-flex layout and spacing
 * @param props - Other props forwarded to the underlying `<li>` element
 * @returns The `<li>` element used as a breadcrumb item
 */
function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

/**
 * Renders a breadcrumb link element, using a native anchor by default or a provided child component when `asChild` is true.
 *
 * When `asChild` is `true`, the component renders `Slot.Root` so the caller's element is used; otherwise it renders an `<a>`. The rendered element receives `data-slot="breadcrumb-link"` and the merged class names.
 *
 * @param asChild - If `true`, render the passed child component instead of a native `<a>`
 * @param className - Additional class names to merge with the component's default styles
 * @returns The rendered link element (an `<a>` or the provided child component) with breadcrumb-specific attributes and styles
 */
function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "a"

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  )
}

/**
 * Renders the current page breadcrumb as a non-navigational span.
 *
 * The element is marked with `role="link"`, `aria-current="page"`, and `aria-disabled="true"`,
 * and merges the provided `className` with the component's default typography classes.
 *
 * @returns The breadcrumb page element (`<span>`).
 */
function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      {...props}
    />
  )
}

/**
 * Renders a breadcrumb separator list item.
 *
 * If `children` is not provided, a `ChevronRight` icon is rendered by default.
 *
 * @param children - Optional custom separator content to render instead of the default icon
 * @param className - Additional class names to merge with the component's default styling
 * @returns The `<li>` element used as the visual separator between breadcrumb items
 */
function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

/**
 * Renders a decorative ellipsis indicator for truncated breadcrumb lists.
 *
 * The element contains an ellipsis icon and a visually hidden "More" label,
 * and is marked as presentation (`role="presentation"`, `aria-hidden="true"`).
 *
 * @returns A `<span>` used as a decorative breadcrumb ellipsis containing the icon and hidden label.
 */
function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
