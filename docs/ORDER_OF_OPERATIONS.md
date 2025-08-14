# Trade Validation Pipeline

This document outlines the validation rules used in the trade machine, their order of execution, and interdependencies between rules.

## Validation Order

The trade validator follows this specific sequence to ensure rules are validated in the correct order:

1. **Pre-processing**
   - Apply BYC (Base Year Compensation) conversions
   - Apply poison pill and trade kicker adjustments
   - Normalize cap settings and team salary data

2. **Team-level Validation Pipeline**
   1. **Sign-and-Trade Rules** 
      - Must be executed in offseason
      - Must be executed by player's original team (with Bird rights)
      - Player must be traded alone (no aggregation with other players/picks)
      - Contract must be 3-4 years with first year guaranteed
      - Team receiving S&T player will be hard-capped at first apron
      - Teams using taxpayer MLE cannot receive S&T players

   2. **Hard Cap Rules**
      - Teams cannot exceed the first apron if they are hard-capped
      - Hard caps come from sign-and-trades, using the non-taxpayer MLE, BAE, or certain other exceptions
      - Post-trade salaries must stay below the first apron threshold

   3. **Second Apron Restrictions** (if no hard cap violation)
      - Teams above second apron can only take back equal or less salary
      - Second apron teams cannot aggregate multiple player salaries
      - Second apron teams cannot use prior-year TPEs
      - Second apron teams cannot send or receive cash

   4. **Player Consent & Eligibility**
      - Players with no-trade clauses must consent
      - Limited no-trade clauses must allow the destination
      - Bird rights veto applies for certain one-year contracts
      - Re-acquisition rules (1-year rule, waiver rules)

   5. **Salary Matching** (skipped for second apron violations)
      - Over-cap teams must match within allowed bands
      - Under-cap teams can absorb salary up to the cap
      - First apron teams limited to 100% matching

   6. **Cash Considerations**
      - Second apron teams cannot send/receive cash
      - Cash must be within seasonal limits
      - Cash considerations don't affect salary matching

   7. **Draft Pick Rules**
      - Stepien Rule: No consecutive future first-round picks
      - Protected picks can bypass Stepien rule
      - Cannot trade picks more than 7 years out

   8. **Roster Requirements**
      - Post-trade roster size must be within limits (usually 14-15 during season)
      - Two-way contract limits
      - Minimum roster requirements

   9. **Trade & FA Exceptions**
      - TPEs cannot be aggregated with outgoing salary
      - Second apron teams cannot use prior-year TPEs
      - FA exceptions create hard caps at first apron

## Rule Dependencies and Priority

This section outlines which rules depend on others and their priority order:

1. **Hard Cap Priority**
   - If a team has Sign-and-Trade hard cap violations, Second Apron validation is skipped
   - Second Apron violations take priority over standard salary matching

2. **Salary Conversions**
   - BYC and poison pill adjustments must happen before any salary matching
   - These modified values are used for all subsequent validations

3. **TPE and FA Exception Dependencies**
   - Second Apron status determines TPE eligibility
   - FA Exception usage impacts hard cap status

4. **Violation Prioritization**
   - Second Apron violations are displayed first
   - Other violations are shown in the order of the validation pipeline

## CBA Thresholds and Limits

Key thresholds used in the validation rules (for 2024-25 season):

- **Salary Cap**: $140,588,000
- **Luxury Tax Line**: $170,818,000  
- **First Apron**: $178,132,000
- **Second Apron**: $188,938,000
- **Salary Matching Bands**:
  - 125% + $100,000 for salaries up to $7.1M
  - 177.8% for salaries $7.1M to $13.8M
  - 125% + $5M for salaries above $13.8M

## Error Handling Strategy

- Most rules return a consistent structure: `{ passed, violations, message, details }`
- Rules can be toggled between 'error', 'warn', and 'off' modes via validation flags
- Financial violations include specific salary amounts for clarity
- Rules are applied to each team separately, then aggregated for the overall trade
