/** Errores de negocio: se muestran al cliente con un mensaje seguro. */
export class DomainError extends Error {
  constructor(
    readonly code: 'UNKNOWN_SKU' | 'INVALID_QUANTITY' | 'EMPTY_CART' | 'TOO_MANY_LINES' | 'UNAVAILABLE',
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
