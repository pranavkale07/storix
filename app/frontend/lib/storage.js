/**
 * Centralized localStorage management for Storix
 * 
 * localStorage Keys:
 * - "user": User object { id, email }
 * - "token": JWT authentication token
 * - "activeBucket": Active bucket info { id, bucket, provider, region, endpoint }
 */

export class StorageManager {
  // User management
  static setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  static getUser() {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }

  static removeUser() {
    localStorage.removeItem('user');
  }

  // Token management
  static setToken(token) {
    localStorage.setItem('token', token);
  }

  static getToken() {
    return localStorage.getItem('token');
  }

  static removeToken() {
    localStorage.removeItem('token');
  }

  // Bucket management
  static setActiveBucket(bucketInfo) {
    if (bucketInfo) {
      localStorage.setItem('activeBucket', JSON.stringify(bucketInfo));
    } else {
      localStorage.removeItem('activeBucket');
    }
  }

  static getActiveBucket() {
    const stored = localStorage.getItem('activeBucket');
    return stored ? JSON.parse(stored) : null;
  }

  static removeActiveBucket() {
    localStorage.removeItem('activeBucket');
  }

  // Session management
  static setSession(user, token) {
    this.setUser(user);
    this.setToken(token);
  }

  static getSession() {
    return {
      user: this.getUser(),
      token: this.getToken(),
      activeBucket: this.getActiveBucket()
    };
  }

  static clearSession() {
    this.removeUser();
    this.removeToken();
    this.removeActiveBucket();
  }

  // Check if user is authenticated
  static isAuthenticated() {
    return !!(this.getUser() && this.getToken());
  }

  // Get all localStorage data for debugging
  static getAllData() {
    return {
      user: this.getUser(),
      token: this.getToken(),
      activeBucket: this.getActiveBucket(),
      hasUser: !!this.getUser(),
      hasToken: !!this.getToken(),
      hasActiveBucket: !!this.getActiveBucket(),
      isAuthenticated: this.isAuthenticated()
    };
  }
} 