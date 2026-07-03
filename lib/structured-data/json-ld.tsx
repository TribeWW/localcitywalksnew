/**
 * Renders schema.org JSON-LD as an inline `<script>` tag for server components.
 */

type JsonLdData = Record<string, unknown> | Record<string, unknown>[];

type JsonLdProps = {
  /** One schema object or an array of objects (e.g. `@graph` entries). */
  data: JsonLdData;
};

/**
 * Injects JSON-LD structured data into the document head/body.
 *
 * @param props.data - Schema.org object(s) to serialize.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
