export function roundMoney(value: unknown) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    throw new Error('Invalid money amount')
  }

  return Number(
    (
      Math.round((amount + Number.EPSILON) * 100) / 100
    ).toFixed(2),
  )
}

export function addMoney(...values: unknown[]) {
  const cents = values.reduce<number>((sum, value) => {
    const amount = Number(value)

    if (!Number.isFinite(amount)) {
      throw new Error('Invalid money amount')
    }

    return sum + Math.round((amount + Number.EPSILON) * 100)
  }, 0)

  return Number((cents / 100).toFixed(2))
}

export function multiplyMoney(
  amount: unknown,
  multiplier: unknown,
) {
  return roundMoney(Number(amount) * Number(multiplier))
}
