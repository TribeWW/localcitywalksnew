# PostHog Self-driving setup report

## Summary

PostHog Self-driving is configured for this web application. Session Replay, Error Tracking, and Support are enabled, and native responders for health checks, error tracking, and support tickets are active.

New Self-driving findings begin appearing within roughly 30 minutes in the [Self-driving inbox](https://eu.posthog.com/project/308333/inbox).

## AI data processing

Approved.

## GitHub

Connected before this setup run through the PostHog GitHub App.

## Products enabled

| Product | Result | Integration check |
| --- | --- | --- |
| Session Replay | enabled | Web SDK initialization does not disable recording. No recordings existed in the prior 30-day check, so monitors are armed for future sessions. |
| Error Tracking | enabled | Web SDK initialization has exception capture enabled. |
| Support | enabled | Tickets begin arriving only after an inbound channel is connected. |

## Signal sources

| Source product | Source type | Action |
| --- | --- | --- |
| `signals_scout` | `cross_source_issue` | On by default; no opt-out row existed. |
| `health_checks` | `health_issue` | Enabled. |
| `error_tracking` | `issue_created` | Enabled. |
| `error_tracking` | `issue_reopened` | Enabled. |
| `error_tracking` | `issue_spiking` | Enabled. |
| `conversations` | `ticket` | Enabled. |
| `logs` | `alert_state_change` | Skipped: Logs usage was not evidenced. |
| `endpoints` | execution-failure and breakdown-limit responders | Skipped: endpoint usage could not be confirmed. |
| Session Replay | native responder | Not created; Replay Vision scanners below are the supported Self-driving route. |

## Connected tools

No external issue-tracker or support-tool responders were selected. GitHub remains connected for code context, but GitHub Issues was not enabled as a Self-driving source.

## Scout troop

### Active troop

- **General** — cross-product patterns and otherwise uncovered surfaces.
- **Product analytics** — core journey and conversion behavior.
- **Web analytics** — traffic, attribution, and landing-page health.
- **Feature flags** — flag evaluation changes and flag debt.
- **Revenue analytics** — revenue-data and payment integration health.
- **Booking-to-payment conversion health** — custom checkout-funnel coverage.
- **Paid-booking fulfillment integrity** — custom post-payment confirmation coverage.

**Inbox validation** is the enabled operational scout. It runs report follow-up checks and sits outside the recommended troop ceiling.

### Disabled built-in scouts

| Scout | Reason left disabled |
| --- | --- |
| AI observability | No LLM usage evidence. |
| Anomaly detection | No established dashboard or insight surface was identified. |
| APM | No distributed tracing evidence. |
| Conversations | No connected inbound support channel yet. |
| CSP violations | No CSP reporting evidence. |
| Customer analytics | No account-level analytics evidence. |
| Data pipelines | No CDP or export pipeline evidence. |
| Data warehouse | No warehouse sources were connected. |
| Error tracking | Covered by the enabled native Error Tracking responders. |
| Experiments | No active experiment evidence. |
| Insight alerts | No alerting surface was identified. |
| Logs | No Logs usage evidence. |
| MCP tool calls | No MCP telemetry surface in this product. |
| Observability gaps | Kept off to preserve a selective troop. |
| PR follow-up | No pull-request telemetry surface was selected. |
| Replay Vision | Kept off because the new scanners have no observations yet. |
| Session Replay | Covered by the Replay Vision monitors below. |
| Skills store | No skills-store usage surface was identified. |
| Surveys | No surveys were found. |
| Tasks | No PostHog Tasks usage evidence. |
| Unused features | Kept off to preserve a selective troop. |
| Web vitals | No web-vitals event evidence. |
| Workflows | No workflow usage evidence. |

### Limits

- Daily scout budget: **100** runs; **0** used and **100** remaining when configured.
- Enabled-scout cap: **250**. The initial slot calculation left **249** non-operational slots free (one operational scout was active).
- Troop size: 7 active non-operational scouts, leaving room beneath the recommended ceiling of about 10.
- Early-access banner: “Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more.”

## Custom scouts

| Scout | What it watches | Discriminator | Why custom |
| --- | --- | --- | --- |
| `signals-scout-booking-payment-funnel` | The tour booking handoff through payment start and paid confirmation. | A sustained, broad-reach drop in a later conversion step while prior-step volume remains normal. | The built-in product-analytics scout is broad and operates on saved flows; this is a dedicated checkout path. |
| `signals-scout-paid-booking-fulfillment` | Payment starts that do not reach paid-booking confirmation after the normal settlement window. | A material, worsening delayed-confirmation share with enough checkout volume. | Revenue monitoring covers integration and configuration health; this is specific to the product's post-payment booking lifecycle. |

Considerations ruled out: error bursts are covered by the native Error Tracking responders; replay friction is covered by the scanners below; web traffic, feature flags, and revenue already have built-in specialists; contact and custom-tour forms did not show a complete success/failure event loop suitable for a high-confidence custom scout.

If either custom scout proves noisy, set its `emit` configuration to `false` in PostHog to switch it to dry-run rather than deleting it.

## Replay Vision scanners

A Replay Vision scanner is an LLM that watches individual session recordings on a schedule and pushes eligible findings to the inbox. It is the only part of this setup that spends Replay Vision quota. Scanner findings arrive at half weight and require independent corroboration before becoming a Self-driving report.

| Scanner | Status | What it watches | Query scope | Sampling | Estimate |
| --- | --- | --- | --- | --- | --- |
| Checkout experience breakage | created | Visible, materially blocking defects in checkout or confirmation. | Recordings that visit `/checkout`, the product’s checkout and success-flow route. | Focused, 100% | 0 matching sessions in the 7-day estimate; 0 observations and 0 credits/month. |
| Frustrated rage clicks | created | Repeated clicks where a visible control fails to respond or blocks progress. | Recordings containing `$rageclick`; deliberately has no URL scope to avoid broadening overlap with the checkout monitor. | Focused, 100% | 0 matching sessions in the 7-day estimate; 0 observations and 0 credits/month. |

Replay Vision budget at setup: 2,500 credits remaining, 0 used, not exhausted. The project had no recent recordings, so both scanners are armed and begin observing as soon as matching recordings arrive. Rate early observations in the scanner UI with a thumbs-up or thumbs-down and a short note to improve their future results.

## Follow-ups

- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog so the enabled ticket responder receives conversations.
- [ ] Configure `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` in the runtime environment used by this repository. Neither was set in the local environment scan, so the existing SDK initialization will not send events until deployment/runtime configuration supplies them.
- [ ] After the first Replay Vision observations, review and rate scanner results to calibrate the prompts.
- [ ] Reauthorize the MCP connection with event-schema read scopes if you want interactive schema validation from the setup tooling; the local source code was used to identify the booking events in this run.

## What happens next

Fresh scout configurations are picked up by the coordinator within roughly 30 minutes. Their runs draw from the daily budget, findings cluster into reports in the Self-driving inbox, and immediately actionable reports can begin coding tasks.

## Files modified or created

- Created `posthog-self-driving-report.md`.
- No application source files were modified; the repository already initializes `posthog-js` without disabling Session Replay or exception capture.
