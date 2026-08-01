const currencyFormatter = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
})

/** Formats a price the way it should appear on the menu and bill, e.g.
 * `3.5` -> "3,50 €". */
export function formatPrice(amount: number): string {
    return currencyFormatter.format(amount)
}
