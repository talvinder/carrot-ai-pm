/**
 * Simple rate limiter to limit the number of operations within a time window
 */
export class RateLimiter {
  private readonly limit: number;
  private readonly timeWindow: number;
  private timestamps: number[] = [];

  /**
   * Create a new rate limiter
   * @param limit Maximum number of operations allowed
   * @param timeWindow Time window in milliseconds
   */
  constructor(limit: number, timeWindow: number) {
    this.limit = limit;
    this.timeWindow = timeWindow;
  }

  /**
   * Try to acquire a token for an operation
   * @returns true if operation is allowed, false if rate limit exceeded
   */
  tryAcquire(): boolean {
    const now = Date.now();
    
    // Remove timestamps that are outside the time window
    this.timestamps = this.timestamps.filter(timestamp => 
      now - timestamp < this.timeWindow
    );
    
    // Check if we've reached the limit
    if (this.timestamps.length >= this.limit) {
      return false;
    }
    
    // Add the current timestamp
    this.timestamps.push(now);
    return true;
  }

  /**
   * Get the number of operations remaining within the current time window
   */
  getRemainingOperations(): number {
    const now = Date.now();
    
    // Remove timestamps that are outside the time window
    this.timestamps = this.timestamps.filter(timestamp => 
      now - timestamp < this.timeWindow
    );
    
    return Math.max(0, this.limit - this.timestamps.length);
  }

  /**
   * Get the time until the next operation is allowed (in milliseconds)
   * Returns 0 if an operation is currently allowed
   */
  getTimeUntilNextAllowed(): number {
    if (this.getRemainingOperations() > 0) {
      return 0;
    }
    
    const now = Date.now();
    const oldestTimestamp = Math.min(...this.timestamps);
    
    return Math.max(0, this.timeWindow - (now - oldestTimestamp));
  }
} 