
import { describe, it, expect } from 'vitest';
import { formatBytes, formatFrequency, formatUptime } from './system-format';

describe('System Format Utils', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0.0 B');
      expect(formatBytes(100)).toBe('100.0 B');
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB');
    });

    it('should handle undefined', () => {
      expect(formatBytes(undefined)).toBe('--');
    });
  });

  describe('formatFrequency', () => {
    it('should format frequency correctly', () => {
      expect(formatFrequency(0)).toBe('0 MHz');
      expect(formatFrequency(500)).toBe('500 MHz');
      expect(formatFrequency(1000)).toBe('1.00 GHz');
      expect(formatFrequency(2500)).toBe('2.50 GHz');
    });

    it('should handle undefined', () => {
      expect(formatFrequency(undefined)).toBe('--');
    });
  });

  describe('formatUptime', () => {
    it('should format uptime correctly', () => {
      expect(formatUptime(0)).toBe('0分');
      expect(formatUptime(30)).toBe('0分');
      expect(formatUptime(60)).toBe('1分');
      expect(formatUptime(3600)).toBe('1小时 0分');
      expect(formatUptime(3665)).toBe('1小时 1分');
      expect(formatUptime(86400)).toBe('1天 0小时 0分');
      expect(formatUptime(90065)).toBe('1天 1小时 1分');
    });

    it('should handle undefined', () => {
      expect(formatUptime(undefined)).toBe('--');
    });
  });
});
