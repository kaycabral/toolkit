# @cbrl/br

## 0.2.0

### Minor Changes

- [#57](https://github.com/kaycabral/toolkit/pull/57) [`ae61bd6`](https://github.com/kaycabral/toolkit/commit/ae61bd6649c3c43eda359b5f3c6875e39f45b614) Thanks [@kaycabral](https://github.com/kaycabral)! - Money: `formatAmountFromCents` (no currency symbol), signed variants `formatSignedAmountFromCents`/`formatSignedBRLFromCents` (`+` on positives), `parseBRLInput`/`parseSignedBRLInput` (pt-BR input → integer cents) and `maskBRLInput` (bank-app style input mask).

## 0.1.0

### Minor Changes

- [#16](https://github.com/kaycabral/toolkit/pull/16) [`31ad027`](https://github.com/kaycabral/toolkit/commit/31ad0274d65a5a67ea8b3a3408c17d3c13019a02) Thanks [@kaycabral](https://github.com/kaycabral)! - New `@cbrl/br` package: framework-free Brazilian domain utilities with zero runtime dependencies. It ships phone normalization, formatting and input masks plus WhatsApp link builders (`@cbrl/br/phone`), BRL formatters for reais and integer cents (`@cbrl/br/money`), CPF/CNPJ validation with check digits, normalization, formatting and masks (`@cbrl/br/tax-id`), and CEP normalization, formatting, masking and a BrasilAPI v2 lookup that returns a discriminated result instead of throwing (`@cbrl/br/postal-code`). Everything is also re-exported from the root.
