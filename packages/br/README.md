# @cbrl/br

Framework-free Brazilian domain utilities: phone numbers and WhatsApp links, BRL
money, CPF/CNPJ and CEP (with a BrasilAPI lookup). Pure TypeScript, zero runtime
dependencies, works in the browser and in Node.

```sh
pnpm add @cbrl/br
```

Import from the root or from a subpath (`@cbrl/br/phone`, `@cbrl/br/money`,
`@cbrl/br/tax-id`, `@cbrl/br/postal-code`).

## Phone

```ts
import {
  formatBrazilPhone,
  maskBrazilPhone,
  normalizeBrazilMobile,
  normalizeBrazilPhone,
  whatsappShareUrl,
  whatsappUrl,
} from '@cbrl/br/phone'

normalizeBrazilPhone('(11) 91234-5678') // '5511912345678' (E.164 digits, no '+')
normalizeBrazilPhone('1133334444') // '551133334444'
normalizeBrazilMobile('1133334444') // null: landline
formatBrazilPhone('5511912345678') // '(11) 91234-5678'
maskBrazilPhone('1191') // '(11) 91' (progressive, for inputs)
whatsappUrl('(11) 91234-5678', 'Olá!') // 'https://wa.me/5511912345678?text=Ol%C3%A1!'
whatsappShareUrl('Look at this https://example.com') // 'https://wa.me/?text=...'
```

## Money

```ts
import { formatBRL, formatBRLFromCents, formatBRLFromCentsRounded } from '@cbrl/br/money'

formatBRLFromCents(123456) // 'R$ 1.234,56'
formatBRLFromCentsRounded(123456) // 'R$ 1.235'
formatBRL(1234.5) // 'R$ 1.234,50'
```

Signed and symbol-less variants (dense grids, statements), all from integer cents:

```ts
import {
  formatAmountFromCents,
  formatSignedAmountFromCents,
  formatSignedBRLFromCents,
} from '@cbrl/br/money'

formatAmountFromCents(1094761) // '10.947,61'
formatSignedAmountFromCents(1094761) // '+10.947,61'
formatSignedBRLFromCents(-1000) // '-R$ 10,00' (positive gets '+', zero no sign)
```

Negatives use the ASCII hyphen-minus that `Intl.NumberFormat` emits (copy-paste
and parse friendly); swap in `−` (U+2212) at render time if you want the
typographic glyph.

Inputs: a bank-app style mask and a parser back to cents.

```ts
import { maskBRLInput, parseBRLInput, parseSignedBRLInput } from '@cbrl/br/money'

maskBRLInput('123456') // '1.234,56' (digits shift in from the cents side; 0 → '')
parseBRLInput('1.234,56') // 123456 (also '1234,56', '1234.56', '1.234', 'R$ 50')
parseBRLInput('abc') // null
parseSignedBRLInput('-10,50') // -1050 (accepts '-' or '−')
```

The space after `R$` is a non-breaking space (`\u00a0`), as `Intl.NumberFormat`
produces it.

## CPF / CNPJ

```ts
import {
  formatCnpj,
  formatCpf,
  isValidCnpj,
  isValidCpf,
  maskCnpj,
  maskCpf,
  normalizeCnpj,
  normalizeCpf,
  parseTaxId,
} from '@cbrl/br/tax-id'

isValidCpf('529.982.247-25') // true (check digits verified)
normalizeCnpj('11.222.333/0001-81') // '11222333000181', or null when invalid
parseTaxId('11.222.333/0001-81') // { kind: 'cnpj', value: '11222333000181' }
maskCpf('5299822') // '529.982.2'
formatCnpj('11222333000181') // '11.222.333/0001-81'
```

Only the numeric CNPJ is supported.

## CEP

```ts
import {
  formatPostalCode,
  lookupPostalCode,
  maskPostalCode,
  normalizePostalCode,
} from '@cbrl/br/postal-code'

normalizePostalCode('01310-100') // '01310100', or null
formatPostalCode('01310100') // '01310-100'

const result = await lookupPostalCode('01310-100', {
  init: { next: { revalidate: 604800 } }, // forwarded to fetch (Next.js caching)
})
if (result.ok) {
  result.address // { postalCode, state, city, neighborhood, street }
} else {
  result.reason // 'invalid' | 'not-found' | 'upstream'
}
```

`lookupPostalCode` calls BrasilAPI CEP v2 and validates the response at runtime:
missing or non-string fields become `''`. It never throws for upstream problems;
only an abort through `signal` (or `init.signal`) rejects. Pass `fetch` to inject
an implementation (tests, proxies) and `baseUrl` to point at another host.
